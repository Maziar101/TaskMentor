const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { username, phone, age, gender, workField, subscription } = req.body;
    if (!username || !phone) {
      return res.status(400).json({ message: "username and phone are required" });
    }
    const user = await User.create({
      username: username.trim(),
      phone: phone.trim(),
      age,
      gender,
      workField,
      subscription,
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "username already exists" });
    }
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = {};
    ["username", "phone", "gender", "workField", "subscription"].forEach((field) => {
      if (typeof req.body[field] === "string") updates[field] = req.body[field].trim();
    });
    if (typeof req.body.age !== "undefined") updates.age = req.body.age;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "user not found" });
    res.json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "username already exists" });
    }
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "user not found" });
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
