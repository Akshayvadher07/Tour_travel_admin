const TravelPlan = require("../models/TravelPlan");

async function listTravelPlans({ page = 1, limit = 100 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 100));
  const skip = (safePage - 1) * safeLimit;

  const [plans, totalDocuments] = await Promise.all([
    TravelPlan.find({}).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    TravelPlan.countDocuments({}),
  ]);

  return { plans, totalDocuments, page: safePage, limit: safeLimit };
}

module.exports = { listTravelPlans };
