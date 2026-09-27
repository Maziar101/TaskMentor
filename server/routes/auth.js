import express from "express";
import {
  adminSession,
  createAdminHandoff,
  exchangeAdminHandoff,
  login,
  me,
  verify,
} from "../controllers/authCn.js";
import { protect } from "../middleware/auth.js";
import isAdminOrSuperAdmin from "../middleware/isAdminOrSuperAdmin.js";

const authRoutes = express.Router();

authRoutes.route("/login").post(login);
authRoutes.route("/verify").post(verify);
authRoutes.route("/me").get(protect, me);
authRoutes
  .route("/admin-handoff")
  .post(protect, isAdminOrSuperAdmin, createAdminHandoff);
authRoutes.route("/admin-exchange").post(exchangeAdminHandoff);
authRoutes
  .route("/admin-session")
  .get(protect, isAdminOrSuperAdmin, adminSession);

export default authRoutes;
