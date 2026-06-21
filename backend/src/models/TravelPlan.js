const mongoose = require("mongoose");

const travelPlanSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    destinations: [{ type: String, trim: true }],
    travelDate: { type: String, trim: true },
    adults: { type: Number },
    children: { type: Number },
    message: { type: String, trim: true },
    status: { type: String, trim: true, default: "new" },
  },
  { timestamps: true, collection: "travelplans" }
);

module.exports = mongoose.model("TravelPlan", travelPlanSchema);
