const Tour = require("../models/Tour");

function notDeleted() {
  return { deleted: { $ne: true } };
}

function withImageUrl(tour) {
  if (!tour) return tour;
  return { ...tour, imageUrl: tour.images?.[0] ?? "" };
}

async function createTour(data) {
  const tour = await Tour.create(data);
  return tour.toObject();
}

async function listTours({ includeDeleted = false, featured = false, page = 1, limit = 20 }) {
  const visibility = includeDeleted ? {} : notDeleted();
  const filter = featured ? { featured: true, ...visibility } : { ...visibility };
  const skip = (page - 1) * limit;

  const [tours, totalDocuments, featuredCount] = await Promise.all([
    Tour.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Tour.countDocuments(filter),
    Tour.countDocuments({ featured: true, ...notDeleted() }),
  ]);

  return { tours: tours.map(withImageUrl), totalDocuments, featuredCount };
}

async function getTourById(id, { includeDeleted = false } = {}) {
  const query = includeDeleted ? { _id: id } : { _id: id, ...notDeleted() };
  const tour = await Tour.findOne(query).lean();
  return withImageUrl(tour);
}

async function updateTour(id, patch) {
  const tour = await Tour.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  return withImageUrl(tour);
}

module.exports = { createTour, listTours, getTourById, updateTour };