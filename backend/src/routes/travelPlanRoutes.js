const express = require("express");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { listTravelPlans } = require("../services/travelPlanService");

const router = express.Router();

function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, "DATABASE_UNAVAILABLE", "MongoDB is not connected.");
  }
  next();
}

router.use(requireDatabase);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(String(req.query.page), 10) || 1;
    const limit = parseInt(String(req.query.limit), 10) || 100;
    const { plans, totalDocuments } = await listTravelPlans({ page, limit });
    const totalPages = Math.max(1, Math.ceil(totalDocuments / limit));

    sendSuccess(
      res,
      plans,
      { total: plans.length, totalDocuments, page, limit, totalPages },
      "Travel plans fetched successfully"
    );
  } catch (err) {
    sendError(res, 500, "TRAVEL_PLANS_LIST_FAILED", err.message || "Failed to list travel plans");
  }
});

module.exports = router;
