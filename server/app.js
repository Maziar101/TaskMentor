import express from "express";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notifications.js";
import scheduleRoutes from "./routes/schedule.js";
import taskRoutes from "./routes/tasks.js";

const app = express();

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule",scheduleRoutes);
app.use("/api/tasks",taskRoutes);

export default app;
