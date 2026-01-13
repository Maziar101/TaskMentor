import Task from "../models/Task.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

export const getAllTasks = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const tasks = await Task.find({ user: token?.id }).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const addTask = catchAsync(async (req, res, next) => {
  const {
    title = title?.trim(),
    tag = tag?.trim(),
    priority = priority?.trim(),
  } = req?.body;
  const token = getToken(req, next);
  const task = await Task.create({ title, tag, priority, user: token?.id });
  return res.status(201).json({
    success: true,
    data: task,
  });
});

export const deleteTask = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const deleted = await Task.findOneAndDelete({
    _id: req.query.id,
    user: token,
  });
  if(!deleted){
    return next(new HandleError("task not found",404));
  };
  return res.status(200).json({
    success: true,
    message: "deleted",
  });
});
