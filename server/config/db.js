import mongoose from "mongoose";

async function connectDB(uri) {
  const resolvedUri = uri || "mongodb://localhost:27017/taskmentor";
  if (!uri) {
    // eslint-disable-next-line no-console
    console.warn(
      `MONGO_URI not set. Falling back to local MongoDB at ${resolvedUri}`
    );
  }
  await mongoose.connect(resolvedUri);
  return mongoose.connection;
}

export default connectDB;