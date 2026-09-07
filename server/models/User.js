import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false },
    age: { type: Number, min: 0, max: 120 },
    gender: {
      type: String,
      enum: ["male", "female", "other", "unspecified"],
      default: "unspecified",
    },
    workField: { type: String, trim: true },
    birthday: {
      type: String,
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["owner", "admin", "user"],
      default: "user",
    },
    permissions: {
      type: Object,
      default: {
        can_set_plan: true,
        can_create_team: true,
        can_create_project: true,
      },
    },
  },
  { timestamps: true }
);

const Users = model("User", userSchema);

export default Users;
