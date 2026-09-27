import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import AdminHandoff from "../models/AdminHandoff.js";

const MAGIC_CODE = "00000";
const ADMIN_ROLES = new Set(["admin", "owner"]);
const ADMIN_HANDOFF_LIFETIME_MS = 60 * 1000;

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
  avatarUrl: user.avatarUrl || "",
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

const hashAdminHandoff = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createAdminHandoff = catchAsync(async (req, res) => {
  const handoffToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_HANDOFF_LIFETIME_MS);

  await AdminHandoff.findOneAndUpdate(
    { userId: req.user._id },
    {
      userId: req.user._id,
      tokenHash: hashAdminHandoff(handoffToken),
      expiresAt,
    },
    { upsert: true, runValidators: true },
  );

  return res.status(201).json({
    success: true,
    handoffToken,
    expiresAt,
  });
});

export const exchangeAdminHandoff = catchAsync(async (req, res, next) => {
  const handoffToken =
    typeof req.body.handoffToken === "string"
      ? req.body.handoffToken.trim()
      : "";

  if (!handoffToken || !/^[A-Za-z0-9_-]{43}$/.test(handoffToken)) {
    return next(new HandleError("کد ورود پنل مدیریت نامعتبر است", 401));
  }

  const handoff = await AdminHandoff.findOneAndDelete({
    tokenHash: hashAdminHandoff(handoffToken),
    expiresAt: { $gt: new Date() },
  });

  if (!handoff) {
    return next(new HandleError("کد ورود پنل مدیریت منقضی یا مصرف شده است", 401));
  }

  const user = await Users.findById(handoff.userId);
  if (!user || !ADMIN_ROLES.has(user.role)) {
    return next(new HandleError("دسترسی به پنل مدیریت مجاز نیست", 403));
  }

  return res.status(200).json({
    success: true,
    token: signToken(user),
    user: publicUser(user),
  });
});

export const adminSession = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: publicUser(req.user),
  });
});
