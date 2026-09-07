import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  name: { type: String, required: true, maxlength: 120 },
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
  replyToClientId: { type: String },
  pinned: { type: Boolean, default: false },
  editedAt: { type: Date },
}, { timestamps: true });
messageSchema.index({ userId: 1, clientId: 1 }, { unique: true });
messageSchema.index({ userId: 1, conversationKey: 1, createdAt: 1 });

export const ChatConversation = mongoose.model("ChatConversation", conversationSchema);
export const ChatMessage = mongoose.model("ChatMessage", messageSchema);
