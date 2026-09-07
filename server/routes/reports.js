import express from "express";
import { getReports } from "../controllers/reportsCn.js";
import { protect } from "../middleware/auth.js";

const reportsRoutes = express.Router();

reportsRoutes.get("/", protect, getReports);

export default reportsRoutes;
