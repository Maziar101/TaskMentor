const { Schema, model } = require("mongoose");

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    tag: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model("Task", taskSchema);
