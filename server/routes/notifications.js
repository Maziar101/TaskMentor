import express from "express";
import {
  getAllNotification,
  readNotification,
} from "../controllers/notificationCn.js";

const notificationRoutes = express.Router();

notificationRoutes.route("/", getAllNotification);
notificationRoutes.route("/read", readNotification);

export default notificationRoutes;
