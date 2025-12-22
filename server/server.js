require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const tasksRouter = require("./routes/tasks");
const scheduleRouter = require("./routes/schedule");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const teamsRouter = require("./routes/teams");
const teamMembersRouter = require("./routes/teamMembers");
const teamGroupsRouter = require("./routes/teamGroups");
const teamAuditRouter = require("./routes/teamAudit");
const teamTasksRouter = require("./routes/teamTasks");
const notificationsRouter = require("./routes/notifications");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pool", tasksRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/teams/:teamId/members", teamMembersRouter);
app.use("/api/teams/:teamId/groups", teamGroupsRouter);
app.use("/api/teams/:teamId/audit", teamAuditRouter);
app.use("/api/team-tasks", teamTasksRouter);
app.use("/api/notifications", notificationsRouter);

app.use(errorHandler);

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
    io.to(`group:${groupId}`).emit("group.typing", { groupId, memberId, isTyping });
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

connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
