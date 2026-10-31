import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Station } from "@/models/Station";
import { StationQuerySchema } from "@/lib/validations";
import { toStationDto } from "@/lib/stationDto";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    const parseResult = StationQuerySchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const queryData = parseResult.data;
    await connectDB();

    const mongoFilter: any = {};

    // Filter by network (comma-separated list support)
    if (queryData.network) {
      const networks = queryData.network
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      if (networks.length > 0) {
        mongoFilter.network = { $in: networks.map((n) => new RegExp(`^${n}$`, "i")) };
      }
    }

    // Filter by availableOnly
    if (queryData.availableOnly) {
      mongoFilter.available = true;
    }

    // Filter by connector
    if (queryData.connector) {
      mongoFilter["chargers.connector"] = queryData.connector;
    }

    // Filter by minPowerKw
    if (queryData.minPowerKw !== undefined) {
      mongoFilter.speedKw = { $gte: queryData.minPowerKw };
    }

    // Geospatial query using $nearSphere
    if (queryData.lat !== undefined && queryData.lng !== undefined && queryData.radiusKm !== undefined) {
      const maxDistanceMeters = queryData.radiusKm * 1000;
      mongoFilter.location = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [queryData.lng, queryData.lat], // [lng, lat]
          },
          $maxDistance: maxDistanceMeters,
        },
      };
    }

    const stationsDoc = await Station.find(mongoFilter)
      .limit(queryData.limit)
      .lean();

    const stations = stationsDoc.map(toStationDto);

    return NextResponse.json(
      {
        stations,
        count: stations.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/stations error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
