import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { VehicleInputSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
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

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const parseResult = VehicleInputSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return NextResponse.json(
        { error: "Validation failed", fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    await connectDB();

    const vehicle = await Vehicle.findOne({ _id: id, userId: authUser.id });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (data.registrationNumber !== vehicle.registrationNumber) {
      const conflict = await Vehicle.findOne({
        userId: authUser.id,
        registrationNumber: data.registrationNumber,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          {
            error: "A vehicle with this registration number already exists in your garage",
            fieldErrors: { registrationNumber: "Registration number already in use" },
          },
          { status: 409 }
        );
      }
    }

    vehicle.brand = data.brand;
    vehicle.model = data.model;
    vehicle.variant = data.variant || "";
    vehicle.year = data.year;
    vehicle.registrationNumber = data.registrationNumber;
    vehicle.vin = data.vin;
    vehicle.motorNumber = data.motorNumber;
    vehicle.batteryCapacityKwh = data.batteryCapacityKwh;
    vehicle.claimedRangeKm = data.claimedRangeKm;
    vehicle.maxChargingPowerKw = data.maxChargingPowerKw;
    vehicle.connectorType = data.connectorType;

    await vehicle.save();

    return NextResponse.json({
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
        isActive: vehicle.isActive,
        createdAt: vehicle.createdAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/vehicles/[id] error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const wasActive = vehicle.isActive;
    await Vehicle.deleteOne({ _id: id, userId: authUser.id });

    let newActiveId: string | null = null;
    if (wasActive) {
      // Find most recently created remaining vehicle to make active
      const nextActive = await Vehicle.findOne({ userId: authUser.id }).sort({
        createdAt: -1,
      });
      if (nextActive) {
        nextActive.isActive = true;
        await nextActive.save();
        newActiveId = nextActive._id.toString();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
      newActiveId,
    });
  } catch (error) {
    console.error("DELETE /api/vehicles/[id] error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
