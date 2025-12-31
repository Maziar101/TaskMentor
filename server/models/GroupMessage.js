const { Schema, model, Types } = require("mongoose");

const groupMessageSchema = new Schema(
  {
    group: { type: Types.ObjectId, ref: "Group", required: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["text", "file", "task_link"],
      default: "text",
    },
    text: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    fileName: { type: String, trim: true },
    taskId: { type: String, trim: true },
    replyTo: { type: Types.ObjectId, ref: "GroupMessage" },
    originGroup: { type: Types.ObjectId, ref: "Group" },
    originMessage: { type: Types.ObjectId, ref: "GroupMessage" },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = model("GroupMessage", groupMessageSchema);
