import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  city?: string;
  chargingPreference: "balanced" | "fastest" | "cheapest" | "nearest";
  notifications: {
    chargingComplete: boolean;
    lowBattery: boolean;
    priceDrop: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name must be at most 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    chargingPreference: {
      type: String,
      enum: ["balanced", "fastest", "cheapest", "nearest"],
      default: "balanced",
    },
    notifications: {
      chargingComplete: { type: Boolean, default: true },
      lowBattery: { type: Boolean, default: true },
      priceDrop: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
