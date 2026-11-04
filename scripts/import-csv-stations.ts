import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function importStationsFromCSV() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env.local.");
    process.exit(1);
  }

  // Check for data/stations.csv or data/stations_template.csv
  let csvPath = path.resolve(process.cwd(), "data", "stations.csv");
  if (!fs.existsSync(csvPath)) {
    csvPath = path.resolve(process.cwd(), "data", "stations_template.csv");
    console.log(`ℹ️ data/stations.csv not found, using data/stations_template.csv`);
  } else {
    console.log(`📁 Found custom station CSV at: data/stations.csv`);
  }

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (rawLines.length <= 1) {
    console.error("❌ CSV file is empty or only has headers.");
    process.exit(1);
  }

  const headers = parseCSVLine(rawLines[0]).map((h) => h.toLowerCase());
  console.log(`Headers found: ${headers.join(", ")}`);

  const { connectDB } = await import("../lib/db");
  const { Station } = await import("../models/Station");

  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected to MongoDB successfully.");

  const bulkOps = [];

  for (let idx = 1; idx < rawLines.length; idx++) {
    const line = rawLines[idx];
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });

    const stationId = row.id || `csv-${idx}`;
    const name = row.name || `EV Charging Station ${idx}`;
    const network = row.network || "Tata Power";
    const city = row.city || "Pune";
    const district = row.district || "Pune";
    const state = row.state || "Maharashtra";
    const address = row.address || `${city}, Maharashtra`;
    const lat = parseFloat(row.latitude || row.lat || "18.5204");
    const lng = parseFloat(row.longitude || row.lng || "73.8567");
    const speedKw = parseFloat(row.speed_kw || row.speed || "60");
    const price = parseFloat(row.price_per_kwh || row.price || "18");
    const available = (row.available || "true").toLowerCase() !== "false";
    const waitMinutes = parseInt(row.wait_minutes || row.wait || "0", 10);
    const rating = parseFloat(row.rating || "4.5");

    // Parse connector types (pipe or comma separated: e.g. "CCS2|Type 2")
    const connectorRaw = row.connector_types || row.connectors || "CCS2";
    const connectorList = connectorRaw.split(/[|,]/).map((c) => c.trim()).filter(Boolean);
    const validConnectors = connectorList.map((c) => {
      const lower = c.toLowerCase();
      if (lower.includes("type 2") || lower === "type2") return "Type 2";
      if (lower.includes("chademo")) return "CHAdeMO";
      return "CCS2";
    });

    const chargers = validConnectors.map((conn, cIdx) => ({
      id: `c-${stationId}-${cIdx + 1}`,
      connector: conn as "CCS2" | "Type 2" | "CHAdeMO",
      powerKw: speedKw,
      status: (available ? "available" : "occupied") as "available" | "occupied",
    }));

    const updateDoc = {
      stationId,
      name,
      network,
      city,
      district,
      state,
      address,
      location: {
        type: "Point" as const,
        coordinates: [lng, lat] as [number, number],
      },
      price,
      distanceKm: 0,
      speedKw,
      waitMinutes,
      available,
      rating,
      chargers,
      source: "CSV Import",
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
  }

  console.log(`Upserting ${bulkOps.length} stations into MongoDB...`);
  const res = await Station.bulkWrite(bulkOps);

  await Station.syncIndexes();

  console.log("-----------------------------------------");
  console.log(`✅ CSV Station Import Complete!`);
  console.log(`Upserted (new): ${res.upsertedCount ?? 0}`);
  console.log(`Updated:        ${res.modifiedCount ?? 0}`);
  console.log(`Matched:        ${res.matchedCount ?? 0}`);
  console.log("-----------------------------------------");
  process.exit(0);
}

importStationsFromCSV().catch((err) => {
  console.error("❌ CSV import failed:", err);
  process.exit(1);
});
