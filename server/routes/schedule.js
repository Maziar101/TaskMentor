const express = require("express");
const ScheduledItem = require("../models/ScheduledItem");

const router = express.Router();

function normalizeDay(day) {
  if (!day) return null;
  return day.trim();
}

router.get("/:day", async (req, res, next) => {
  try {
    const day = normalizeDay(req.params.day);
    if (!day) {
      return res.status(400).json({ message: "day param is required" });
    }
    const items = await ScheduledItem.find({ day }).sort({ hour: 1 });
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

    if (!title || !day || Number.isNaN(hour)) {
      return res
        .status(400)
        .json({ message: "title, day (YYYY-MM-DD) and hour are required" });
    }

    const item = await ScheduledItem.create({ title, tag, day, hour, done });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.title === "string") updates.title = req.body.title.trim();
    if (typeof req.body.tag === "string") updates.tag = req.body.tag.trim();
    if (typeof req.body.day === "string") updates.day = normalizeDay(req.body.day);
    if (typeof req.body.hour !== "undefined") updates.hour = Number(req.body.hour);
    if (typeof req.body.done !== "undefined") updates.done = Boolean(req.body.done);

    const item = await ScheduledItem.findByIdAndUpdate(
      req.params.id,
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
    const deleted = await ScheduledItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "item not found" });
    }
    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
