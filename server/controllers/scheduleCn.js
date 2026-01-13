import ScheduledItem from "../models/ScheduledItem.js";
import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

// TODO
// YOU DONT NEED TO CHECK THE USER EXIST OR NOT BECAUSE TOKEN CREATED FOR A USER !
function normalizeDay(day) {
  if (!day) return null;
  return day.trim();
}

export const getSchedule = catchAsync(async (req, res, next) => {
  const day = normalizeDay(req?.query?.day);
  const token = getToken(req, next);
  if (!day) {
    return next(new HandleError("day param is required", 400));
  }
  const userExists = await Users.exists({ _id: token?.id });
  if (!userExists) return next(new HandleError("User Not Found", 404));
  const items = await ScheduledItem.find({ day, user: token?.id });
  return res.status(200).json({
    success: true,
    data: items,
  });
});

export const addSchedule = catchAsync(async (req, res, next) => {
  const { title, tag, day, hour, done, priority } = req.body;
  const token = getToken(req, next);
  if (
    !title?.trim() ||
    !normalizeDay(day) ||
    Number.isNaN(+hour) ||
    !token?.id
  ) {
    return next(
      new HandleError(
        "title, day (YYYY-MM-DD), hour and userId are required",
        400
      )
    );
  }

  const userExists = await Users.exists({ _id: token?.id });
  if (!userExists) return next(new HandleError("user not found", 404));

  const item = await ScheduledItem.create({
    title: title?.trim(),
    tag: tag?.trim(),
    priority: priority?.trim(),
    day: normalizeDay(day),
    hour: +hour,
    done,
    user: token?.id,
  });

  return res.status(201).json({
    success: true,
    data: item,
  });
});

export const updateSchedule = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const userExists = await Users.exists({ _id: token?.id });
  if (!userExists) return next(new HandleError("User Not Found", 404));

  const updates = {};
  if (typeof req.body.title === "string") updates.title = req.body.title.trim();
  if (typeof req.body.tag === "string") updates.tag = req.body.tag.trim();
  if (typeof req.body.day === "string")
    updates.day = normalizeDay(req.body.day);
  if (typeof req.body.hour !== "undefined")
    updates.hour = Number(req.body.hour);
  if (typeof req.body.done !== "undefined")
    updates.done = Boolean(req.body.done);
  if (typeof req.body.priority === "string")
    updates.priority = req.body.priority.trim();

  const item = await ScheduledItem.findOneAndUpdate(
    {
      _id: req.query.id,
      user: token?.id,
    },
    updates,
    { new: true, runValidators: true }
  );

  if (!item) {
    return next(new HandleError("item not found", 404));
  }

  return res.status(200).json({
    success: true,
    data: item,
  });
});

export const deleteSchedule = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const deleted = await ScheduledItem.findOneAndDelete({
    _id: req.query.id,
    user: token?.id,
  });
  if (!deleted) {
    return next(new HandleError("item not found", 404));
  }
  return res.status(200).json({
    success: true,
    message: "Item Deleted !",
  });
});
