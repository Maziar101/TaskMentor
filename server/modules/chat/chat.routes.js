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
import ScheduledItem from "../../models/ScheduledItem.js";
import { ChatBlock, ChatContact, ChatConversation, ChatGroup, ChatMessage, TaskForward } from "./chat.model.js";

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
const allowedReactions = new Set(["👍", "👎", "❤️", "🔥", "🥰", "👏", "😇"]);
const conversationJSON = (item, avatarUrl, unread, memberCount, details = {}) => ({
  id: item.key, name: item.name,
  pinned: Boolean(item.pinned), muted: Boolean(item.muted), archived: Boolean(item.archived),
  participantId: item.participantId?.toString(),
  groupId: item.groupId?.toString(),
  isGroup: Boolean(item.groupId),
  ...(memberCount !== undefined ? { memberCount } : {}),
  ...(avatarUrl !== undefined ? { avatarUrl } : {}),
  ...(unread !== undefined ? { unread } : {}),
  ...details,
});
const contactJSON = (user) => ({
  id: user._id.toString(),
  name: user.username,
  phone: user.phone,
  avatar: user.username?.trim().slice(0, 1) || "؟",
  avatarUrl: user.avatarUrl || "",
});
const taskForwardJSON = (item, viewerId) => item ? ({
  id: item._id.toString(),
  title: item.title,
  tag: item.tag,
  priority: item.priority,
  day: item.day,
  hour: item.hour,
  duration: item.duration,
  status: item.status === "accepting" ? "pending" : item.status,
  senderName: item.senderName,
  recipientName: item.recipientName,
  canRespond: item.status === "pending" && item.recipientId.toString() === viewerId?.toString(),
  respondedAt: item.respondedAt,
}) : null;
const messageJSON = (item, viewerId, taskForward) => {
  const counts = new Map();
  let myReaction = null;
  for (const reaction of item.reactions ?? []) {
    counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
    if (viewerId && reaction.userId?.toString() === viewerId.toString()) myReaction = reaction.emoji;
  }
  return {
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
    taskForward: taskForwardJSON(taskForward, viewerId),
    senderId: item.senderId?.toString(),
    senderName: item.senderName,
    senderAvatarUrl: item.senderAvatarUrl,
    pinned: Boolean(item.pinned),
    edited: Boolean(item.editedAt),
    seen: Boolean(item.readAt),
    reactions: [...counts].map(([emoji, count]) => ({ emoji, count })),
    myReaction,
    createdAt: item.createdAt,
  };
};
const normalizePhone = (value) => typeof value === "string"
  ? value.trim().replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  : "";
const directConversationKey = (firstId, secondId) =>
  `dm-${[firstId.toString(), secondId.toString()].sort().join("-")}`;
const groupConversationKey = (groupId) => `group-${groupId.toString()}`;
const directBlockStatus = async (viewerId, participantId) => {
  const blocks = await ChatBlock.find({
    $or: [
      { blockerId: viewerId, blockedUserId: participantId },
      { blockerId: participantId, blockedUserId: viewerId },
    ],
  }).select("blockerId blockedUserId").lean();
  return {
    blockedByMe: blocks.some((block) => block.blockerId.toString() === viewerId.toString()),
    blockedMe: blocks.some((block) => block.blockerId.toString() === participantId.toString()),
  };
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const recipientJSON = (user, recentIds) => ({
  ...contactJSON(user),
  kind: "contact",
  recent: recentIds.has(user._id.toString()),
});
const groupRecipientJSON = (group) => ({
  id: group.key,
  name: group.name,
  avatar: group.name.trim().slice(0, 1) || "گ",
  avatarUrl: group.avatarUrl || "",
  kind: "group",
  memberCount: group.memberIds.length,
  recent: true,
});

const parseMemberIds = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
};

const uploadOptionalImage = (req, res, next) => {
  imageUpload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new HandleError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد", 400));
    }
    if (error) return next(error);
    return next();
  });
};

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

