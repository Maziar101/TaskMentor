import { Schema, model, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "team_invite",
        "team_task",
        "group_message",
        "member_status",
        "member_role",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationSchema);

export default Notification;