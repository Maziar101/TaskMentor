import express from "express";
import {
  createTeamGroup,
  deleteGroup,
  deleteMessageFromGroup,
  getGroupMessaged,
  getTeamGroup,
  sendMessageInGroup,
} from "../controllers/teamGroupCn.js";

const teamGroupRoutes = express.Router();

teamGroupRoutes
  .route("/")
  .get(getTeamGroup)
  .post(createTeamGroup)
  .delete(deleteGroup);
teamGroupRoutes
  .route("/messages")
  .get(getGroupMessaged)
  .post(sendMessageInGroup)
  .delete(deleteMessageFromGroup);

export default teamGroupRoutes;