router.post("/groups", uploadOptionalImage, catchAsync(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const requestedMemberIds = parseMemberIds(req.body.memberIds);
  if (!name || name.length > 120 || requestedMemberIds === null || requestedMemberIds.length > 100) {
    throw new HandleError("اطلاعات گروه معتبر نیست", 400);
  }
  const memberIds = [...new Set(requestedMemberIds.map(String))];
  if (memberIds.some((id) => !mongoose.isValidObjectId(id) || id === req.user._id.toString())) {
    throw new HandleError("اعضای انتخاب‌شده معتبر نیستند", 400);
  }
  const allowedContacts = memberIds.length ? await ChatContact.find({
    userId: req.user._id,
    contactUserId: { $in: memberIds },
  }).select("contactUserId").lean() : [];
  if (allowedContacts.length !== memberIds.length) {
    throw new HandleError("فقط مخاطبین شما می‌توانند به گروه دعوت شوند", 403);
  }

  const groupId = new mongoose.Types.ObjectId();
  const key = groupConversationKey(groupId);
  const allMemberIds = [req.user._id, ...allowedContacts.map((item) => item.contactUserId)];
  const avatarUrl = req.file ? `/uploads/chat/${req.file.filename}` : "";
  let group;
  try {
    group = await ChatGroup.create({
      _id: groupId,
      key,
      ownerId: req.user._id,
      name,
      avatarUrl,
      memberIds: allMemberIds,
    });
    await ChatConversation.insertMany(allMemberIds.map((userId) => ({
      userId,
      key,
      name,
      groupId,
    })));
  } catch (error) {
    if (group) await ChatGroup.deleteOne({ _id: groupId });
    throw error;
  }
  const ownerConversation = await ChatConversation.findOne({ userId: req.user._id, key }).lean();
  res.status(201).json({
    conversation: conversationJSON(ownerConversation, avatarUrl, 0, allMemberIds.length),
  });
}));

router.get("/unread-summary", catchAsync(async (req, res) => {
  const conversations = await ChatConversation.find({
    userId: req.user._id,
    deleted: { $ne: true },
  }).select("key").lean();
  const conversationKeys = conversations.map((item) => item.key);
  const unreadGroups = conversationKeys.length ? await ChatMessage.aggregate([
    {
      $match: {
        userId: req.user._id,
        conversationKey: { $in: conversationKeys },
        side: "theirs",
        readAt: { $exists: false },
      },
    },
    { $group: { _id: "$conversationKey", count: { $sum: 1 } } },
  ]) : [];
  res.json({
    conversationCount: unreadGroups.length,
    totalUnread: unreadGroups.reduce((sum, item) => sum + item.count, 0),
  });
}));

router.get("/task-recipients", catchAsync(async (req, res) => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  const normalizedQuery = normalizePhone(rawQuery);
  const recentConversations = await ChatConversation.find({
    userId: req.user._id,
    participantId: { $exists: true, $ne: null },
    deleted: { $ne: true },
  }).sort({ updatedAt: -1 }).limit(12).select("participantId").lean();
  const recentIds = new Set(recentConversations.map((item) => item.participantId.toString()));
  const recentOrder = new Map(recentConversations.map((item, index) => [item.participantId.toString(), index]));
  const query = { _id: { $ne: req.user._id } };
  if (rawQuery) {
    const namePattern = new RegExp(escapeRegex(rawQuery), "i");
    const filters = [{ username: namePattern }];
    if (normalizedQuery) filters.push({ phone: new RegExp(escapeRegex(normalizedQuery), "i") });
    query.$or = filters;
  } else {
    query._id = { $in: [...recentIds] };
  }
  const [users, groups] = await Promise.all([
    Users.find(query).select("username phone avatarUrl").limit(20).lean(),
    ChatGroup.find({
      memberIds: req.user._id,
      ...(rawQuery ? { name: new RegExp(escapeRegex(rawQuery), "i") } : {}),
    }).sort({ updatedAt: -1 }).limit(12).lean(),
  ]);
  users.sort((first, second) => {
    const firstOrder = recentOrder.get(first._id.toString()) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = recentOrder.get(second._id.toString()) ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder || first.username.localeCompare(second.username, "fa");
  });
  res.json({
    recipients: [
      ...groups.map(groupRecipientJSON),
      ...users.map((user) => recipientJSON(user, recentIds)),
    ],
  });
}));

