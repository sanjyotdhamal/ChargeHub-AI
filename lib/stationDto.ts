import { Station as StationDTO, Charger } from "@/types/station";

// Helper to convert DB Station document (or lean object) to StationDTO
export function toStationDto(doc: any): StationDTO {
  const lng = doc.location?.coordinates?.[0] ?? 0;
  const lat = doc.location?.coordinates?.[1] ?? 0;

  const chargers: Charger[] = Array.isArray(doc.chargers)
    ? doc.chargers.map((c: any, index: number) => ({
        id: c.id || `c-${doc.stationId}-${index + 1}`,
        connector: c.connector,
        powerKw: c.powerKw,
        status: c.status || "available",
      }))
    : [];

  return {
    id: doc.stationId !== undefined ? doc.stationId : (typeof doc.id === "number" ? doc.id : 0),
    name: doc.name || "",
    network: doc.network || "",
    city: doc.city || "",
    district: doc.district || "",
    state: doc.state || "",
    lat,
    lng,
    price: doc.price ?? 0,
    distanceKm: doc.distanceKm ?? 0,
    speedKw: doc.speedKw ?? 0,
    waitMinutes: doc.waitMinutes ?? 0,
    available: doc.available ?? true,
    aiScore: 85, // Initial placeholder before client scoring
    address: doc.address || "",
    rating: doc.rating ?? 4.5,
    chargers,
  };
}
