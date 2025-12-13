const { Schema, model, Types } = require("mongoose");

const taskSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    tag: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model("Task", taskSchema);