router.post("/task-forwards", catchAsync(async (req, res) => {
  const { recipientId, groupId, sourceTaskId } = req.body;
  const sendingToGroup = typeof groupId === "string" && groupId.startsWith("group-");
  if ((!sendingToGroup && !mongoose.isValidObjectId(recipientId)) || !mongoose.isValidObjectId(sourceTaskId)) {
    throw new HandleError("اطلاعات فوروارد تسک معتبر نیست", 400);
  }
  if (!sendingToGroup && req.user._id.toString() === recipientId) {
    throw new HandleError("نمی‌توانید تسک را برای خودتان فوروارد کنید", 400);
  }
  const [sourceTask, directRecipient, group] = await Promise.all([
    ScheduledItem.findOne({ _id: sourceTaskId, user: req.user._id }).lean(),
    sendingToGroup ? null : Users.findById(recipientId).select("username phone avatarUrl").lean(),
    sendingToGroup ? ChatGroup.findOne({ key: groupId, memberIds: req.user._id }).lean() : null,
  ]);
  if (!sourceTask) throw new HandleError("تسک زمان‌بندی‌شده پیدا نشد", 404);
  if (sendingToGroup && !group) throw new HandleError("گروه انتخاب‌شده پیدا نشد", 404);
  if (!sendingToGroup && !directRecipient) throw new HandleError("کاربر انتخاب‌شده پیدا نشد", 404);
  if (!sendingToGroup && await ChatBlock.exists({
    blockerId: directRecipient._id,
    blockedUserId: req.user._id,
  })) {
    throw new HandleError("این کاربر شما را بلاک کرده است و امکان ارسال پیام ندارید", 403);
  }

  const requestedHour = Number(req.body.hour);
  const requestedDuration = Number(req.body.duration);
  const hour = Number.isInteger(requestedHour) ? requestedHour : sourceTask.hour;
  const duration = Number.isInteger(requestedDuration) ? requestedDuration : sourceTask.duration;
  if (hour < 0 || hour > 23 || duration < 1 || duration > 24 - hour) {
    throw new HandleError("ساعت یا مدت تسک معتبر نیست", 400);
  }

  const recipients = sendingToGroup
    ? await Users.find({ _id: { $in: group.memberIds.filter((id) => !id.equals(req.user._id)) } })
      .select("username avatarUrl").lean()
    : [directRecipient];
  if (!recipients.length) throw new HandleError("گروه باید حداقل یک عضو دیگر داشته باشد", 400);
  const conversationKey = sendingToGroup ? group.key : directConversationKey(req.user._id, directRecipient._id);
  if (!sendingToGroup) {
    await Promise.all([
      ChatConversation.findOneAndUpdate(
        { userId: req.user._id, key: conversationKey },
        { $set: { name: directRecipient.username, participantId: directRecipient._id, deleted: false } },
        { upsert: true, new: true, runValidators: true },
      ),
      ChatConversation.findOneAndUpdate(
        { userId: directRecipient._id, key: conversationKey },
        { $set: { name: req.user.username, participantId: req.user._id, deleted: false } },
        { upsert: true, new: true, runValidators: true },
      ),
    ]);
  }
  const taskForwards = await TaskForward.create(recipients.map((recipient) => ({
    senderId: req.user._id,
    recipientId: recipient._id,
    conversationKey,
    sourceTaskId: sourceTask._id,
    senderName: req.user.username,
    recipientName: recipient.username,
    title: sourceTask.title,
    tag: sourceTask.tag,
    priority: sourceTask.priority,
    day: sourceTask.day,
    hour,
    duration,
  })));
  const taskForward = taskForwards[0];
  const clientId = randomUUID();
  const text = `آیا می‌خواهی تسک «${sourceTask.title}» را برای ساعت ${String(hour).padStart(2, "0")}:00 انجام بدهی؟`;
  const senderDetails = {
    senderId: req.user._id,
    senderName: req.user.username,
    senderAvatarUrl: req.user.avatarUrl,
  };
  const [message] = await ChatMessage.create([
    { userId: req.user._id, conversationKey, clientId, type: "task-forward", text, taskForwardId: taskForward._id, side: "mine", ...senderDetails },
    ...recipients.map((recipient, index) => ({
      userId: recipient._id,
      conversationKey,
      clientId,
      type: "task-forward",
      text,
      taskForwardId: taskForwards[index]._id,
      side: "theirs",
      ...senderDetails,
    })),
  ]);
  await ChatConversation.updateMany(
    { userId: { $in: [req.user._id, ...recipients.map((item) => item._id)] }, key: conversationKey },
    { $set: { updatedAt: new Date(), deleted: false } },
  );
  res.status(201).json({
    conversationId: conversationKey,
    message: messageJSON(message, req.user._id, taskForward),
  });
}));

