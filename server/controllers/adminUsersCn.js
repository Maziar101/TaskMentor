import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";
import { isValidObjectId } from "mongoose";

const USER_FIELDS = "username phone avatarUrl role subscription isActive createdAt";
const PHONE_PATTERN = /^09[0-9]{9}$/;
const VALID_ROLES = new Set(["owner", "admin", "user"]);
const VALID_SUBSCRIPTIONS = new Set(["free", "pro", "enterprise"]);

function getUserId(req, next) {
  if (!isValidObjectId(req.params.userId)) {
    next(new HandleError("شناسه کاربر نامعتبر است", 400));
    return null;
  }

  return req.params.userId;
}

function ensureCanManage(req, target, next, { destructive = false, nextRole } = {}) {
  if (destructive && target._id.equals(req.user._id)) {
    next(new HandleError("نمی‌توانید حساب خودتان را حذف یا غیرفعال کنید", 400));
    return false;
  }

  if (target.role === "owner" && req.user.role !== "owner") {
    next(new HandleError("فقط مالک می‌تواند حساب مالک را مدیریت کند", 403));
    return false;
  }

  if (nextRole === "owner" && req.user.role !== "owner") {
    next(new HandleError("فقط مالک می‌تواند نقش مالک را اعطا کند", 403));
    return false;
  }

  if (nextRole && nextRole !== target.role && req.user.role !== "owner") {
    next(new HandleError("فقط مالک می‌تواند نقش کاربران را تغییر دهد", 403));
    return false;
  }

  return true;
}

async function ensureAnotherActiveOwner(target, next, { nextRole, nextActive, deleting = false } = {}) {
  const removesActiveOwner = target.role === "owner"
    && target.isActive !== false
    && (deleting || (nextRole && nextRole !== "owner") || nextActive === false);

  if (!removesActiveOwner) return true;

  const anotherOwnerExists = await Users.exists({
    _id: { $ne: target._id },
    role: "owner",
    isActive: { $ne: false },
  });

  if (!anotherOwnerExists) {
    next(new HandleError("حداقل یک مالک فعال باید در سیستم باقی بماند", 400));
    return false;
  }

  return true;
}

function serializeUser(user) {
  const value = user.toObject ? user.toObject() : user;
  return { ...value, isActive: value.isActive !== false };
}

export const getAdminUsers = catchAsync(async (_req, res) => {
  const users = await Users.find()
    .select(USER_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: users.map(serializeUser),
  });
});

export const updateAdminUser = catchAsync(async (req, res, next) => {
  const userId = getUserId(req, next);
  if (!userId) return;

  const target = await Users.findById(userId).select(USER_FIELDS);
  if (!target) return next(new HandleError("کاربر پیدا نشد", 404));

  const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
  const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
  const role = typeof req.body.role === "string" ? req.body.role : "";
  const subscription = typeof req.body.subscription === "string" ? req.body.subscription : "";

  if (!username || username.length > 120) {
    return next(new HandleError("نام کاربر اجباری است و نباید بیش از ۱۲۰ کاراکتر باشد", 400));
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return next(new HandleError("شماره موبایل وارد شده معتبر نیست", 400));
  }
  if (!VALID_ROLES.has(role) || !VALID_SUBSCRIPTIONS.has(subscription)) {
    return next(new HandleError("نقش یا نوع اشتراک نامعتبر است", 400));
  }
  if (!ensureCanManage(req, target, next, { nextRole: role })) return;
  if (!(await ensureAnotherActiveOwner(target, next, { nextRole: role }))) return;

  const duplicatePhone = phone
    ? await Users.exists({ phone, _id: { $ne: target._id } })
    : null;
  if (duplicatePhone) {
    return next(new HandleError("این شماره موبایل قبلاً ثبت شده است", 409));
  }

  target.username = username;
  target.phone = phone || undefined;
  target.role = role;
  target.subscription = subscription;
  await target.save();

  return res.status(200).json({ success: true, data: serializeUser(target) });
});

export const updateAdminUserStatus = catchAsync(async (req, res, next) => {
  const userId = getUserId(req, next);
  if (!userId) return;
  if (typeof req.body.isActive !== "boolean") {
    return next(new HandleError("وضعیت حساب نامعتبر است", 400));
  }

  const target = await Users.findById(userId).select(USER_FIELDS);
  if (!target) return next(new HandleError("کاربر پیدا نشد", 404));
  if (!ensureCanManage(req, target, next, { destructive: req.body.isActive === false })) return;
  if (!(await ensureAnotherActiveOwner(target, next, { nextActive: req.body.isActive }))) return;

  target.isActive = req.body.isActive;
  await target.save();

  return res.status(200).json({ success: true, data: serializeUser(target) });
});

export const deleteAdminUser = catchAsync(async (req, res, next) => {
  const userId = getUserId(req, next);
  if (!userId) return;

  const target = await Users.findById(userId).select(USER_FIELDS);
  if (!target) return next(new HandleError("کاربر پیدا نشد", 404));
  if (!ensureCanManage(req, target, next, { destructive: true })) return;
  if (!(await ensureAnotherActiveOwner(target, next, { deleting: true }))) return;

  await target.deleteOne();
  return res.status(200).json({ success: true, message: "کاربر حذف شد", data: { id: target.id } });
});
