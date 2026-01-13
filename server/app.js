import express from "express";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notifications.js";
import scheduleRoutes from "./routes/schedule.js";

const app = express();

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule",scheduleRoutes);

export default app;