router.patch("/task-forwards/:requestId", catchAsync(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.requestId) || !["accept", "reject"].includes(req.body.decision)) {
    throw new HandleError("پاسخ درخواست معتبر نیست", 400);
  }
  let taskForward = await TaskForward.findOne({
    _id: req.params.requestId,
    recipientId: req.user._id,
  });
  if (!taskForward) throw new HandleError("درخواست تسک پیدا نشد", 404);
  const requestedStatus = req.body.decision === "accept" ? "accepted" : "rejected";
  if (["accepted", "rejected"].includes(taskForward.status)) {
    if (taskForward.status !== requestedStatus) throw new HandleError("پاسخ این درخواست قبلاً ثبت شده است", 409);
    return res.json({ taskForward: taskForwardJSON(taskForward, req.user._id) });
  }
  if (taskForward.status === "accepting") {
    throw new HandleError("پاسخ این درخواست در حال ثبت است", 409);
  }

  if (req.body.decision === "reject") {
    taskForward = await TaskForward.findOneAndUpdate(
      { _id: taskForward._id, recipientId: req.user._id, status: "pending" },
      { $set: { status: "rejected", respondedAt: new Date() } },
      { new: true },
    );
  } else {
    taskForward = await TaskForward.findOneAndUpdate(
      { _id: taskForward._id, recipientId: req.user._id, status: "pending" },
      { $set: { status: "accepting" } },
      { new: true },
    );
    if (!taskForward) throw new HandleError("پاسخ این درخواست در حال ثبت است", 409);
    try {
      let scheduledItem = await ScheduledItem.findOne({ forwardRequest: taskForward._id });
      if (!scheduledItem) {
        scheduledItem = await ScheduledItem.create({
          user: req.user._id,
          title: taskForward.title,
          tag: taskForward.tag,
          priority: taskForward.priority,
          day: taskForward.day,
          hour: taskForward.hour,
          duration: taskForward.duration,
          done: false,
          forwardRequest: taskForward._id,
        });
      }
      taskForward = await TaskForward.findByIdAndUpdate(taskForward._id, {
        $set: { status: "accepted", scheduledItemId: scheduledItem._id, respondedAt: new Date() },
      }, { new: true });
    } catch (error) {
      await TaskForward.updateOne(
        { _id: taskForward._id, status: "accepting" },
        { $set: { status: "pending" }, $unset: { respondedAt: 1 } },
      );
      throw error;
    }
  }
  res.json({ taskForward: taskForwardJSON(taskForward, req.user._id) });
}));

router.get("/", catchAsync(async (req, res) => {
  const userId = req.user._id;
  await ensureSaved(userId);
  const [conversations, messages, contactLinks] = await Promise.all([
    ChatConversation.find({ userId, deleted: { $ne: true } }).sort({ createdAt: 1 }).lean(),
    ChatMessage.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean(),
    ChatContact.find({ userId }).sort({ createdAt: 1 }).lean(),
  ]);
  const taskForwardIds = messages.map((item) => item.taskForwardId).filter(Boolean);
  const groupIds = conversations.map((item) => item.groupId).filter(Boolean);
  const participantIds = conversations.map((item) => item.participantId).filter(Boolean);
  const [taskForwards, groups, blocks] = await Promise.all([
    TaskForward.find({ _id: { $in: taskForwardIds } }).lean(),
    ChatGroup.find({ _id: { $in: groupIds }, memberIds: userId }).lean(),
    ChatBlock.find({
      $or: [
        { blockerId: userId, blockedUserId: { $in: participantIds } },
        { blockerId: { $in: participantIds }, blockedUserId: userId },
      ],
    }).select("blockerId blockedUserId").lean(),
  ]);
  const taskForwardsById = new Map(taskForwards.map((item) => [item._id.toString(), item]));
  const groupsById = new Map(groups.map((group) => [group._id.toString(), group]));
  const relatedUsers = await Users.find({
    _id: { $in: [...contactLinks.map((item) => item.contactUserId), ...participantIds] },
  }).select("username phone avatarUrl").lean();
  const usersById = new Map(relatedUsers.map((user) => [user._id.toString(), user]));
  const visible = new Map(conversations.map((item) => [item.key, item]));
  const visibleMessages = messages.filter((item) => {
    const conversation = visible.get(item.conversationKey);
    return conversation && (!conversation.clearedAt || item.createdAt > conversation.clearedAt);
  });
  const unreadByConversation = visibleMessages.reduce((counts, message) => {
    if (message.side === "theirs" && !message.readAt) {
      counts.set(message.conversationKey, (counts.get(message.conversationKey) ?? 0) + 1);
    }
    return counts;
  }, new Map());
  res.json({
    conversations: conversations
      .filter((conversation) => !conversation.groupId || groupsById.has(conversation.groupId.toString()))
      .map((conversation) => {
        const group = groupsById.get(conversation.groupId?.toString());
        const participantId = conversation.participantId?.toString();
        const participant = usersById.get(participantId);
        return conversationJSON(
          conversation,
          group?.avatarUrl || participant?.avatarUrl,
          unreadByConversation.get(conversation.key) ?? 0,
          group?.memberIds.length,
          participant ? {
            phone: participant.phone,
            blockedByMe: blocks.some((block) => block.blockerId.toString() === userId.toString()
              && block.blockedUserId.toString() === participantId),
            blockedMe: blocks.some((block) => block.blockerId.toString() === participantId
              && block.blockedUserId.toString() === userId.toString()),
          } : {},
        );
      }),
    messages: visibleMessages.map((message) => messageJSON(
      message,
      userId,
      taskForwardsById.get(message.taskForwardId?.toString()),
    )),
    contacts: contactLinks
      .map((item) => usersById.get(item.contactUserId.toString()))
      .filter(Boolean)
      .map(contactJSON),
  });
}));

