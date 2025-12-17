const { Schema, model, Types } = require("mongoose");

const teamTaskSchema = new Schema(
  {
    team: { type: Types.ObjectId, ref: "Team", required: true },
    assignedTo: { type: Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, trim: true },
    dueDate: { type: Date },
    status: { type: String, enum: ["open", "done"], default: "open" },
  },
  { timestamps: true }
);

module.exports = model("TeamTask", teamTaskSchema);
