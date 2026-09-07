import Task from "../models/Task.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";

const allowedUpdates = ["title", "tag", "priority", "day", "hour", "duration", "done"];

function normalizeTaskPayload(body) {
  const payload = {};
  if (typeof body.title === "string") payload.title = body.title.trim();
  if (typeof body.tag === "string") payload.tag = body.tag.trim();
  if (typeof body.priority === "string") payload.priority = body.priority.trim();
  if (typeof body.day === "string") payload.day = body.day.trim();
  if (typeof body.hour !== "undefined") payload.hour = Number(body.hour);
  if (typeof body.duration !== "undefined") payload.duration = Number(body.duration);
  if (typeof body.done !== "undefined") payload.done = Boolean(body.done);
  return payload;
}

export const getAllTasks = catchAsync(async (req, res) => {
  const query = { user: req.user._id };
  if (req.query.day) query.day = req.query.day;
  if (req.query.unscheduled === "true") query.day = { $exists: false };

  const tasks = await Task.find(query).sort({ day: 1, hour: 1, createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const addTask = catchAsync(async (req, res, next) => {
  const payload = normalizeTaskPayload(req.body);
  if (!payload.title) {
    return next(new HandleError("عنوان تسک اجباری است", 400));
  }

  const task = await Task.create({ ...payload, user: req.user._id });
  return res.status(201).json({
    success: true,
    data: task,
  });
});

export const deleteTask = catchAsync(async (req, res, next) => {
  const id = req.params.id || req.query.id;
  const deleted = await Task.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!deleted) {
    return next(new HandleError("task not found", 404));
  }
  return res.status(200).json({
    success: true,
    message: "deleted",
  });
});

export const updateTask = catchAsync(async (req, res, next) => {
  const updates = normalizeTaskPayload(req.body);
  Object.keys(updates).forEach((key) => {
    if (!allowedUpdates.includes(key)) delete updates[key];
  });

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true },
  );

  if (!task) {
    return next(new HandleError("task not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: task,
  });
});
