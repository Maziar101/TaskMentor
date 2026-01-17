import express from "express";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notifications.js";
import scheduleRoutes from "./routes/schedule.js";
import taskRoutes from "./routes/tasks.js";
import teamAuditRoutes from "./routes/teamAudit.js";
import teamGroupRoutes from "./routes/teamGroups.js";
import teamsRoutes from "./routes/teams.js";
import teamMembersRoutes from "./routes/teamMembers.js";

const app = express();

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule",scheduleRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/teams",teamsRoutes);
app.use("/api/teams/audit",teamAuditRoutes);
app.use("/api/teams/group",teamGroupRoutes);
app.use("/api/teams/members",teamMembersRoutes);

export default app;
