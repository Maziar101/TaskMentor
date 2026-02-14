import express from "express";
import { login, verify } from "../controllers/authCn.js";

const authRoutes = express.Router();

authRoutes.route("/login").post(login);
authRoutes.route("/verify").post(verify);

export default authRoutes;