router.post("/contacts", catchAsync(async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!/^09[0-9]{9}$/.test(phone)) {
    throw new HandleError("شماره موبایل واردشده معتبر نیست", 400);
  }
  const contactUser = await Users.findOne({ phone }).select("username phone avatarUrl");
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
  const contactUser = await Users.findById(link.contactUserId).select("username phone avatarUrl");
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
  const blockStatus = await directBlockStatus(req.user._id, contactUser._id);
  res.status(201).json({
    conversation: conversationJSON(conversation, contactUser.avatarUrl, undefined, undefined, {
      phone: contactUser.phone,
      ...blockStatus,
    }),
  });
}));

router.put("/:conversationId/block", catchAsync(async (req, res) => {
  const conversation = await ChatConversation.findOne({
    userId: req.user._id,
    key: req.params.conversationId,
    participantId: { $exists: true, $ne: null },
    groupId: { $exists: false },
    deleted: { $ne: true },
  }).select("key participantId");
  if (!conversation) throw new HandleError("گفتگوی مستقیم پیدا نشد", 404);

  await ChatBlock.findOneAndUpdate(
    { blockerId: req.user._id, blockedUserId: conversation.participantId },
    { $setOnInsert: { blockerId: req.user._id, blockedUserId: conversation.participantId } },
    { upsert: true, new: true, runValidators: true },
  );
  res.json({ blocked: true, conversationId: conversation.key });
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
  }).select("participantId groupId");
  if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
  if (!conversation.participantId && !conversation.groupId) return res.json({ read: 0 });

  const unreadMessages = await ChatMessage.find({
    userId,
    conversationKey,
    side: "theirs",
    readAt: { $exists: false },
  }).select("clientId").lean();
  const clientIds = unreadMessages.map((message) => message.clientId);
  if (!clientIds.length) return res.json({ read: 0 });

  const readAt = new Date();
  await ChatMessage.updateMany(
    { userId, conversationKey, clientId: { $in: clientIds } },
    { $set: { readAt } },
  );
  if (conversation.participantId) {
    await ChatMessage.updateMany(
      { userId: conversation.participantId, conversationKey, clientId: { $in: clientIds }, side: "mine" },
      { $set: { readAt } },
    );
  }
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
  const group = conversation.groupId
    ? await ChatGroup.findOne({ _id: conversation.groupId, memberIds: userId }).lean()
    : null;
  if (conversation.groupId && !group) throw new HandleError("به این گروه دسترسی ندارید", 403);
  if (conversation.participantId && await ChatBlock.exists({
    blockerId: conversation.participantId,
    blockedUserId: userId,
  })) {
    throw new HandleError("این کاربر شما را بلاک کرده است و امکان ارسال پیام ندارید", 403);
  }
  if (replyToId && (!validKey(replyToId) || !await ChatMessage.exists({
    userId, conversationKey, clientId: replyToId,
  }))) {
    throw new HandleError("پیام موردنظر برای ریپلای پیدا نشد", 404);
  }
  const senderDetails = {
    senderId: userId,
    senderName: req.user.username,
    senderAvatarUrl: req.user.avatarUrl,
  };
  const messagePayload = {
    conversationKey,
    type,
    ...senderDetails,
    ...(replyToId ? { replyToClientId: replyToId } : {}),
    ...(type === "text" ? { text: text.trim() } : { fileName, fileMeta, imageUrl, imageMime }),
  };
  const filter = { userId, clientId: id };
  let message;
  try {
    message = await ChatMessage.findOneAndUpdate(filter, { $setOnInsert: messagePayload }, {
      upsert: true,
      new: true,
      runValidators: true,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    message = await ChatMessage.findOne(filter);
  }
  if (message.conversationKey !== conversationKey) throw new HandleError("شناسه پیام تکراری است", 409);
  if (group) {
    await Promise.all(group.memberIds.filter((memberId) => !memberId.equals(userId)).map(async (memberId) => {
      await ChatConversation.updateOne(
        { userId: memberId, key: conversationKey, groupId: group._id },
        { $set: { name: group.name, deleted: false } },
      );
      await ChatMessage.findOneAndUpdate(
        { userId: memberId, clientId: id },
        { $setOnInsert: { ...messagePayload, side: "theirs" } },
        { upsert: true, new: true, runValidators: true },
      );
    }));
    await ChatConversation.updateMany(
      { userId: { $in: group.memberIds }, key: conversationKey },
      { $set: { updatedAt: new Date() } },
    );
  } else if (conversation.participantId) {
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
        ...messagePayload,
        side: "theirs",
      } },
      { upsert: true, new: true, runValidators: true },
    );
  }
  res.status(201).json({ message: messageJSON(message, userId) });
}));

