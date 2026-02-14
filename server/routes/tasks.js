import express from "express";
import { addTask, deleteTask, getAllTasks } from "../controllers/taskCn.js";

const taskRoutes = express.Router();

taskRoutes.route("/").get(getAllTasks).post(addTask).delete(deleteTask);

export default taskRoutes;