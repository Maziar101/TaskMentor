import express from "express";
import {
  getProfileInfo,
  updateProfileInfo,
} from "../controllers/profileCn.js";
import { protect } from "../middleware/auth.js";

const profileRoutes = express.Router();

profileRoutes.route("/").get(protect, getProfileInfo).patch(protect, updateProfileInfo);

export default profileRoutes;
