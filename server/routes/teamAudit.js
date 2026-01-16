import express from "express";
import { getTeamAudit } from "../controllers/teamAuditCn.js";

const teamAuditRoutes = express.Router();

teamAuditRoutes.route("/").get(getTeamAudit);

export default teamAuditRoutes;