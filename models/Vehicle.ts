import mongoose, { Schema, Model } from "mongoose";

export interface IVehicle {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber: string;
  vin: string;
  motorNumber: string;
  batteryCapacityKwh: number;
  claimedRangeKm: number;
  maxChargingPowerKw: number;
  connectorType: "CCS2" | "Type 2" | "CHAdeMO";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
      default: "",
    },
    year: {
      type: Number,
      required: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
      uppercase: true,
    },
    vin: {
      type: String,
      required: [true, "VIN is required"],
      trim: true,
      uppercase: true,
    },
    motorNumber: {
      type: String,
      required: [true, "Motor number is required"],
      trim: true,
    },
    batteryCapacityKwh: {
      type: Number,
      required: true,
      min: 5,
      max: 150,
    },
    claimedRangeKm: {
      type: Number,
      required: true,
      min: 50,
      max: 1000,
    },
    maxChargingPowerKw: {
      type: Number,
      required: true,
      min: 3,
      max: 350,
    },
    connectorType: {
      type: String,
      enum: ["CCS2", "Type 2", "CHAdeMO"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: a user cannot add the same registration number twice
VehicleSchema.index({ userId: 1, registrationNumber: 1 }, { unique: true });

export const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
