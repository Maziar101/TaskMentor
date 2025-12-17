const express = require("express");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const items = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { read: true },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "notification not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
