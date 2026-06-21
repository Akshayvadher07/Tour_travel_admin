const express = require("express");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { listDestinations, getDestinationById, createDestination, updateDestination } = require("../services/destinationService");

const router = express.Router();

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key || String(key).trim() === "") {
    if (process.env.NODE_ENV === "production") {
      return sendError(
        res,
        503,
        "ADMIN_NOT_CONFIGURED",
        "Set ADMIN_API_KEY in the environment to enable destination write actions in production."
      );
    }
    return next();
  }
  const provided = String(req.get("x-admin-key") || "").trim();
  if (provided !== String(key).trim()) {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid or missing admin key.");
  }
  next();
}

function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, "DATABASE_UNAVAILABLE", "MongoDB is not connected.");
  }
  next();
}

router.use(requireDatabase);

router.get(
  "/",
  (req, res, next) => {
    if (req.query.includeDeleted === "true") {
      return requireAdmin(req, res, next);
    }
    next();
  },
  async (req, res) => {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const data = await listDestinations({ includeDeleted });
      sendSuccess(res, data, { total: data.length }, "Destinations fetched successfully");
    } catch (err) {
      sendError(res, 500, "DESTINATIONS_LIST_FAILED", err.message || "Failed to list destinations");
    }
  }
);

router.post("/", requireAdmin, async (req, res) => {
  try {
    const destination = await createDestination(req.body || {});
    sendSuccess(res, destination, { id: String(destination._id) }, "Destination created successfully");
  } catch (err) {
    sendError(res, 400, "DESTINATION_CREATE_FAILED", err.message || "Failed to create destination");
  }
});

router.get(
  "/:id",
  (req, res, next) => {
    if (req.query.includeDeleted === "true") {
      return requireAdmin(req, res, next);
    }
    next();
  },
  async (req, res) => {
    try {
      const includeDeleted = req.query.includeDeleted === "true";
      const destination = await getDestinationById(req.params.id, { includeDeleted });
      if (!destination) {
        return sendError(res, 404, "DESTINATION_NOT_FOUND", "No destination exists for this id.");
      }
      sendSuccess(res, destination, { id: String(destination._id) }, "Destination fetched successfully");
    } catch (err) {
      sendError(res, 400, "INVALID_DESTINATION_ID", "Invalid destination id.");
    }
  }
);

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await updateDestination(req.params.id, req.body || {});
    if (!updated) return sendError(res, 404, "DESTINATION_NOT_FOUND", "No destination found for this id.");
    sendSuccess(res, updated, { id: String(updated._id) }, "Destination updated successfully");
  } catch (err) {
    if (err.name === "CastError") {
      return sendError(res, 400, "INVALID_DESTINATION_ID", "Invalid destination id.");
    }
    sendError(res, 400, "DESTINATION_UPDATE_FAILED", err.message || "Failed to update destination");
  }
});

module.exports = router;
