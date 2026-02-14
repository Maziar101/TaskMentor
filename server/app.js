import express from "express";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notifications.js";
import scheduleRoutes from "./routes/schedule.js";
import taskRoutes from "./routes/tasks.js";
import teamAuditRoutes from "./routes/teamAudit.js";
import teamGroupRoutes from "./routes/teamGroups.js";
import teamsRoutes from "./routes/teams.js";
import teamMembersRoutes from "./routes/teamMembers.js";
import teamTaskRoutes from "./routes/teamTasks.js";
import usersRoutes from "./routes/users.js";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import morgan from "morgan";
import dotenv from "dotenv";

const app = express();
const server = http.createServer(app);
dotenv.config({ path: "./.env" });

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamsRoutes);
app.use("/api/teams/audit", teamAuditRoutes);
app.use("/api/teams/group", teamGroupRoutes);
app.use("/api/teams/members", teamMembersRoutes);
app.use("/api/teams/tasks", teamTaskRoutes);
app.use("/api/users", usersRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("team.join", ({ teamId, userId }) => {
    if (!teamId || !userId) return;
    socket.data.userId = userId;
    socket.data.teamIds = socket.data.teamIds || new Set();
    socket.data.teamIds.add(teamId);
    socket.join(`team:${teamId}`);
    const count = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, count + 1);
    io.to(`team:${teamId}`).emit("member.status.changed", {
      memberId: userId,
      status: "online",
    });
  });

  socket.on("group.join", ({ groupId }) => {
    if (!groupId) return;
    socket.join(`group:${groupId}`);
  });

  socket.on("group.leave", ({ groupId }) => {
    if (!groupId) return;
    socket.leave(`group:${groupId}`);
  });

  socket.on("group.typing", ({ groupId, memberId, isTyping }) => {
    if (!groupId || !memberId) return;
    io.to(`group:${groupId}`).emit("group.typing", {
      groupId,
      memberId,
      isTyping,
    });
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (!userId) return;
    const count = (onlineUsers.get(userId) || 1) - 1;
    if (count <= 0) {
      onlineUsers.delete(userId);
      const teamIds = socket.data.teamIds || [];
      teamIds.forEach((teamId) => {
        io.to(`team:${teamId}`).emit("member.status.changed", {
          memberId: userId,
          status: "offline",
        });
      });
    } else {
      onlineUsers.set(userId, count);
    }
  });
});

export { app, server };
