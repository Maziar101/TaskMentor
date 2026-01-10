import express from "express";
import {
  getAllNotification,
  readNotification,
} from "../controllers/notificationCn";

const notificationRoutes = express.Router();

notificationRoutes.route("/", getAllNotification);
notificationRoutes.route("/read", readNotification);

export default notificationRoutes;
