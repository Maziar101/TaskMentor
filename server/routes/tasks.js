import express from "express";
import {
  addTask,
  deleteTask,
  getAllTasks,
  updateTask,
} from "../controllers/taskCn.js";
import { protect } from "../middleware/auth.js";

const taskRoutes = express.Router();

taskRoutes.use(protect);
taskRoutes.route("/").get(getAllTasks).post(addTask);
taskRoutes.route("/:id").patch(updateTask).delete(deleteTask);
taskRoutes.route("/").delete(deleteTask);

export default taskRoutes;
