import express from "express";
import {
  addSchedule,
  deleteSchedule,
  getSchedule,
  updateSchedule,
} from "../controllers/scheduleCn.js";
import { protect } from "../middleware/auth.js";

const scheduleRoutes = express.Router();

scheduleRoutes.use(protect);
scheduleRoutes
  .route("/")
  .get(getSchedule)
  .post(addSchedule)
  .patch(updateSchedule)
  .delete(deleteSchedule);


export default scheduleRoutes;
