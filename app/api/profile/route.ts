import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Vehicle } from "@/models/Vehicle";
import { ProfileUpdateSchema } from "@/lib/validations";

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findById(authUser.id)
      .select("_id name email phone city chargingPreference notifications createdAt")
      .lean();

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const vehicles = await Vehicle.find({ userId: authUser.id })
      .sort({ isActive: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone || "",
        city: userDoc.city || "",
        chargingPreference: userDoc.chargingPreference || "balanced",
        notifications: userDoc.notifications || {
          chargingComplete: true,
          lowBattery: true,
          priceDrop: false,
        },
        createdAt: userDoc.createdAt,
      },
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
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const parseResult = ProfileUpdateSchema.safeParse(body);
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

    const updateFields: Record<string, unknown> = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.city !== undefined) updateFields.city = data.city;
    if (data.chargingPreference !== undefined)
      updateFields.chargingPreference = data.chargingPreference;
    if (data.notifications !== undefined) {
      updateFields.notifications = data.notifications;
    }

    const updatedUser = await User.findByIdAndUpdate(
      authUser.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .select("_id name email phone city chargingPreference notifications")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        city: updatedUser.city || "",
        chargingPreference: updatedUser.chargingPreference || "balanced",
        notifications: updatedUser.notifications || {
          chargingComplete: true,
          lowBattery: true,
          priceDrop: false,
        },
      },
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
