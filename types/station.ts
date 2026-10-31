export type Charger = {
  id: string;
  connector: "CCS2" | "Type 2" | "CHAdeMO";
  powerKw: number;
  status: "available" | "in-use" | "offline" | "occupied";
};

export type Station = {
  id: number;
  name: string;
  network: "Tata Power" | "Statiq" | "ChargeZone" | "Jio-bp pulse" | string;
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
};
