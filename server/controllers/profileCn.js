import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";

export const getProfileInfo = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      phone: req.user.phone,
    },
  });
});

export const updateProfileInfo = catchAsync(async (req, res, next) => {
  const username = req.body.username?.trim();
  if (!username) {
    return next(new HandleError("نام اجباری است", 400));
  }

  const user = await Users.findByIdAndUpdate(
    req.user._id,
    { username },
    { new: true, runValidators: true },
  );

  return res.status(200).json({
    success: true,
    data: {
      id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    },
  });
});
