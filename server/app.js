import express from "express";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
