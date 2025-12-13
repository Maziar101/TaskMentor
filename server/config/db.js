const mongoose = require("mongoose");

async function connectDB(uri) {
  if (!uri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = connectDB;
