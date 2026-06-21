const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || !String(uri).trim()) {
    throw new Error("MONGODB_URI is not set in .env");
  }
  await mongoose.connect(uri);
}

module.exports = { connectDB };