router.patch("/:conversationId/messages/:messageId", catchAsync(async (req, res) => {
  const keys = Object.keys(req.body);
  const editing = keys.length === 1 && keys[0] === "text";
  const pinning = keys.length === 1 && keys[0] === "pinned";
  const reacting = keys.length === 1 && keys[0] === "reaction";
  if ((!editing && !pinning && !reacting)
    || (editing && (typeof req.body.text !== "string" || !req.body.text.trim() || req.body.text.trim().length > 10000))
    || (pinning && typeof req.body.pinned !== "boolean")
    || (reacting && req.body.reaction !== null && !allowedReactions.has(req.body.reaction))) {
    throw new HandleError("تغییرات پیام معتبر نیست", 400);
  }
  const messageFilter = {
    userId: req.user._id,
    conversationKey: req.params.conversationId,
    clientId: req.params.messageId,
  };
  if (reacting) {
    const existingMessage = await ChatMessage.findOne(messageFilter);
    if (!existingMessage) throw new HandleError("پیام پیدا نشد", 404);
    const conversation = await ChatConversation.findOne({
      userId: req.user._id,
      key: req.params.conversationId,
      deleted: { $ne: true },
    }).select("participantId groupId");
    if (!conversation) throw new HandleError("گفتگو پیدا نشد", 404);
    const group = conversation.groupId
      ? await ChatGroup.findOne({ _id: conversation.groupId, memberIds: req.user._id }).select("memberIds").lean()
      : null;
    if (conversation.groupId && !group) throw new HandleError("به این گروه دسترسی ندارید", 403);
    const mirroredMessageFilter = {
      userId: { $in: group?.memberIds ?? [req.user._id, conversation.participantId].filter(Boolean) },
      conversationKey: req.params.conversationId,
      clientId: req.params.messageId,
    };
    const nextReaction = req.body.reaction
      ? [{ userId: req.user._id, emoji: req.body.reaction }]
      : [];
    await ChatMessage.updateMany(mirroredMessageFilter, [{
      $set: {
        reactions: {
          $concatArrays: [
            {
              $filter: {
                input: { $ifNull: ["$reactions", []] },
                as: "reaction",
                cond: { $ne: ["$$reaction.userId", req.user._id] },
              },
            },
            nextReaction,
          ],
        },
      },
    }]);
    const message = await ChatMessage.findOne(messageFilter);
    const taskForward = message.taskForwardId
      ? await TaskForward.findById(message.taskForwardId).lean()
      : null;
    return res.json({ message: messageJSON(message, req.user._id, taskForward) });
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
  const taskForward = message.taskForwardId
    ? await TaskForward.findById(message.taskForwardId).lean()
    : null;
  res.json({ message: messageJSON(message, req.user._id, taskForward) });
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
