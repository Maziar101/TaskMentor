import { Schema, model, Types } from "mongoose";

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

const Group = model("Group", groupSchema);

export default Group;