import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICharger {
  id?: string;
  connector: "CCS2" | "Type 2" | "CHAdeMO";
  powerKw: number;
  status: "available" | "occupied" | "in-use" | "offline";
}

export interface IStation extends Document {
  stationId: number;
  name: string;
  network: string;
  city?: string;
  district?: string;
  state?: string;
  address?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  price: number;
  distanceKm?: number;
  speedKw: number;
  waitMinutes: number;
  available: boolean;
  rating?: number;
  chargers: ICharger[];
  lastUpdated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChargerSchema = new Schema<ICharger>(
  {
    id: { type: String },
    connector: {
      type: String,
      enum: ["CCS2", "Type 2", "CHAdeMO"],
      required: true,
    },
    powerKw: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "in-use", "offline"],
      default: "available",
    },
  },
  { _id: false }
);

const StationSchema = new Schema<IStation>(
  {
    stationId: {
      type: Number,
      required: [true, "stationId is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    network: {
      type: String,
      required: [true, "Network is required"],
      trim: true,
      index: true,
    },
    city: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: function (val: number[]) {
            return (
              Array.isArray(val) &&
              val.length === 2 &&
              val[0] >= -180 &&
              val[0] <= 180 && // longitude
              val[1] >= -90 &&
              val[1] <= 90 // latitude
            );
          },
          message: "Coordinates must be [longitude (-180..180), latitude (-90..90)]",
        },
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    distanceKm: {
      type: Number,
      default: 0,
    },
    speedKw: {
      type: Number,
      required: true,
      min: 0,
    },
    waitMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    chargers: {
      type: [ChargerSchema],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for location
StationSchema.index({ location: "2dsphere" });

export const Station: Model<IStation> =
  mongoose.models.Station || mongoose.model<IStation>("Station", StationSchema);
