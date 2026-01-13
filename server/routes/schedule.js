import express from "express";
import {
  addSchedule,
  deleteSchedule,
  getSchedule,
  updateSchedule,
} from "../controllers/scheduleCn.js";

const scheduleRoutes = express.Router();

scheduleRoutes
  .route("/")
  .get(getSchedule)
  .post(addSchedule)
  .patch(updateSchedule)
  .delete(deleteSchedule);


export default scheduleRoutes;