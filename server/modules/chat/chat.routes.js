import express from "express";
import { protect } from "../../middleware/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import HandleError from "../../utils/HandleError.js";
import { ChatConversation, ChatMessage } from "./chat.model.js";

const router = express.Router();
router.use(protect);
const validKey = (key) => typeof key === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(key);
const conversationJSON = (item) => ({
  id: item.key, name: item.name,
  pinned: Boolean(item.pinned), muted: Boolean(item.muted), archived: Boolean(item.archived),
});
const messageJSON = (item) => ({
  id: item.clientId,
  conversationId: item.conversationKey,
  side: "mine",
  type: item.type,
  text: item.text,
  fileName: item.fileName,
  fileMeta: item.fileMeta,
  replyToId: item.replyToClientId,
  pinned: Boolean(item.pinned),
  edited: Boolean(item.editedAt),
  createdAt: item.createdAt,
  status: "✓",
});

// The unique owner/key index also protects against simultaneous first visits.
async function ensureSaved(userId) {
  try {
    await ChatConversation.updateOne({ userId, key: "saved" }, {
      $setOnInsert: { name: "Save Message" },
    }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
}

router.get("/", catchAsync(async (req, res) => {
  const userId = req.user._id;
  await ensureSaved(userId);
  const [conversations, messages] = await Promise.all([
    ChatConversation.find({ userId, deleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
    ChatMessage.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean(),
  ]);
  const visible = new Map(conversations.map((item) => [item.key, item]));
  const visibleMessages = messages.filter((item) => {
    const conversation = visible.get(item.conversationKey);
    return conversation && (!conversation.clearedAt || item.createdAt > conversation.clearedAt);
  });
  res.json({ conversations: conversations.map(conversationJSON), messages: visibleMessages.map(messageJSON) });
}));

router.post("/conversations", catchAsync(async (req, res) => {
  const { id, name } = req.body;
  if (!validKey(id) || id === "saved" || typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    throw new HandleError("اطلاعات گفتگو معتبر نیست", 400);
  }
  const filter = { userId: req.user._id, key: id };
  let conversation;
  try {
    conversation = await ChatConversation.findOneAndUpdate(filter, {
      $setOnInsert: { name: name.trim() },
    }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    conversation = await ChatConversation.findOne(filter);
  }
  res.status(201).json({ conversation: conversationJSON(conversation) });
}));

router.patch("/:conversationId", catchAsync(async (req, res) => {
  const fields = ["pinned", "muted", "archived"];
  const keys = Object.keys(req.body);
  if (!keys.length || keys.some((key) => !fields.includes(key) || typeof req.body[key] !== "boolean")) {
    throw new HandleError("تنظیمات گفتگو معتبر نیست", 400);
  }
  const conversation = await ChatConversation.findOneAndUpdate({
    userId: req.user._id, key: req.params.conversationId, deleted: { $ne: true },
  }, { $set: req.body }, { new: true, runValidators: true });
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
  res.json({ conversation: conversationJSON(conversation) });
}));

router.delete("/:conversationId/history", catchAsync(async (req, res) => {
  const conversation = await ChatConversation.findOne({
    userId: req.user._id, key: req.params.conversationId, deleted: { $ne: true },
  });
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
  const clearedAt = new Date();
  conversation.clearedAt = clearedAt;
  await conversation.save();
  await ChatMessage.deleteMany({
    userId: req.user._id,
    conversationKey: req.params.conversationId,
    createdAt: { $lte: clearedAt },
  });
  res.json({ conversation: conversationJSON(conversation), cleared: true });
}));

router.delete("/:conversationId", catchAsync(async (req, res) => {
  if (req.params.conversationId === "saved") {
    throw new HandleError("پیام‌های ذخیره‌شده قابل حذف نیست", 403);
  }
  const conversation = await ChatConversation.findOneAndUpdate({
    userId: req.user._id, key: req.params.conversationId, deleted: { $ne: true },
  }, { $set: { deleted: true } }, { new: true });
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
  res.json({ conversation: conversationJSON(conversation), cleared: false });
}));

router.post("/:conversationId/messages", catchAsync(async (req, res) => {
  const userId = req.user._id;
  const conversationKey = req.params.conversationId;
  const { id, text, type = "text", fileName, fileMeta, replyToId } = req.body;
  if (!validKey(id) || !validKey(conversationKey) || !["text", "file"].includes(type)) {
    throw new HandleError("اطلاعات پیام معتبر نیست", 400);
  }
  if (type === "text" && (typeof text !== "string" || !text.trim() || text.trim().length > 10000)) {
    throw new HandleError("متن پیام باید بین ۱ تا ۱۰۰۰۰ کاراکتر باشد", 400);
  }
  if (type === "file" && (typeof fileName !== "string" || !fileName.trim() || fileName.length > 255 || typeof fileMeta !== "string" || fileMeta.length > 100)) {
    throw new HandleError("اطلاعات پیوست معتبر نیست", 400);
  }
  if (!await ChatConversation.exists({ userId, key: conversationKey, deleted: { $ne: true } })) {
    throw new HandleError("گفتگو پیدا نشد", 404);
  }
  if (replyToId && (!validKey(replyToId) || !await ChatMessage.exists({
    userId, conversationKey, clientId: replyToId,
  }))) {
    throw new HandleError("پیام موردنظر برای ریپلای پیدا نشد", 404);
  }
  const filter = { userId, clientId: id };
  let message;
  try {
    message = await ChatMessage.findOneAndUpdate(filter, { $setOnInsert: {
      conversationKey, type,
      ...(replyToId ? { replyToClientId: replyToId } : {}),
      ...(type === "text" ? { text: text.trim() } : { fileName, fileMeta }),
    } }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    message = await ChatMessage.findOne(filter);
  }
  if (message.conversationKey !== conversationKey) throw new HandleError("شناسه پیام تکراری است", 409);
  res.status(201).json({ message: messageJSON(message) });
}));

router.patch("/:conversationId/messages/:messageId", catchAsync(async (req, res) => {
  const keys = Object.keys(req.body);
  const editing = keys.length === 1 && keys[0] === "text";
  const pinning = keys.length === 1 && keys[0] === "pinned";
  if ((!editing && !pinning)
    || (editing && (typeof req.body.text !== "string" || !req.body.text.trim() || req.body.text.trim().length > 10000))
    || (pinning && typeof req.body.pinned !== "boolean")) {
    throw new HandleError("تغییرات پیام معتبر نیست", 400);
  }
  const changes = editing
    ? { text: req.body.text.trim(), editedAt: new Date() }
    : { pinned: req.body.pinned };
  const message = await ChatMessage.findOneAndUpdate({
    userId: req.user._id,
    conversationKey: req.params.conversationId,
    clientId: req.params.messageId,
    ...(editing ? { type: "text" } : {}),
  }, { $set: changes }, { new: true, runValidators: true });
  if (!message) throw new HandleError("پیام پیدا نشد", 404);
  res.json({ message: messageJSON(message) });
}));

router.delete("/:conversationId/messages/:messageId", catchAsync(async (req, res) => {
  const message = await ChatMessage.findOneAndDelete({
    userId: req.user._id,
    conversationKey: req.params.conversationId,
    clientId: req.params.messageId,
  });
  if (!message) throw new HandleError("پیام پیدا نشد", 404);
  res.json({ deleted: true, messageId: message.clientId });
}));

export default router;
