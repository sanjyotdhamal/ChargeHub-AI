// Popular Indian Electric Vehicles (Presets)
// NOTE: These values are typical approximations for demo and reference purposes.
// They should be verified and double-checked against manufacturer spec sheets by the developer.

export interface EvPreset {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  batteryCapacityKwh: number;
  claimedRangeKm: number;
  maxChargingPowerKw: number;
  connectorType: "CCS2" | "Type 2" | "CHAdeMO";
}

export const EV_PRESETS: EvPreset[] = [
  {
    id: "tata-nexon-ev-long-range",
    brand: "Tata",
    model: "Nexon.ev",
    variant: "Long Range",
    year: 2024,
    batteryCapacityKwh: 40.5,
    claimedRangeKm: 465,
    maxChargingPowerKw: 50,
    connectorType: "CCS2",
  },
  {
    id: "tata-punch-ev-long-range",
    brand: "Tata",
    model: "Punch.ev",
    variant: "Long Range",
    year: 2024,
    batteryCapacityKwh: 35.0,
    claimedRangeKm: 421,
    maxChargingPowerKw: 50,
    connectorType: "CCS2",
  },
  {
    id: "tata-tiago-ev-long-range",
    brand: "Tata",
    model: "Tiago.ev",
    variant: "XZ+ Tech LUX",
    year: 2023,
    batteryCapacityKwh: 24.0,
    claimedRangeKm: 315,
    maxChargingPowerKw: 25,
    connectorType: "CCS2",
  },
  {
    id: "tata-tigor-ev",
    brand: "Tata",
    model: "Tigor.ev",
    variant: "XZ+",
    year: 2023,
    batteryCapacityKwh: 26.0,
    claimedRangeKm: 315,
    maxChargingPowerKw: 25,
    connectorType: "CCS2",
  },
  {
    id: "mg-comet-ev",
    brand: "MG",
    model: "Comet EV",
    variant: "Plush",
    year: 2024,
    batteryCapacityKwh: 17.3,
    claimedRangeKm: 230,
    maxChargingPowerKw: 7.4,
    connectorType: "Type 2",
  },
  {
    id: "mg-zs-ev",
    brand: "MG",
    model: "ZS EV",
    variant: "Exclusive Plus",
    year: 2024,
    batteryCapacityKwh: 50.3,
    claimedRangeKm: 461,
    maxChargingPowerKw: 50,
    connectorType: "CCS2",
  },
  {
    id: "mahindra-xuv400-el-pro",
    brand: "Mahindra",
    model: "XUV400 EV",
    variant: "EL Pro",
    year: 2024,
    batteryCapacityKwh: 39.4,
    claimedRangeKm: 456,
    maxChargingPowerKw: 50,
    connectorType: "CCS2",
  },
  {
    id: "byd-atto-3",
    brand: "BYD",
    model: "Atto 3",
    variant: "Superior",
    year: 2024,
    batteryCapacityKwh: 60.5,
    claimedRangeKm: 521,
    maxChargingPowerKw: 80,
    connectorType: "CCS2",
  },
  {
    id: "citroen-ec3",
    brand: "Citroën",
    model: "ë-C3",
    variant: "Shine",
    year: 2024,
    batteryCapacityKwh: 29.2,
    claimedRangeKm: 320,
    maxChargingPowerKw: 30,
    connectorType: "CCS2",
  },
  {
    id: "hyundai-kona-electric",
    brand: "Hyundai",
    model: "Kona Electric",
    variant: "Premium",
    year: 2023,
    batteryCapacityKwh: 39.2,
    claimedRangeKm: 452,
    maxChargingPowerKw: 50,
    connectorType: "CCS2",
  },
];
