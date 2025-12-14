const express = require("express");
const ScheduledItem = require("../models/ScheduledItem");
const User = require("../models/User");

const router = express.Router();

function normalizeDay(day) {
  if (!day) return null;
  return day.trim();
}

router.get("/:day", async (req, res, next) => {
  try {
    const day = normalizeDay(req.params.day);
    const userId = req.query.userId;
    if (!day) {
      return res.status(400).json({ message: "day param is required" });
    }
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const userExists = await User.exists({ _id: userId });
    if (!userExists) return res.status(404).json({ message: "user not found" });
    const items = await ScheduledItem.find({ day, user: userId }).sort({ hour: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const tag = req.body.tag?.trim();
    const day = normalizeDay(req.body.day);
    const hour = Number(req.body.hour);
    const done = Boolean(req.body.done);
    const priority = req.body.priority?.trim();
    const userId = req.body.userId;

    if (!title || !day || Number.isNaN(hour) || !userId) {
      return res
        .status(400)
        .json({ message: "title, day (YYYY-MM-DD), hour and userId are required" });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) return res.status(404).json({ message: "user not found" });

    const item = await ScheduledItem.create({ title, tag, priority, day, hour, done, user: userId });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const userExists = await User.exists({ _id: userId });
    if (!userExists) return res.status(404).json({ message: "user not found" });

    const updates = {};
    if (typeof req.body.title === "string") updates.title = req.body.title.trim();
    if (typeof req.body.tag === "string") updates.tag = req.body.tag.trim();
    if (typeof req.body.day === "string") updates.day = normalizeDay(req.body.day);
    if (typeof req.body.hour !== "undefined") updates.hour = Number(req.body.hour);
    if (typeof req.body.done !== "undefined") updates.done = Boolean(req.body.done);
    if (typeof req.body.priority === "string") updates.priority = req.body.priority.trim();

    const item = await ScheduledItem.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: "item not found" });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const deleted = await ScheduledItem.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!deleted) {
      return res.status(404).json({ message: "item not found" });
    }
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
