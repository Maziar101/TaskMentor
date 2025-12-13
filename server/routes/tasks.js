const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const tag = req.body.tag?.trim();
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }
    const task = await Task.create({ title, tag });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "task not found" });
    }
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
