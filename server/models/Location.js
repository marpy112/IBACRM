const mongoose = require('mongoose');

const researchSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    researchers: {
      type: [
        new mongoose.Schema(
          {
            name: {
              type: String,
              required: true,
            },
            degree: {
              type: String,
              default: '',
            },
          },
          { _id: false }
        ),
      ],
      required: true,
      default: [],
    },
    locationIds: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radiusKm: {
      type: Number,
      required: true,
    },
    researches: {
      type: [researchSchema],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    researchers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);
