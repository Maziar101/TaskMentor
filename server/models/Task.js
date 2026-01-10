import { Schema, model, Types } from "mongoose";

const taskSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    tag: { type: String, trim: true },
    priority: { type: String, trim: true },
  },
  { timestamps: true }
);

const Task = model("Task", taskSchema);
export default Task;
