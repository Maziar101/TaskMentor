const { Schema, model, Types } = require("mongoose");

const groupSchema = new Schema(
  {
    team: { type: Types.ObjectId, ref: "Team", required: true },
    name: { type: String, required: true, trim: true },
    isPublic: { type: Boolean, default: false },
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    members: [{ type: Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = model("Group", groupSchema);
