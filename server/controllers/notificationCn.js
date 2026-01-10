import Notification from "../models/Notification.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

export const getAllNotification = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const notifications = await Notification.find({ user: token?.id })
    .sort({
      createdAt: -1,
    })
    .limit(50);
  return res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const readNotification = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const updatedNotif = await Notification.findOneAndUpdate(
    {
      _id: req.query.id,
      user: token?.id,
    },
    { read: true },
    { new: true }
  );
  if (!updatedNotif) {
    return next(new HandleError("اعلان یافت نشد !", 404));
  }
  return res.status(200).json({
    success: true,
    message: "اعلان خوانده شد !",
    data: updatedNotif,
  });
});

// TODO
// Add A Controller For Admin To Send A Notif For a User