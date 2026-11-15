import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { z } from "zod";
import { parse } from "csv-parse/sync";

// 1. Load .env.local before importing any db modules or models
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

// Zod schema to validate every raw CSV row
const DemoCsvRowSchema = z.object({
  id: z.coerce.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  network: z.string().min(1, "Network is required"),
  city: z.string().optional().default(""),
  district: z.string().optional().default(""),
  state: z.string().optional().default("Maharashtra"),
  address: z.string().optional().default(""),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  speed_kw: z.coerce.number().min(0).default(60),
  price_per_kwh: z.coerce.number().min(0).default(18),
  connector_types: z.string().default("CCS2"),
  available: z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    return String(val).trim().toLowerCase() === "true";
  }, z.boolean()),
  wait_minutes: z.coerce.number().default(0),
  rating: z.coerce.number().default(4.5),
  total_ports: z.coerce.number().int().min(1).default(1),
  current_type: z.string().optional().default("DC"),
  venue_type: z.string().optional().default(""),
  operating_hours: z.string().optional().default("24x7"),
  amenities: z.string().optional().default(""),
  source: z.string().optional().default("Synthetic demo"),
});

type DemoCsvRow = z.infer<typeof DemoCsvRowSchema>;

// Haversine formula to compute distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function runDemoCsvImport() {
  const args = process.argv.slice(2);
  const isClear = args.includes("--clear");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is not defined in environment variables or .env.local.");
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), "data", "demo", "maharashtra_ev_stations_demo.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log("=========================================================");
  console.log("⚡ ChargeHub AI — Maharashtra EV Stations Demo CSV Importer");
  console.log("=========================================================");

  // Dynamically import DB and Station model
  const { connectDB } = await import("../lib/db");
  const { Station } = await import("../models/Station");

  console.log("🔌 Connecting to MongoDB...");
  await connectDB();
  console.log("✅ Database connection established.");

  // Handle --clear flag: deletes ONLY stations whose source is "Synthetic demo"
  if (isClear) {
    console.log("🧹 Clearing existing stations where source is 'Synthetic demo'...");
    const deleteResult = await Station.deleteMany({ source: "Synthetic demo" });
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} existing synthetic demo stations.`);
  }

  // Pre-load Open Charge Map stations to check 100m proximity rule
  console.log("📡 Pre-loading real stations (source: 'Open Charge Map') for 100m duplicate check...");
  const ocmStations = await Station.find(
    { source: "Open Charge Map" },
    { network: 1, location: 1 }
  ).lean();
  console.log(`📍 Found ${ocmStations.length} Open Charge Map stations in DB.`);

  // Parse CSV file with csv-parse
  console.log(`📁 Reading CSV from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const rawRecords: any[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📦 Parsed ${rawRecords.length} rows from CSV.`);

  const bulkOps: any[] = [];
  let skippedCount = 0;
  let validationErrorCount = 0;
  const writtenPerNetwork: Record<string, number> = {};

  for (let i = 0; i < rawRecords.length; i++) {
    const rawRow = rawRecords[i];
    const parseResult = DemoCsvRowSchema.safeParse(rawRow);

    if (!parseResult.success) {
      validationErrorCount++;
      if (validationErrorCount <= 5) {
        console.warn(`⚠️ Row ${i + 1} validation failed:`, parseResult.error.flatten().fieldErrors);
      }
      continue;
    }

    const row: DemoCsvRow = parseResult.data;

    // Skip demo station if an Open Charge Map station of same network exists within 100 meters
    const isNearbyOcm = ocmStations.some((ocm: any) => {
      if (!ocm.location?.coordinates || ocm.location.coordinates.length < 2) return false;
      const networkMatches =
        ocm.network &&
        ocm.network.trim().toLowerCase() === row.network.trim().toLowerCase();
      if (!networkMatches) return false;

      const [ocmLng, ocmLat] = ocm.location.coordinates;
      const distMeters = haversineMeters(row.latitude, row.longitude, ocmLat, ocmLng);
      return distMeters <= 100;
    });

    if (isNearbyOcm) {
      skippedCount++;
      continue;
    }

    // Parse connector types (pipe separated: e.g. "CCS2|Type 2|CHAdeMO")
    const rawConnectors = row.connector_types
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

    const validConnectors: ("CCS2" | "Type 2" | "CHAdeMO")[] = rawConnectors.map((c) => {
      const lower = c.toLowerCase();
      if (lower.includes("type 2") || lower === "type2") return "Type 2";
      if (lower.includes("chademo")) return "CHAdeMO";
      return "CCS2";
    });
    if (validConnectors.length === 0) validConnectors.push("CCS2");

    // Build chargers spread across total_ports
    const totalPorts = Math.max(1, row.total_ports);
    const chargers = [];
    for (let p = 0; p < totalPorts; p++) {
      const connector = validConnectors[p % validConnectors.length];
      const powerKw = connector === "Type 2" && row.speed_kw > 22 ? 22 : row.speed_kw;
      const status = row.available
        ? (p === 0 ? "available" : (p % 2 === 0 ? "available" : "occupied"))
        : "occupied";

      chargers.push({
        id: `c-demo-${row.id}-${p + 1}`,
        connector,
        powerKw,
        status: status as "available" | "occupied",
      });
    }

    // Parse amenities (pipe separated)
    const amenities = row.amenities
      ? row.amenities
          .split("|")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    const stationId = `demo-${row.id}`;

    const updateDoc = {
      stationId,
      name: row.name,
      network: row.network,
      address: row.address || `${row.city}, ${row.state}`,
      city: row.city,
      district: row.district,
      state: row.state,
      location: {
        type: "Point" as const,
        coordinates: [row.longitude, row.latitude] as [number, number],
      },
      price: row.price_per_kwh,
      speedKw: row.speed_kw,
      waitMinutes: row.wait_minutes,
      available: row.available,
      rating: row.rating,
      chargers,
      currentType: row.current_type || (row.speed_kw > 22 ? "DC" : "AC"),
      venueType: row.venue_type || "",
      operatingHours: row.operating_hours || "24x7",
      amenities,
      totalPorts,
      source: "Synthetic demo",
      isSimulated: true,
      lastUpdated: new Date(),
    };

    bulkOps.push({
      updateOne: {
        filter: { stationId },
        update: { $set: updateDoc },
        upsert: true,
      },
    });

    writtenPerNetwork[row.network] = (writtenPerNetwork[row.network] || 0) + 1;
  }

  console.log(`\n⚙️ Prepared ${bulkOps.length} station upserts (skipped ${skippedCount} duplicate OCM stations, ${validationErrorCount} invalid rows).`);

  // Bulk upsert in batches of 500
  const BATCH_SIZE = 500;
  let totalUpserted = 0;
  let totalModified = 0;
  let totalMatched = 0;

  for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
    const chunk = bulkOps.slice(i, i + BATCH_SIZE);
    const res = await Station.bulkWrite(chunk);
    totalUpserted += res.upsertedCount ?? 0;
    totalModified += res.modifiedCount ?? 0;
    totalMatched += res.matchedCount ?? 0;
    const progress = Math.min(i + BATCH_SIZE, bulkOps.length);
    console.log(`  Writing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bulkOps.length / BATCH_SIZE)}: ${progress} / ${bulkOps.length} stations`);
  }

  await Station.syncIndexes();

  // Print final summary
  console.log("\n=========================================================");
  console.log("📊 IMPORT SUMMARY (Synthetic Demo EV Stations)");
  console.log("=========================================================");
  console.log(`Total stations in CSV:       ${rawRecords.length}`);
  console.log(`Total written to DB:         ${bulkOps.length}`);
  console.log(`  - Newly Inserted:          ${totalUpserted}`);
  console.log(`  - Updated / Matched:       ${totalModified + totalMatched}`);
  console.log(`Skipped (OCM within 100m):   ${skippedCount}`);
  if (validationErrorCount > 0) {
    console.log(`Validation Errors:           ${validationErrorCount}`);
  }
  console.log("\nBreakdown per network:");
  for (const [network, count] of Object.entries(writtenPerNetwork).sort((a, b) => b[1] - a[1])) {
    console.log(`  • ${network.padEnd(24, " ")}: ${count} stations`);
  }
  console.log("=========================================================\n");

  process.exit(0);
}

runDemoCsvImport().catch((err) => {
  console.error("❌ Demo import failed:", err);
  process.exit(1);
});

