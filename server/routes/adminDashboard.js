import express from "express";
import { getAdminDashboard } from "../controllers/adminDashboardCn.js";
import { protect } from "../middleware/auth.js";
import isAdminOrSuperAdmin from "../middleware/isAdminOrSuperAdmin.js";

const adminDashboardRoutes = express.Router();

adminDashboardRoutes.get("/", protect, isAdminOrSuperAdmin, getAdminDashboard);

export default adminDashboardRoutes;
