import express from "express";
import {
  addTaskForTeamMember,
  getTeamTasks,
  updateTeamMemberTask,
} from "../controllers/teamTasksCn.js";

const teamTaskRoutes = express.Router();

teamTaskRoutes.route("/").get(getTeamTasks);
teamTaskRoutes
  .route("/team")
  .get(getTeamTasks)
  .post(addTaskForTeamMember)
  .patch(updateTeamMemberTask);

export default teamTaskRoutes;
