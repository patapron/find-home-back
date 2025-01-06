// src/server/models/advertisementModel.js
const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Por favor ingresa un email válido"],
    },
    phone: { type: String, required: true },
    offer: { type: String, enum: ["buy", "rent", "share"], required: true },
    property: {
      referenceId: { type: String, required: true },
      characteristics: {
        type: { type: String, required: true },
        area: { type: Number, required: true, min: 1 },
        bedrooms: { type: Number, required: true, min: 0 },
        bathrooms: { type: Number, required: true, min: 0 },
        floor: { type: Number, required: true },
        elevator: { type: Boolean, required: true },
        yearBuilt: { type: Number, required: true },
        parkingSpaces: { type: Number, required: true },
        furnished: { type: Boolean, required: true },
        pool: { type: Boolean, required: true },
        garden: { type: Boolean, required: true },
        features: { type: [String], required: true },
      },
      location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        coordinates: {
          accuracy: { type: Number, required: true },
          latitude: { type: Number, required: true, min: -90, max: 90 },
          longitude: { type: Number, required: true, min: -180, max: 180 },
        },
      },
      images: { type: [String], required: true },
    },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: (value) => value > 0,
        message: "El precio debe ser mayor que 0",
      },
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      required: true,
    },
    description: { type: String, required: true },
    availableFrom: { type: Date, required: true },
    status: {
      type: String,
      enum: ["available", "sold", "rented"],
      required: true,
    },
    professional: { type: Boolean, required: true },
    logo: { type: String, required: true },
    favorites: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Ad = mongoose.model("Ad", adSchema);

module.exports = Ad;
