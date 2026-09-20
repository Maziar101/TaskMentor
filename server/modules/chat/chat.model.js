import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  name: { type: String, required: true, maxlength: 120 },
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatGroup" },
  pinned: { type: Boolean, default: false },
  muted: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
  clearedAt: { type: Date },
}, { timestamps: true });
conversationSchema.index({ userId: 1, key: 1 }, { unique: true });

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversationKey: { type: String, required: true },
  clientId: { type: String, required: true },
  text: { type: String, maxlength: 10000 },
  type: { type: String, enum: ["text", "file", "task-forward"], default: "text" },
  fileName: { type: String, maxlength: 255 },
  fileMeta: { type: String, maxlength: 100 },
  imageUrl: { type: String, maxlength: 500 },
  imageMime: { type: String, maxlength: 100 },
  replyToClientId: { type: String },
  taskForwardId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskForward" },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: { type: String, maxlength: 120 },
  senderAvatarUrl: { type: String, maxlength: 500 },
  side: { type: String, enum: ["mine", "theirs"], default: "mine" },
  pinned: { type: Boolean, default: false },
  reactions: [{
    _id: false,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true, maxlength: 8 },
  }],
  editedAt: { type: Date },
  readAt: { type: Date },
}, { timestamps: true });
messageSchema.index({ userId: 1, clientId: 1 }, { unique: true });
messageSchema.index({ userId: 1, conversationKey: 1, createdAt: 1 });

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  contactUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
contactSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });

const blockSchema = new mongoose.Schema({
  blockerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  blockedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

const groupSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  avatarUrl: { type: String, maxlength: 500 },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
}, { timestamps: true });
groupSchema.index({ memberIds: 1, createdAt: -1 });

const taskForwardSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversationKey: { type: String, required: true },
  sourceTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledItem", required: true },
  senderName: { type: String, required: true, maxlength: 120 },
  recipientName: { type: String, required: true, maxlength: 120 },
  title: { type: String, required: true, maxlength: 240 },
  tag: { type: String, maxlength: 120 },
  priority: { type: String, maxlength: 80 },
  day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  hour: { type: Number, required: true, min: 0, max: 23 },
  duration: { type: Number, required: true, min: 1, max: 24 },
  status: {
    type: String,
    enum: ["pending", "accepting", "accepted", "rejected"],
    default: "pending",
  },
  scheduledItemId: { type: mongoose.Schema.Types.ObjectId, ref: "ScheduledItem" },
  respondedAt: { type: Date },
}, { timestamps: true });
taskForwardSchema.index({ recipientId: 1, status: 1, createdAt: -1 });

export const ChatConversation = mongoose.model("ChatConversation", conversationSchema);
export const ChatMessage = mongoose.model("ChatMessage", messageSchema);
export const ChatContact = mongoose.model("ChatContact", contactSchema);
export const ChatBlock = mongoose.model("ChatBlock", blockSchema);
export const ChatGroup = mongoose.model("ChatGroup", groupSchema);
export const TaskForward = mongoose.model("TaskForward", taskForwardSchema);
