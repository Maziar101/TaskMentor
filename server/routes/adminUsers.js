import express from "express";
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
} from "../controllers/adminUsersCn.js";
import { protect } from "../middleware/auth.js";
import isAdminOrSuperAdmin from "../middleware/isAdminOrSuperAdmin.js";

const adminUsersRoutes = express.Router();

adminUsersRoutes.get("/", protect, isAdminOrSuperAdmin, getAdminUsers);
adminUsersRoutes.patch("/:userId", protect, isAdminOrSuperAdmin, updateAdminUser);
adminUsersRoutes.patch("/:userId/status", protect, isAdminOrSuperAdmin, updateAdminUserStatus);
adminUsersRoutes.delete("/:userId", protect, isAdminOrSuperAdmin, deleteAdminUser);

export default adminUsersRoutes;
