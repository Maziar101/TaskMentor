const { Schema, model, Types } = require("mongoose");

const memberSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    role: { type: String, trim: true, default: "member" },
    nickname: { type: String, trim: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inviteSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    role: { type: String, trim: true, default: "member" },
    nickname: { type: String, trim: true },
    status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
  },
  { _id: false }
);

const teamSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: Types.ObjectId, ref: "User", required: true },
    members: [memberSchema],
    invites: [inviteSchema],
  },
  { timestamps: true }
);

module.exports = model("Team", teamSchema);
