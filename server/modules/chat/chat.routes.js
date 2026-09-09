import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { protect } from "../../middleware/auth.js";
import catchAsync from "../../utils/catchAsync.js";
import HandleError from "../../utils/HandleError.js";
import Users from "../../models/User.js";
import { ChatContact, ChatConversation, ChatMessage } from "./chat.model.js";

const router = express.Router();
router.use(protect);
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const imageDirectory = path.resolve(moduleDirectory, "../../uploads/chat");
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: imageDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${allowedImageTypes.get(file.mimetype)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, allowedImageTypes.has(file.mimetype)),
});
const validKey = (key) => typeof key === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(key);
const conversationJSON = (item) => ({
  id: item.key, name: item.name,
  pinned: Boolean(item.pinned), muted: Boolean(item.muted), archived: Boolean(item.archived),
  participantId: item.participantId?.toString(),
});
const contactJSON = (user) => ({
  id: user._id.toString(),
  name: user.username,
  phone: user.phone,
  avatar: user.username?.trim().slice(0, 1) || "؟",
});
const messageJSON = (item) => ({
  id: item.clientId,
  conversationId: item.conversationKey,
  side: item.side || "mine",
  type: item.type,
  text: item.text,
  fileName: item.fileName,
  fileMeta: item.fileMeta,
  imageUrl: item.imageUrl,
  imageMime: item.imageMime,
  replyToId: item.replyToClientId,
  pinned: Boolean(item.pinned),
  edited: Boolean(item.editedAt),
  seen: Boolean(item.readAt),
  createdAt: item.createdAt,
});
const normalizePhone = (value) => typeof value === "string"
  ? value.trim().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  : "";
const directConversationKey = (firstId, secondId) =>
  `dm-${[firstId.toString(), secondId.toString()].sort().join("-")}`;

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

router.post("/uploads/images", (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new HandleError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد", 400));
    }
    if (error) return next(error);
    if (!req.file) return next(new HandleError("فرمت تصویر معتبر نیست", 400));
    return res.status(201).json({
      image: {
        url: `/uploads/chat/${req.file.filename}`,
        mime: req.file.mimetype,
      },
    });
  });
});

router.get("/", catchAsync(async (req, res) => {
  const userId = req.user._id;
  await ensureSaved(userId);
  const [conversations, messages, contactLinks] = await Promise.all([
    ChatConversation.find({ userId, deleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
    ChatMessage.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean(),
    ChatContact.find({ userId }).sort({ createdAt: 1 }).lean(),
  ]);
  const contactUsers = await Users.find({
    _id: { $in: contactLinks.map((item) => item.contactUserId) },
  }).select("username phone").lean();
  const contactsById = new Map(contactUsers.map((user) => [user._id.toString(), user]));
  const visible = new Map(conversations.map((item) => [item.key, item]));
  const visibleMessages = messages.filter((item) => {
    const conversation = visible.get(item.conversationKey);
    return conversation && (!conversation.clearedAt || item.createdAt > conversation.clearedAt);
  });
  res.json({
    conversations: conversations.map(conversationJSON),
    messages: visibleMessages.map(messageJSON),
    contacts: contactLinks
      .map((item) => contactsById.get(item.contactUserId.toString()))
      .filter(Boolean)
      .map(contactJSON),
  });
}));

router.post("/contacts", catchAsync(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!/^09[0-9]{9}$/.test(phone)) {
    throw new HandleError("شماره موبایل واردشده معتبر نیست", 400);
  }
  const contactUser = await Users.findOne({ phone }).select("username phone");
  if (!contactUser) throw new HandleError("کاربری با این شماره موبایل پیدا نشد", 404);
  if (contactUser._id.equals(req.user._id)) {
    throw new HandleError("نمی‌توانید خودتان را به مخاطبین اضافه کنید", 400);
  }
  try {
    await ChatContact.create({ userId: req.user._id, contactUserId: contactUser._id });
  } catch (error) {
    if (error.code === 11000) throw new HandleError("این کاربر قبلاً در مخاطبین شماست", 409);
    throw error;
  }
  res.status(201).json({ contact: contactJSON(contactUser) });
}));

