require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const tourRoutes = require("./routes/tourRoutes");
const destinationRoutes = require("./routes/destinationRoutes");
const travelPlanRoutes = require("./routes/travelPlanRoutes");
const uploadRouter = require("./routes/upload");
const { sendError } = require("./utils/apiResponse");

const app = express();
const PORT = Number(process.env.PORT) || 3010;

const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isLocalDevOrigin(origin) {
  if (!origin) return false;
  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (clientOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use("/api/tours", tourRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/travel-plans", travelPlanRoutes);
app.use("/api/upload", uploadRouter);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "admin-backend",
    port: PORT,
    note: "Tours API — same MongoDB as the rest of your project when MONGODB_URI matches.",
  });
});

// ── 404 catch-all (must be last) ────────────────────────
app.use((req, res) => {
  sendError(res, 404, "NOT_FOUND", "No handler for this path.", {
    method: req.method,
    path: req.originalUrl,
  });
});

async function start() {
  try {
    await connectDB();
    console.log("MongoDB connected (admin API).");
  } catch (err) {
    console.error("MongoDB connection error:", err.message || err);
    console.error("API will still start; /api/tours returns 503 until the database is reachable.\n");
  }

  app.listen(PORT, () => {
    console.log(`Admin API listening on http://localhost:${PORT}`);
  });
}

void start();