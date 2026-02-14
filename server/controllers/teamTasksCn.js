import TeamTask from "../models/TeamTask.js";
import catchAsync from "../utils/catchAsync.js";
import Notification from "../models/Notification.js";
import getToken from "../utils/getToken.js";
import Team from "../models/Team.js";
import HandleError from "../utils/HandleError.js";

export const getTeamMemberTask = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const tasks = await TeamTask.find({ assignedTo: token?.id }).sort({
    createdAt: -1,
  });
  return res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const getTeamTasks = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const team = await Team.findById(token?.id);
  if (!team) return next(new HandleError("team not found", 404));
  if (team.owner !== token.id) {
    return next(new HandleError("only owner can view team tasks", 403));
  }
  const tasks = await TeamTask.find({ team: req.query.teamId }).sort({
    createdAt: -1,
  });
  return res.status(200).json({
    success: true,
    data: tasks,
  });
});

export const addTaskForTeamMember = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId, assignedId, title, description, priority, dueDate } =
    req.body;

  if (!teamId || !assignedId || !title) {
    return next(
      new HandleError("teamId, assigneedId and title are required", 400)
    );
  }

  const team = await Team.findById(teamId);

  if (!team) return next(new HandleError("team not found", 404));

  if (team.owner !== token.id) {
    return next(new HandleError("only owner can assign", 403));
  }

  const memberExists = team.members.some((m) => m.user === assignedId);
  if (!memberExists) {
    return next(new HandleError("assignee is not in team", 400));
  }

  const payload = {
    team: teamId,
    assignedId: assignedId,
    createdBy: token.id,
    title: title.trim(),
    description: description.trim(),
    priority: priority?.trim(),
    dueDate: dueDate ? new Date(dueDate) : undefined,
  };

  const task = await TeamTask.create(payload);

  await Notification.create({
    user: assignedId,
    type: "team_task",
    title: "تسک جدید",
    body: `از تیم ${team.name}: ${task.title}`,
    data: { teamId: team.id, taskId: task.id, title: task.title },
  });

  return res.status(201).json({
    success: true,
    data: task,
  });
});

export const updateTeamMemberTask = catchAsync(async (req, res, next) => {
  const { status, teamTaskId } = req.query;

  if (!status) {
    return next(new HandleError("status is required", 400));
  }

  const task = await TeamTask.findById(teamTaskId);
  if (!task) return next(new HandleError("task not found", 404));

  if (task.assignedTo !== token.id) {
    return next(new HandleError("only assignee can update", 403));
  }

  task.status = status === "done" ? "done" : "open";
  await task.save();

  return res.status(200).json({
    success: true,
    data: task,
  });
});
