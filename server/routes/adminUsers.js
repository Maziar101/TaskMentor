import express from "express";
import { getAdminUsers } from "../controllers/adminUsersCn.js";
import { protect } from "../middleware/auth.js";
import isAdminOrSuperAdmin from "../middleware/isAdminOrSuperAdmin.js";

const adminUsersRoutes = express.Router();

adminUsersRoutes.get("/", protect, isAdminOrSuperAdmin, getAdminUsers);

export default adminUsersRoutes;
