import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const controllerDirectory = path.dirname(fileURLToPath(import.meta.url));
const presetDirectory = path.resolve(controllerDirectory, "../../public/profiles");
const allowedPresetExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const publicProfile = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl || "",
});

async function getPresetAvatars() {
  const entries = await readdir(presetDirectory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  return entries
    .filter((entry) => entry.isFile() && allowedPresetExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({
      id: entry.name,
      url: `/profiles/${encodeURIComponent(entry.name)}`,
    }))
    .sort((first, second) => first.id.localeCompare(second.id, "fa"));
}

export const getProfileInfo = catchAsync(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: publicProfile(req.user),
  });
});

export const getProfileAvatars = catchAsync(async (_req, res) => {
  return res.status(200).json({
    success: true,
    data: await getPresetAvatars(),
  });
});

export const updateProfileInfo = catchAsync(async (req, res, next) => {
  const updates = {};
  if (Object.hasOwn(req.body, "username")) {
    const username = req.body.username?.trim();
    if (!username) return next(new HandleError("نام اجباری است", 400));
    updates.username = username;
  }

  if (Object.hasOwn(req.body, "avatarUrl")) {
    if (typeof req.body.avatarUrl !== "string") {
      return next(new HandleError("تصویر پروفایل معتبر نیست", 400));
    }
    const avatarUrl = req.body.avatarUrl.trim();
    const presets = await getPresetAvatars();
    if (avatarUrl && !presets.some((avatar) => avatar.url === avatarUrl)) {
      return next(new HandleError("آواتار انتخاب‌شده معتبر نیست", 400));
    }
    updates.avatarUrl = avatarUrl;
  }

  if (!Object.keys(updates).length) {
    return next(new HandleError("تغییری برای ذخیره ارسال نشده است", 400));
  }

  const user = await Users.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true },
  );

  return res.status(200).json({
    success: true,
    data: publicProfile(user),
  });
});

export const uploadProfileAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new HandleError("فرمت تصویر معتبر نیست", 400));

  const user = await Users.findByIdAndUpdate(
    req.user._id,
    { avatarUrl: `/uploads/profiles/${req.file.filename}` },
    { new: true, runValidators: true },
  );

  return res.status(200).json({
    success: true,
    data: publicProfile(user),
  });
});
