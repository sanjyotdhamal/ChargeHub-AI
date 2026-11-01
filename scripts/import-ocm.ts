import path from "path";
import dotenv from "dotenv";

// Load .env.local before importing any db modules or models
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

/**
 * 3. Normal run: Brands to keep.
 * Editable array at the top of the file as required.
 */
export const TARGET_BRANDS: string[] = [
  "Tata Power",
  "Statiq",
  "ChargeZone",
  "Jio-bp pulse",
  "Zeon Charging",
];

// Price simulation range (realistic INR/kWh per brand)
const BRAND_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  "Tata Power": { min: 16, max: 19 },
  "Statiq": { min: 13, max: 16 },
  "ChargeZone": { min: 15, max: 18 },
  "Jio-bp pulse": { min: 14, max: 17 },
  "Zeon Charging": { min: 16, max: 20 },
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Haversine distance in meters between two lat/lng coordinates
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

/**
 * Normalize Open Charge Map operator/title to canonical brand names
 */
function normalizeBrand(poi: any): string | null {
  const operatorTitle = poi.OperatorInfo?.Title || "";
  const addressTitle = poi.AddressInfo?.Title || "";
  const connectionsRef = (poi.Connections || []).map((c: any) => c.Reference || "").join(" ");
  const combined = `${operatorTitle} ${addressTitle} ${connectionsRef}`.toLowerCase();

  if (combined.includes("tata power") || combined.includes("tata")) {
    return "Tata Power";
  }
  if (combined.includes("statiq")) {
    return "Statiq";
  }
  if (combined.includes("chargezone") || combined.includes("charge zone")) {
    return "ChargeZone";
  }
  if (
    combined.includes("jio-bp") ||
    combined.includes("jio bp") ||
    combined.includes("jiobp") ||
    combined.includes("bp pulse")
  ) {
    return "Jio-bp pulse";
  }
  if (combined.includes("zeon")) {
    return "Zeon Charging";
  }

  return null;
}

/**
 * Map OCM connection type to "CCS2" | "Type 2" | "CHAdeMO"
 */
function mapConnectorType(conn: any): "CCS2" | "Type 2" | "CHAdeMO" {
  const connId = conn.ConnectionTypeID;
  const title = (conn.ConnectionType?.Title || "").toLowerCase();
  const formalName = (conn.ConnectionType?.FormalName || "").toLowerCase();
  const allText = `${title} ${formalName}`;

  if (connId === 33 || allText.includes("ccs") || allText.includes("combo 2")) {
    return "CCS2";
  }
  if (connId === 2 || allText.includes("chademo")) {
    return "CHAdeMO";
  }
  // Default common standard in India: Type 2 AC
  return "Type 2";
}

