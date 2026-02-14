import express from "express";
import {
  acceptInvite,
  createTeam,
  getAllTeams,
  inviteMember,
} from "../controllers/teamsCn.js";

const teamsRoutes = express.Router();

teamsRoutes.route("/").get(getAllTeams).post(createTeam);
teamsRoutes.route("/invite").post(inviteMember);
teamsRoutes.route("/accept").post(acceptInvite);

export default teamsRoutes;
