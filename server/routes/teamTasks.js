const express = require("express");
const TeamTask = require("../models/TeamTask");
const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const tasks = await TeamTask.find({ assignedTo: userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get("/team/:teamId", async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (team.owner.toString() !== userId) {
      return res.status(403).json({ message: "only owner can view team tasks" });
    }
    const tasks = await TeamTask.find({ team: req.params.teamId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { userId, teamId, assigneeId, title, description, priority, dueDate } = req.body;
    if (!userId || !teamId || !assigneeId || !title) {
      return res
        .status(400)
        .json({ message: "userId, teamId, assigneeId and title are required" });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (team.owner.toString() !== userId) {
      return res.status(403).json({ message: "only owner can assign" });
    }
    const memberExists = team.members.some((m) => m.user.toString() === assigneeId);
    if (!memberExists) {
      return res.status(400).json({ message: "assignee is not in team" });
    }
    const payload = {
      team: teamId,
      assignedTo: assigneeId,
      createdBy: userId,
      title: title.trim(),
      description: description?.trim(),
      priority: priority?.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };
    const task = await TeamTask.create(payload);
    await Notification.create({
      user: assigneeId,
      type: "team_task",
      title: "تسک جدید تیمی",
      body: `از تیم ${team.name}: ${task.title}`,
      data: { teamId: team.id, taskId: task.id, title: task.title },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !status) {
      return res.status(400).json({ message: "userId and status are required" });
    }
    const task = await TeamTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "task not found" });
    if (task.assignedTo.toString() !== userId) {
      return res.status(403).json({ message: "only assignee can update" });
    }
    task.status = status === "done" ? "done" : "open";
    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
