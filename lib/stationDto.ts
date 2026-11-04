import { Station as StationDTO, Charger } from "@/types/station";

interface StationDocCharger {
  id?: string;
  connector: string;
  powerKw: number;
  status?: string;
}

interface StationDoc {
  stationId?: string | number;
  id?: string | number;
  name?: string;
  network?: string;
  city?: string;
  district?: string;
  state?: string;
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
  price?: number;
  distanceKm?: number;
  speedKw?: number;
  waitMinutes?: number;
  available?: boolean;
  address?: string;
  rating?: number;
  chargers?: StationDocCharger[];
  source?: string;
  isSimulated?: boolean;
}

// Helper to convert DB Station document (or lean object) to StationDTO
export function toStationDto(doc: StationDoc): StationDTO {
  const lng = doc.location?.coordinates?.[0] ?? 0;
  const lat = doc.location?.coordinates?.[1] ?? 0;

  const chargers: Charger[] = Array.isArray(doc.chargers)
    ? doc.chargers.map((c: StationDocCharger, index: number) => {
        let connector: "CCS2" | "Type 2" | "CHAdeMO" = "CCS2";
        if (c.connector === "Type 2") connector = "Type 2";
        else if (c.connector === "CHAdeMO") connector = "CHAdeMO";

        let status: "available" | "in-use" | "offline" | "occupied" = "available";
        if (c.status === "in-use") status = "in-use";
        else if (c.status === "offline") status = "offline";
        else if (c.status === "occupied") status = "occupied";

        return {
          id: c.id || `c-${doc.stationId}-${index + 1}`,
          connector,
          powerKw: c.powerKw,
          status,
        };
      })
    : [];

  return {
    id: doc.stationId !== undefined ? doc.stationId : (doc.id !== undefined ? doc.id : 0),
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
    source: doc.source || "Sample",
    isSimulated: Boolean(doc.isSimulated),
  };
}
