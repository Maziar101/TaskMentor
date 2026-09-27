import HandleError from "../utils/HandleError.js";

const ADMIN_ROLES = new Set(["admin", "owner"]);

export default function isAdminOrSuperAdmin(req, _res, next) {
  if (!req.user || !ADMIN_ROLES.has(req.user.role)) {
    return next(new HandleError("دسترسی به پنل مدیریت مجاز نیست", 403));
  }

  return next();
}
