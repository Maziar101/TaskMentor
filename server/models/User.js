const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    age: { type: Number, min: 0, max: 120 },
    gender: { type: String, enum: ["male", "female", "other", "unspecified"], default: "unspecified" },
    workField: { type: String, trim: true },
    subscription: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
