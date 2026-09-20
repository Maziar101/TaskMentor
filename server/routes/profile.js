import express from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  getProfileAvatars,
  getProfileInfo,
  uploadProfileAvatar,
  updateProfileInfo,
} from "../controllers/profileCn.js";
import { protect } from "../middleware/auth.js";
import HandleError from "../utils/HandleError.js";

const profileRoutes = express.Router();
const routeDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(routeDirectory, "../uploads/profiles");
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${allowedImageTypes.get(file.mimetype)}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, allowedImageTypes.has(file.mimetype)),
});

const receiveAvatar = (req, res, next) => {
  avatarUpload.single("avatar")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new HandleError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد", 400));
    }
    if (error) return next(error);
    return uploadProfileAvatar(req, res, next);
  });
};

profileRoutes.route("/").get(protect, getProfileInfo).patch(protect, updateProfileInfo);
profileRoutes.get("/avatars", protect, getProfileAvatars);
profileRoutes.post("/avatar", protect, receiveAvatar);

export default profileRoutes;
