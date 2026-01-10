import express from "express";
import { login, verify } from "../controllers/authCn.js";

const authRoutes = express.Router();

authRoutes.route("/login", login);
authRoutes.route("/verify", verify);

export default authRoutes;
