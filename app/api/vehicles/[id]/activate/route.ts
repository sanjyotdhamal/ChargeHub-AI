import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    await connectDB();
    const vehicle = await Vehicle.findOne({ _id: id, userId: authUser.id });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Deactivate all vehicles for this user first
    await Vehicle.updateMany({ userId: authUser.id }, { $set: { isActive: false } });

    // Set this vehicle active
    vehicle.isActive = true;
    await vehicle.save();

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle._id.toString(),
        brand: vehicle.brand,
        model: vehicle.model,
        variant: vehicle.variant || "",
        year: vehicle.year,
        registrationNumber: vehicle.registrationNumber,
        vin: vehicle.vin,
        motorNumber: vehicle.motorNumber,
        batteryCapacityKwh: vehicle.batteryCapacityKwh,
        claimedRangeKm: vehicle.claimedRangeKm,
        maxChargingPowerKw: vehicle.maxChargingPowerKw,
        connectorType: vehicle.connectorType,
        isActive: true,
        createdAt: vehicle.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/vehicles/[id]/activate error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
