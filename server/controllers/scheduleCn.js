import ScheduledItem from "../models/ScheduledItem.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";

// TODO
// YOU DONT NEED TO CHECK THE USER EXIST OR NOT BECAUSE TOKEN CREATED FOR A USER !
function normalizeDay(day) {
  if (!day) return null;
  return day.trim();
}

export const getSchedule = catchAsync(async (req, res, next) => {
  const day = normalizeDay(req?.query?.day);
  if (!day) {
    return next(new HandleError("day param is required", 400));
  }
  const items = await ScheduledItem.find({ day, user: req.user._id }).sort({
    hour: 1,
  });
  return res.status(200).json({
    success: true,
    data: items,
  });
});

export const addSchedule = catchAsync(async (req, res, next) => {
  const { title, tag, day, hour, done, priority, duration } = req.body;
  if (!title?.trim() || !normalizeDay(day) || Number.isNaN(+hour)) {
    return next(
      new HandleError(
        "title, day (YYYY-MM-DD) and hour are required",
        400,
      ),
    );
  }

  const item = await ScheduledItem.create({
    title: title?.trim(),
    tag: tag?.trim(),
    priority: priority?.trim(),
    day: normalizeDay(day),
    hour: +hour,
    duration: Number(duration) || 1,
    done,
    user: req.user._id,
  });

  return res.status(201).json({
    success: true,
    data: item,
  });
});

export const updateSchedule = catchAsync(async (req, res, next) => {
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
  if (typeof req.body.duration !== "undefined")
    updates.duration = Number(req.body.duration);

  const item = await ScheduledItem.findOneAndUpdate(
    {
      _id: req.query.id,
      user: req.user._id,
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
  const deleted = await ScheduledItem.findOneAndDelete({
    _id: req.query.id,
    user: req.user._id,
  });
  if (!deleted) {
    return next(new HandleError("item not found", 404));
  }
  return res.status(200).json({
    success: true,
    message: "Item Deleted !",
  });
});
