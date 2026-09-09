import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  name: { type: String, required: true, maxlength: 120 },
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
  type: { type: String, enum: ["text", "file"], default: "text" },
  fileName: { type: String, maxlength: 255 },
  fileMeta: { type: String, maxlength: 100 },
  imageUrl: { type: String, maxlength: 500 },
  imageMime: { type: String, maxlength: 100 },
  replyToClientId: { type: String },
  side: { type: String, enum: ["mine", "theirs"], default: "mine" },
  pinned: { type: Boolean, default: false },
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

export const ChatConversation = mongoose.model("ChatConversation", conversationSchema);
export const ChatMessage = mongoose.model("ChatMessage", messageSchema);
export const ChatContact = mongoose.model("ChatContact", contactSchema);
