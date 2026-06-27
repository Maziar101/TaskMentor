import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";
import jwt from "jsonwebtoken";

const MAGIC_CODE = "00000";

const signToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new HandleError("JWT_SECRET is not configured", 500);
  return jwt.sign(
    { id: user._id, role: user.role, subscription: user.subscription },
    jwtSecret,
    { expiresIn: "7d" },
  );
};

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  phone: user.phone,
  role: user.role,
});

export const login = catchAsync(async (req, res, next) => {
  const phone = req.body.phone?.trim();
  const phoneRegex = /^09[0-9]{9}$/;

  if (!phone) {
    return next(new HandleError("شماره موبایل اجباری است", 400));
  }
  if (!phoneRegex.test(phone)) {
    return next(new HandleError("شماره موبایل وارد شده معتبر نیست", 400));
  }

  const user = await Users.findOne({ phone });
  return res.status(200).json({
    success: true,
    message: "کد تایید ارسال شد",
    newUser: !user,
  });
});

export const verify = catchAsync(async (req, res, next) => {
  const phone = req.body.phone?.trim();
  const code = req.body.code?.trim();
  const name = req.body.name?.trim();

  if (!phone || !code) {
    return next(new HandleError("شماره موبایل و کد تایید اجباری هستند", 400));
  }
  if (code !== MAGIC_CODE) {
    return next(new HandleError("کد تایید نادرست است", 401));
  }

  let user = await Users.findOne({ phone });
  if (!user) {
    if (!name) {
      return next(new HandleError("برای ثبت‌نام نام خود را وارد کنید", 400));
    }
    user = await Users.create({ phone, username: name });
  }

  const token = signToken(user);
  return res.status(200).json({
    success: true,
    token,
    user: publicUser(user),
  });
});

export const me = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: publicUser(req.user),
  });
});
