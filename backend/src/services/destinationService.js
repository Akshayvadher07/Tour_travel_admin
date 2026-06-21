const Destination = require("../models/Destination");

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function listDestinations({ includeDeleted = false } = {}) {
  const filter = includeDeleted ? {} : { deleted: { $ne: true } };
  return Destination.find(filter).sort({ name: 1 }).lean();
}

async function getDestinationById(id, { includeDeleted = false } = {}) {
  const filter = includeDeleted ? { _id: id } : { _id: id, deleted: { $ne: true } };
  return Destination.findOne(filter).lean();
}

async function createDestination(payload) {
  const clean = String(payload?.name || "").trim();
  const description = String(payload?.description || "").trim();
  const imageUrl = String(payload?.imageUrl || "").trim();

  if (!clean) throw new Error("Destination name is required.");
  if (!description) throw new Error("Destination description is required.");
  if (!imageUrl) throw new Error("Destination image is required.");

  const existing = await Destination.findOne({ name: new RegExp(`^${escapeRegex(clean)}$`, "i") }).lean();
  if (existing) throw new Error("Destination already exists.");

  const created = await Destination.create({ name: clean, description, imageUrl, deleted: false });
  return created.toObject();
}

async function updateDestination(id, patch) {
  const update = {};
  if (patch.name !== undefined) {
    const clean = String(patch.name || "").trim();
    if (!clean) throw new Error("Destination name is required.");
    update.name = clean;
  }
  if (patch.description !== undefined) {
    const clean = String(patch.description || "").trim();
    if (!clean) throw new Error("Destination description is required.");
    update.description = clean;
  }
  if (patch.imageUrl !== undefined) {
    const clean = String(patch.imageUrl || "").trim();
    if (!clean) throw new Error("Destination image is required.");
    update.imageUrl = clean;
  }
  if (patch.deleted !== undefined) update.deleted = Boolean(patch.deleted);
  return Destination.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
}

async function existsDestinationName(name) {
  const clean = String(name || "").trim();
  if (!clean) return false;
  const found = await Destination.findOne({
    name: new RegExp(`^${escapeRegex(clean)}$`, "i"),
    deleted: { $ne: true },
  }).lean();
  return Boolean(found);
}

module.exports = { listDestinations, getDestinationById, createDestination, updateDestination, existsDestinationName };