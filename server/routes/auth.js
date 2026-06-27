import express from "express";
import { login, me, verify } from "../controllers/authCn.js";
import { protect } from "../middleware/auth.js";

const authRoutes = express.Router();

authRoutes.route("/login").post(login);
authRoutes.route("/verify").post(verify);
authRoutes.route("/me").get(protect, me);

export default authRoutes;
