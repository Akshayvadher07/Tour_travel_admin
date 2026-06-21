const express = require("express");
const mongoose = require("mongoose");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { createTour, listTours, getTourById, updateTour } = require("../services/tourService");
const { existsDestinationName } = require("../services/destinationService");

const router = express.Router();
const CATEGORIES = ["adventure", "cultural", "relaxation", "wildlife", "city"];

function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key || String(key).trim() === "") {
    if (process.env.NODE_ENV === "production") {
      return sendError(
        res,
        503,
        "ADMIN_NOT_CONFIGURED",
        "Set ADMIN_API_KEY in the environment to enable tour create/update in production."
      );
    }
    return next();
  }
  const provided = String(req.get("x-admin-key") || "").trim();
  if (provided !== String(key).trim()) {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid or missing admin key. Send header x-admin-key matching ADMIN_API_KEY.");
  }
  next();
}

function requireDatabase(_req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return sendError(
      res,
      503,
      "DATABASE_UNAVAILABLE",
      "MongoDB is not connected. Fix MONGODB_URI and restart this API.",
      { readyState: mongoose.connection.readyState }
    );
  }
  next();
}

/**
 * Normalise the `images` field from a request body.
 *
 * Accepts either:
 *   - `images`  – array of URL strings  (new format)
 *   - `imageUrl` – single URL string    (legacy / backward-compat)
 *
 * Returns `null` when neither is usable.
 */
function resolveImages(body) {
  if (Array.isArray(body.images) && body.images.length > 0) {
    const urls = body.images.map((u) => String(u).trim()).filter(Boolean);
    return urls.length > 0 ? urls : null;
  }
  // fall back to legacy imageUrl
  if (body.imageUrl && String(body.imageUrl).trim() !== "") {
    return [String(body.imageUrl).trim()];
  }
  return null;
}

router.use(requireDatabase);

// ── POST /api/tours ──────────────────────────────────────────────────────────
router.post("/", requireAdmin, async (req, res) => {
  try {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const {
      title,
      destination,
      description,
      durationDays,
      priceFrom,
      category = "cultural",
      featured = false,
    } = b;

    if (!title || !destination || !description) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "title, destination, and description are required.",
        { fields: ["title", "destination", "description"] }
      );
    }

    const images = resolveImages(b);
    if (!images) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "At least one image is required. Send an `images` array (or a legacy `imageUrl` string).",
        { fields: ["images"] }
      );
    }

    const days = Number(durationDays);
    const price = Number(priceFrom);
    if (!Number.isFinite(days) || days < 1 || !Number.isFinite(price) || price < 0) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "durationDays must be >= 1 and priceFrom must be >= 0.",
        { durationDays: days, priceFrom: price }
      );
    }
    if (!CATEGORIES.includes(String(category))) {
      return sendError(res, 400, "VALIDATION_ERROR", `category must be one of: ${CATEGORIES.join(", ")}.`, {
        category,
        allowed: CATEGORIES,
      });
    }

    const destinationExists = await existsDestinationName(destination);
    if (!destinationExists) {
      return sendError(res, 400, "VALIDATION_ERROR", "Destination must exist. Create it from destinations first.");
    }

    const tour = await createTour({
      title: String(title).trim(),
      destination: String(destination).trim(),
      description: String(description),
      durationDays: days,
      priceFrom: price,
      images,
      category: String(category),
      featured: Boolean(featured),
      deleted: false,
    });

    sendSuccess(res, tour, { resource: "tour", id: String(tour._id) }, "Tour created successfully");
  } catch (err) {
    sendError(res, 500, "TOUR_CREATE_FAILED", err.message || "Failed to create tour");
  }
});

