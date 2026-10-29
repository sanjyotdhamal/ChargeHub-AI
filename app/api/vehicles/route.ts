import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { VehicleInputSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const vehicles = await Vehicle.find({ userId: authUser.id })
      .sort({ isActive: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      vehicles: vehicles.map((v) => ({
        id: v._id.toString(),
        brand: v.brand,
        model: v.model,
        variant: v.variant || "",
        year: v.year,
        registrationNumber: v.registrationNumber,
        vin: v.vin,
        motorNumber: v.motorNumber,
        batteryCapacityKwh: v.batteryCapacityKwh,
        claimedRangeKm: v.claimedRangeKm,
        maxChargingPowerKw: v.maxChargingPowerKw,
        connectorType: v.connectorType,
        isActive: v.isActive,
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/vehicles error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const currentCount = await Vehicle.countDocuments({ userId: authUser.id });
    if (currentCount >= 5) {
      return NextResponse.json(
        { error: "Maximum limit of 5 vehicles reached per account" },
        { status: 400 }
      );
    }

    const existing = await Vehicle.findOne({
      userId: authUser.id,
      registrationNumber: data.registrationNumber,
    });
    if (existing) {
      return NextResponse.json(
        {
          error: "A vehicle with this registration number already exists in your garage",
          fieldErrors: { registrationNumber: "Registration number already added" },
        },
        { status: 409 }
      );
    }

    // First vehicle is automatically set as active
    const shouldBeActive = currentCount === 0;

    const newVehicle = await Vehicle.create({
      userId: authUser.id,
      brand: data.brand,
      model: data.model,
      variant: data.variant || "",
      year: data.year,
      registrationNumber: data.registrationNumber,
      vin: data.vin,
      motorNumber: data.motorNumber,
      batteryCapacityKwh: data.batteryCapacityKwh,
      claimedRangeKm: data.claimedRangeKm,
      maxChargingPowerKw: data.maxChargingPowerKw,
      connectorType: data.connectorType,
      isActive: shouldBeActive,
    });

    return NextResponse.json(
      {
        vehicle: {
          id: newVehicle._id.toString(),
          brand: newVehicle.brand,
          model: newVehicle.model,
          variant: newVehicle.variant || "",
          year: newVehicle.year,
          registrationNumber: newVehicle.registrationNumber,
          vin: newVehicle.vin,
          motorNumber: newVehicle.motorNumber,
          batteryCapacityKwh: newVehicle.batteryCapacityKwh,
          claimedRangeKm: newVehicle.claimedRangeKm,
          maxChargingPowerKw: newVehicle.maxChargingPowerKw,
          connectorType: newVehicle.connectorType,
          isActive: newVehicle.isActive,
          createdAt: newVehicle.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/vehicles error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
