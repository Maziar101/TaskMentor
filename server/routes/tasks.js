const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const userExists = await User.exists({ _id: userId });
    if (!userExists) return res.status(404).json({ message: "user not found" });
    const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const tag = req.body.tag?.trim();
    const userId = req.body.userId;
    if (!title || !userId) {
      return res.status(400).json({ message: "title and userId are required" });
    }
    const userExists = await User.exists({ _id: userId });
    if (!userExists) return res.status(404).json({ message: "user not found" });
    const task = await Task.create({ title, tag, user: userId });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) {
      return res.status(404).json({ message: "task not found" });
    }
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
