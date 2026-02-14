import express from "express";
import {
  deleteMemberFromGroup,
  getTeamMembers,
} from "../controllers/teamMembersCn.js";

const teamMembersRoutes = express.Router();

teamMembersRoutes.route("/").get(getTeamMembers).delete(deleteMemberFromGroup);

export default teamMembersRoutes;