// ── GET /api/tours ───────────────────────────────────────────────────────────
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
      const featured = req.query.featured === "true";
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
      const { tours, totalDocuments, featuredCount } = await listTours({ includeDeleted, featured, page, limit });

      const totalPages = Math.max(1, Math.ceil(totalDocuments / limit));

      sendSuccess(
        res,
        tours,
        {
          total: tours.length,
          totalDocuments,
          page,
          limit,
          totalPages,
          filters: { featured: featured || undefined, includeDeleted: includeDeleted || undefined },
          counts: {
            all: totalDocuments,
            featured: featuredCount,
            returned: tours.length,
          },
        },
        "Tours fetched successfully"
      );
    } catch (err) {
      sendError(res, 500, "TOURS_LIST_FAILED", err.message || "Failed to list tours");
    }
  }
);

// ── GET /api/tours/:id ───────────────────────────────────────────────────────
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
      const tour = await getTourById(req.params.id, { includeDeleted });
      if (!tour) {
        return sendError(res, 404, "TOUR_NOT_FOUND", "No tour exists for this id.", { id: req.params.id });
      }
      sendSuccess(res, tour, { resource: "tour", id: String(tour._id) }, "Tour fetched successfully");
    } catch (err) {
      sendError(res, 400, "INVALID_TOUR_ID", "The tour id is not a valid ObjectId.", { id: req.params.id });
    }
  }
);

// ── PUT /api/tours/:id ───────────────────────────────────────────────────────
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const patch = {};

    if (b.title !== undefined) patch.title = String(b.title).trim();

    if (b.destination !== undefined) {
      const destination = String(b.destination).trim();
      const destinationExists = await existsDestinationName(destination);
      if (!destinationExists) {
        return sendError(res, 400, "VALIDATION_ERROR", "Destination must exist. Create it from destinations first.");
      }
      patch.destination = destination;
    }

    if (b.description !== undefined) patch.description = String(b.description);

    // Multi-image: accept `images` array or legacy `imageUrl`
    if (b.images !== undefined || b.imageUrl !== undefined) {
      const images = resolveImages(b);
      if (!images) {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "images must be a non-empty array of URL strings.",
          { images: b.images }
        );
      }
      patch.images = images;
    }

    if (b.durationDays !== undefined) {
      const days = Number(b.durationDays);
      if (!Number.isFinite(days) || days < 1) {
        return sendError(res, 400, "VALIDATION_ERROR", "durationDays must be a number >= 1.", { durationDays: b.durationDays });
      }
      patch.durationDays = days;
    }
    if (b.priceFrom !== undefined) {
      const price = Number(b.priceFrom);
      if (!Number.isFinite(price) || price < 0) {
        return sendError(res, 400, "VALIDATION_ERROR", "priceFrom must be a number >= 0.", { priceFrom: b.priceFrom });
      }
      patch.priceFrom = price;
    }
    if (b.category !== undefined) {
      if (!CATEGORIES.includes(String(b.category))) {
        return sendError(res, 400, "VALIDATION_ERROR", `category must be one of: ${CATEGORIES.join(", ")}.`, {
          category: b.category,
        });
      }
      patch.category = String(b.category);
    }
    if (b.featured !== undefined) patch.featured = Boolean(b.featured);
    if (b.deleted !== undefined) patch.deleted = Boolean(b.deleted);

    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, "VALIDATION_ERROR", "No valid fields to update.", {
        allowed: ["title", "destination", "description", "images", "durationDays", "priceFrom", "category", "featured", "deleted"],
      });
    }

    const tour = await updateTour(req.params.id, patch);
    if (!tour) {
      return sendError(res, 404, "TOUR_NOT_FOUND", "No tour exists for this id.", { id: req.params.id });
    }
    sendSuccess(res, tour, { resource: "tour", id: String(tour._id) }, "Tour updated successfully");
  } catch (err) {
    if (err.name === "CastError") {
      return sendError(res, 400, "INVALID_TOUR_ID", "The tour id is not a valid ObjectId.", { id: req.params.id });
    }
    sendError(res, 500, "TOUR_UPDATE_FAILED", err.message || "Failed to update tour");
  }
});

module.exports = router;