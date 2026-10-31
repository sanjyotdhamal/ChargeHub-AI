import path from "path";
import dotenv from "dotenv";

// Load .env.local before importing any db modules
const envPath = path.resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

async function seedStations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env.local. Please check your environment variables.");
    process.exit(1);
  }

  // Dynamic imports after dotenv has run
  const { connectDB } = await import("../lib/db");
  const { Station } = await import("../models/Station");
  const { stations } = await import("../data/stations");

  console.log(`Connecting to MongoDB...`);
  await connectDB();
  console.log("Connected successfully.");

  console.log(`Preparing bulk operations for ${stations.length} stations...`);

  const bulkOps = stations.map((st) => {
    // Map chargers to valid format
    const chargers = (st.chargers || []).map((c, i) => ({
      id: c.id || `c-${st.id}-${i + 1}`,
      connector: c.connector,
      powerKw: c.powerKw,
      status: (c.status === "in-use" ? "occupied" : c.status) as "available" | "occupied" | "in-use" | "offline",
    }));

    const updateDoc = {
      stationId: st.id,
      name: st.name,
      network: st.network,
      city: st.city || "",
      district: st.district || "",
      state: st.state || "",
      address: st.address || "",
      location: {
        type: "Point",
        coordinates: [st.lng, st.lat], // [longitude, latitude]
      },
      price: st.price,
      distanceKm: st.distanceKm || 0,
      speedKw: st.speedKw,
      waitMinutes: st.waitMinutes || 0,
      available: st.available,
      rating: st.rating || 4.5,
      chargers,
      lastUpdated: new Date(),
    };

    return {
      updateOne: {
        filter: { stationId: st.id },
        update: { $set: updateDoc },
        upsert: true,
      },
    };
  });

  const res = await Station.bulkWrite(bulkOps);

  console.log("Ensuring database indexes...");
  await Station.syncIndexes();

  const upsertedCount = res.upsertedCount ?? 0;
  const modifiedCount = res.modifiedCount ?? 0;
  const matchedCount = res.matchedCount ?? 0;

  console.log("-----------------------------------------");
  console.log(`✅ Seed complete! Total processed: ${stations.length}`);
  console.log(`   - Newly inserted: ${upsertedCount}`);
  console.log(`   - Updated/Matched: ${modifiedCount} modified, ${matchedCount} matched`);
  console.log("-----------------------------------------");

  process.exit(0);
}

seedStations().catch((err) => {
  console.error("❌ Seeding failed with error:", err.message);
  process.exit(1);
});
