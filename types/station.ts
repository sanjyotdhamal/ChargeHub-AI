export type Charger = {
  id: string;
  connector: "CCS2" | "Type 2" | "CHAdeMO";
  powerKw: number;
  status: "available" | "in-use" | "offline" | "occupied";
};

export type Station = {
  id: number | string;
  name: string;
  network: "Tata Power" | "Statiq" | "ChargeZone" | "Jio-bp pulse" | "Adani TotalEnergies" | "Zeon Charging" | string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  price: number; // ₹ per kWh
  distanceKm: number;
  speedKw: number;
  waitMinutes: number;
  available: boolean;
  aiScore: number; // 0-100 fallback/initial
  address: string;
  rating: number;
  chargers: Charger[];
  currentType?: string;
  venueType?: string;
  operatingHours?: string;
  amenities?: string[];
  totalPorts?: number;
  source?: string;
  isSimulated?: boolean;
};
