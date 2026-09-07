import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";
import bcrypt from "bcryptjs";
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

  const user = await Users.findOne({ phone }).select("+password");
  return res.status(200).json({
    success: true,
    message: "کد تایید ارسال شد",
    newUser: !user,
    needsPasswordSetup: Boolean(user && !user.password),
  });
});

export const verify = catchAsync(async (req, res, next) => {
  const phone = req.body.phone?.trim();
  const code = req.body.code?.trim();
  const name = req.body.name?.trim();
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!phone || !code || !password) {
    return next(
      new HandleError("شماره موبایل، رمز عبور و کد تایید اجباری هستند", 400),
    );
  }
  if (password.length < 6) {
    return next(new HandleError("رمز عبور باید حداقل ۶ کاراکتر باشد", 400));
  }
  if (code !== MAGIC_CODE) {
    return next(new HandleError("کد تایید نادرست است", 401));
  }

  let user = await Users.findOne({ phone }).select("+password");
  if (!user) {
    if (!name) {
      return next(new HandleError("برای ثبت‌نام نام خود را وارد کنید", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await Users.create({
      phone,
      username: name,
      password: hashedPassword,
    });
  } else if (!user.password) {
    user.password = await bcrypt.hash(password, 12);
    await user.save();
  } else {
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return next(new HandleError("رمز عبور نادرست است", 401));
    }
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
