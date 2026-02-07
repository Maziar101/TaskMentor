import { app, server } from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 4444

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
