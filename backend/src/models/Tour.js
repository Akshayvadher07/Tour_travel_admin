const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1 },
    priceFrom: { type: Number, required: true, min: 0 },
    images: {
      type: [String],
      default: [],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "A tour must have at least one image.",
      },
    },
    category: {
      type: String,
      enum: ["adventure", "cultural", "relaxation", "wildlife", "city"],
      default: "cultural",
    },
    featured: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

tourSchema.virtual("imageUrl").get(function () {
  return this.images?.[0] ?? "";
});

module.exports = mongoose.model("Tour", tourSchema);