router.post("/contacts/:contactId/conversation", catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.contactId)) {
    throw new HandleError("مخاطب معتبر نیست", 400);
  }
  const link = await ChatContact.findOne({
    userId: req.user._id,
    contactUserId: req.params.contactId,
  });
  if (!link) throw new HandleError("مخاطب پیدا نشد", 404);
  const contactUser = await Users.findById(link.contactUserId).select("username");
  if (!contactUser) throw new HandleError("حساب این مخاطب پیدا نشد", 404);
  const key = directConversationKey(req.user._id, contactUser._id);
  const conversation = await ChatConversation.findOneAndUpdate(
    { userId: req.user._id, key },
    {
      $set: { name: contactUser.username, participantId: contactUser._id, deleted: false },
      $setOnInsert: { pinned: false, muted: false, archived: false },
    },
    { upsert: true, new: true, runValidators: true },
  );
  res.status(201).json({ conversation: conversationJSON(conversation) });
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

router.patch("/:conversationId/read", catchAsync(async (req, res) => {
  const userId = req.user._id;
  const conversationKey = req.params.conversationId;
  const conversation = await ChatConversation.findOne({
    userId, key: conversationKey, deleted: { $ne: true },
  }).select("participantId");
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
  if (!conversation.participantId) return res.json({ read: 0 });

  const unreadMessages = await ChatMessage.find({
    userId,
    conversationKey,
    side: "theirs",
    readAt: { $exists: false },
  }).select("clientId").lean();
  const clientIds = unreadMessages.map((message) => message.clientId);
  if (!clientIds.length) return res.json({ read: 0 });

  const readAt = new Date();
  await Promise.all([
    ChatMessage.updateMany(
      { userId, conversationKey, clientId: { $in: clientIds } },
      { $set: { readAt } },
    ),
    ChatMessage.updateMany(
      { userId: conversation.participantId, conversationKey, clientId: { $in: clientIds }, side: "mine" },
      { $set: { readAt } },
    ),
  ]);
  return res.json({ read: clientIds.length, messageIds: clientIds, readAt });
}));

router.post("/:conversationId/messages", catchAsync(async (req, res) => {
  const userId = req.user._id;
  const conversationKey = req.params.conversationId;
  const { id, text, type = "text", fileName, fileMeta, imageUrl, imageMime, replyToId } = req.body;
  if (!validKey(id) || !validKey(conversationKey) || !["text", "file"].includes(type)) {
    throw new HandleError("اطلاعات پیام معتبر نیست", 400);
  }
  if (type === "text" && (typeof text !== "string" || !text.trim() || text.trim().length > 10000)) {
    throw new HandleError("متن پیام باید بین ۱ تا ۱۰۰۰۰ کاراکتر باشد", 400);
  }
  if (type === "file" && (typeof fileName !== "string" || !fileName.trim() || fileName.length > 255 || typeof fileMeta !== "string" || fileMeta.length > 100)) {
    throw new HandleError("اطلاعات پیوست معتبر نیست", 400);
  }
  const hasImage = typeof imageUrl === "string" || typeof imageMime === "string";
  if (hasImage && (type !== "file"
    || !/^\/uploads\/chat\/[a-f0-9-]+\.(?:jpg|png|webp|gif)$/.test(imageUrl)
    || !allowedImageTypes.has(imageMime))) {
    throw new HandleError("اطلاعات تصویر معتبر نیست", 400);
  }
  const conversation = await ChatConversation.findOne({
    userId, key: conversationKey, deleted: { $ne: true },
  });
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
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
      ...(type === "text" ? { text: text.trim() } : { fileName, fileMeta, imageUrl, imageMime }),
    } }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    message = await ChatMessage.findOne(filter);
  }
  if (message.conversationKey !== conversationKey) throw new HandleError("شناسه پیام تکراری است", 409);
  if (conversation.participantId) {
    await ChatConversation.findOneAndUpdate(
      { userId: conversation.participantId, key: conversationKey },
      {
        $set: { name: req.user.username, participantId: userId, deleted: false },
        $setOnInsert: { pinned: false, muted: false, archived: false },
      },
      { upsert: true, new: true, runValidators: true },
    );
    await ChatMessage.findOneAndUpdate(
      { userId: conversation.participantId, clientId: id },
      { $setOnInsert: {
        conversationKey, type, side: "theirs",
        ...(replyToId ? { replyToClientId: replyToId } : {}),
        ...(type === "text" ? { text: text.trim() } : { fileName, fileMeta, imageUrl, imageMime }),
      } },
      { upsert: true, new: true, runValidators: true },
    );
  }
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