async function runImporter() {
  const args = process.argv.slice(2);
  const isProbe = args.includes("--probe");
  const isClearSamples = args.includes("--clear-samples");

  const apiKey = process.env.OCM_API_KEY;
  if (!apiKey) {
    console.error("❌ OCM_API_KEY is not defined in environment variables or .env.local.");
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && !isProbe) {
    console.error("❌ MONGODB_URI is not defined in environment variables or .env.local.");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("⚡ ChargeHub AI — Open Charge Map EV Station Importer");
  console.log("=================================================");

  // 1. Fetch stations from Open Charge Map
  const url = "https://api.openchargemap.io/v3/poi/?countrycode=IN&maxresults=10000&compact=false&verbose=false";
  console.log("📡 Fetching India POIs from Open Charge Map API...");

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      "User-Agent": "ChargeHub-AI/1.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    console.error(`❌ OCM API request failed with status: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const rawPois: any[] = await response.json();
  console.log(`📦 Retrieved ${rawPois.length} total stations across India.`);

  // Filter: Maharashtra and Operational
  const mhOperationalPois = rawPois.filter((poi) => {
    const addr = poi.AddressInfo || {};
    const state = (addr.StateOrProvince || "").toLowerCase().trim();
    const townAndAddress = `${addr.AddressLine1 || ""} ${addr.Town || ""}`.toLowerCase();

    const isMaharashtra =
      state.includes("maharashtra") ||
      state.includes("maharashta") ||
      state.includes("mahrashtra") ||
      state === "mh" ||
      townAndAddress.includes("pune") ||
      townAndAddress.includes("mumbai") ||
      townAndAddress.includes("nagpur") ||
      townAndAddress.includes("nashik") ||
      townAndAddress.includes("thane") ||
      townAndAddress.includes("navi mumbai") ||
      townAndAddress.includes("solapur") ||
      townAndAddress.includes("kolhapur") ||
      townAndAddress.includes("aurangabad") ||
      townAndAddress.includes("sambhajinagar");

    // Operational check: StatusType.IsOperational or StatusTypeID === 50 (or undefined treated as active)
    const isOperational =
      !poi.StatusType ||
      poi.StatusType.IsOperational === true ||
      poi.StatusTypeID === 50;

    return isMaharashtra && isOperational;
  });

  console.log(`📍 Found ${mhOperationalPois.length} operational stations in Maharashtra.`);

  // 2. PROBE MODE: Print counts per operator/brand (top 15) and exit without writing
  if (isProbe) {
    console.log("\n🔍 [PROBE MODE] Analyzing operators and brands across Maharashtra:");
    const brandCounts: Record<string, number> = {};

    for (const poi of mhOperationalPois) {
      const normalized = normalizeBrand(poi);
      const rawOperator = poi.OperatorInfo?.Title?.replace(/^\((.*)\)$/, "$1") || "Unknown Operator";
      const key = normalized || rawOperator;
      brandCounts[key] = (brandCounts[key] || 0) + 1;
    }

    const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
    const top15 = sorted.slice(0, 15);

    console.log("-------------------------------------------------");
    console.log("Top Operators / Brands in Maharashtra (Top 15):");
    top15.forEach(([brand, count], idx) => {
      const isTarget = TARGET_BRANDS.includes(brand) ? " [Target Brand ⭐]" : "";
      console.log(`  ${(idx + 1).toString().padStart(2, " ")}. ${brand.padEnd(28, " ")}: ${count} stations${isTarget}`);
    });
    console.log("-------------------------------------------------");
    console.log("💡 Target brands configured for normal run:", TARGET_BRANDS.join(", "));
    console.log("ℹ️  Probe mode finished. No changes written to database.");
    process.exit(0);
  }

  // 3. NORMAL RUN: Filter only target brands
  const targetPois: { poi: any; brand: string }[] = [];
  for (const poi of mhOperationalPois) {
    const brand = normalizeBrand(poi);
    if (brand && TARGET_BRANDS.includes(brand)) {
      targetPois.push({ poi, brand });
    }
  }

  console.log(`🎯 Matched ${targetPois.length} stations belonging to target brands (${TARGET_BRANDS.join(", ")}).`);

  // Connect to DB dynamically
  const { connectDB } = await import("../lib/db");
  const { Station } = await import("../models/Station");

  console.log("🔌 Connecting to MongoDB...");
  await connectDB();
  console.log("✅ Database connection established.");

  // 7. Clear samples flag
  if (isClearSamples) {
    console.log("🧹 Clearing sample stations (source: 'Sample')...");
    const deleteResult = await Station.deleteMany({
      $or: [{ source: "Sample" }, { source: { $exists: false } }],
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} sample station(s).`);
  }

  // 4, 5, 6. Map to schema, simulate live values, merge duplicates (< 50m same brand)
  console.log("🔄 Processing station records and merging nearby duplicates (< 50m)...");

  type MappedStation = {
    stationId: string;
    name: string;
    network: string;
    city: string;
    district: string;
    state: string;
    address: string;
    location: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
    price: number;
    distanceKm: number;
    speedKw: number;
    waitMinutes: number;
    available: boolean;
    rating: number;
    chargers: any[];
    source: string;
    isSimulated: boolean;
    lastUpdated: Date;
  };

  const processedStations: MappedStation[] = [];
  let duplicatesMergedCount = 0;

  for (const { poi, brand } of targetPois) {
    const addr = poi.AddressInfo || {};
    const lat = Number(addr.Latitude);
    const lng = Number(addr.Longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      continue;
    }

    // Check duplicate: same brand within 50 meters
    const duplicate = processedStations.find((existing) => {
      if (existing.network !== brand) return false;
      const [eLng, eLat] = existing.location.coordinates;
      const dist = haversineMeters(lat, lng, eLat, eLng);
      return dist <= 50;
    });

    // Map chargers
    const connections: any[] = Array.isArray(poi.Connections) ? poi.Connections : [];
    let speedKw = 0;
    const chargers = connections.map((c, idx) => {
      const connector = mapConnectorType(c);
      const power = c.PowerKW ? Number(c.PowerKW) : connector === "CCS2" ? 60 : 22;
      if (power > speedKw) speedKw = power;
      return {
        id: `c-${poi.ID}-${idx + 1}`,
        connector,
        powerKw: power,
        status: "available",
      };
    });

    if (chargers.length === 0) {
      speedKw = 60;
      chargers.push({
        id: `c-${poi.ID}-1`,
        connector: "CCS2",
        powerKw: 60,
        status: "available",
      });
    }

    if (duplicate) {
      // Merge chargers into existing duplicate
      for (const charger of chargers) {
        if (!duplicate.chargers.some((c) => c.connector === charger.connector && c.powerKw === charger.powerKw)) {
          duplicate.chargers.push(charger);
        }
      }
      duplicate.speedKw = Math.max(duplicate.speedKw, speedKw);
      duplicatesMergedCount++;
      continue;
    }

    // 5. Simulated values
    const priceRange = BRAND_PRICE_RANGES[brand] || { min: 14, max: 18 };
    const simulatedPrice = getRandomInt(priceRange.min, priceRange.max);
    // 80% available, 20% busy; waitMinutes 0-15
    const isAvailable = Math.random() < 0.8;
    const simulatedWait = isAvailable ? 0 : getRandomInt(3, 15);

    const stationRecord: MappedStation = {
      stationId: `ocm-${poi.ID}`,
      name: addr.Title?.trim() || `${brand} EV Station`,
      network: brand,
      city: addr.Town?.trim() || "",
      district: addr.Town?.trim() || "",
      state: "Maharashtra",
      address: [addr.AddressLine1, addr.Town, addr.Postcode].filter(Boolean).join(", "),
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      price: simulatedPrice,
      distanceKm: 0,
      speedKw: speedKw || 60,
      waitMinutes: simulatedWait,
      available: isAvailable,
      rating: Number((4.2 + Math.random() * 0.7).toFixed(1)),
      chargers,
      source: "Open Charge Map",
      isSimulated: true,
      lastUpdated: new Date(),
    };

    processedStations.push(stationRecord);
  }

  console.log(`✨ Prepared ${processedStations.length} unique stations (${duplicatesMergedCount} duplicates merged).`);

  // Bulk upsert into MongoDB
  const bulkOps = processedStations.map((station) => ({
    updateOne: {
      filter: { stationId: station.stationId },
      update: { $set: station },
      upsert: true,
    },
  }));

  let upsertedCount = 0;
  let modifiedCount = 0;

  if (bulkOps.length > 0) {
    const res = await Station.bulkWrite(bulkOps);
    upsertedCount = res.upsertedCount ?? 0;
    modifiedCount = res.modifiedCount ?? 0;
    await Station.syncIndexes();
  }

  // 8. Print summary
  const summaryPerBrand: Record<string, number> = {};
  for (const s of processedStations) {
    summaryPerBrand[s.network] = (summaryPerBrand[s.network] || 0) + 1;
  }

  console.log("\n=================================================");
  console.log("📊 IMPORT SUMMARY");
  console.log("=================================================");
  console.log(`Total OCM stations written to DB: ${processedStations.length}`);
  console.log(`  - Newly inserted: ${upsertedCount}`);
  console.log(`  - Updated / Matched: ${modifiedCount}`);
  console.log(`  - Duplicates merged: ${duplicatesMergedCount}`);
  console.log("\nBreakdown per brand:");
  for (const brand of TARGET_BRANDS) {
    console.log(`  • ${brand.padEnd(22, " ")}: ${summaryPerBrand[brand] || 0} stations`);
  }
  console.log("=================================================\n");

  process.exit(0);
}

runImporter().catch((err) => {
  console.error("❌ Importer failed with error:", err.message);
  process.exit(1);
});
