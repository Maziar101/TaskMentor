import { Schema, model, Types } from "mongoose";

const scheduledItemSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    tag: { type: String, trim: true },
    priority: { type: String, trim: true },
    day: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
        message: "day must be in YYYY-MM-DD format",
      },
    },
    hour: { type: Number, required: true, min: 0, max: 23 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ScheduledItem = model("ScheduledItem", scheduledItemSchema);

export default ScheduledItem;
