import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Station } from "@/models/Station";
import { toStationDto } from "@/lib/stationDto";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const stationIdNum = parseInt(id, 10);
    if (isNaN(stationIdNum) || stationIdNum <= 0) {
      return NextResponse.json({ error: "Invalid station ID" }, { status: 400 });
    }

    await connectDB();
    const stationDoc = await Station.findOne({ stationId: stationIdNum }).lean();

    if (!stationDoc) {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    return NextResponse.json(
      { station: toStationDto(stationDoc) },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/stations/[id] error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
