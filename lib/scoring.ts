import { Station } from "@/data/stations";

export type ScoredStation = Station & {
  aiScore: number;
  aiPickReason: string;
  topFactors: string[];
  isIncompatible?: boolean;
};

export type ScoringVehicle = {
  maxChargingPowerKw?: number;
  connectorType?: "CCS2" | "Type 2" | "CHAdeMO" | string;
};

export type ChargingPreference = "balanced" | "fastest" | "cheapest" | "nearest";

export function scoreStation(
  station: Station,
  batteryPercent: number,
  allStations: Station[],
  vehicle?: ScoringVehicle | null,
  preference?: ChargingPreference | null
): ScoredStation {
  if (allStations.length === 0) {
    return {
      ...station,
      aiScore: station.aiScore,
      aiPickReason: "Recommended for your EV",
      topFactors: ["Available now"],
      isIncompatible: false,
    };
  }

  // 1. Check connector compatibility
  const userConnector = vehicle?.connectorType;
  const isCompatible =
    !userConnector ||
    station.chargers.some(
      (c) => c.connector.toLowerCase() === userConnector.toLowerCase()
    );

  // 2. Effective charging speed (capped by vehicle's max charging speed)
  const maxKw = vehicle?.maxChargingPowerKw;
  const getEffectiveSpeed = (st: Station) =>
    maxKw ? Math.min(st.speedKw, maxKw) : st.speedKw;

  const stationEffectiveSpeed = getEffectiveSpeed(station);

  // Min and max across stations for normalization
  const distances = allStations.map((s) => s.distanceKm);
  const prices = allStations.map((s) => s.price);
  const effectiveSpeeds = allStations.map(getEffectiveSpeed);
  const waits = allStations.map((s) => s.waitMinutes);

  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minSpeed = Math.min(...effectiveSpeeds);
  const maxSpeed = Math.max(...effectiveSpeeds);
  const minWait = Math.min(...waits);
  const maxWait = Math.max(...waits);

  // Normalized factors (0 to 1)
  const distNorm =
    maxDist === minDist ? 1 : 1 - (station.distanceKm - minDist) / (maxDist - minDist);
  const priceNorm =
    maxPrice === minPrice ? 1 : 1 - (station.price - minPrice) / (maxPrice - minPrice);
  const speedNorm =
    maxSpeed === minSpeed ? 1 : (stationEffectiveSpeed - minSpeed) / (maxSpeed - minSpeed);
  const waitNorm =
    maxWait === minWait ? 1 : 1 - (station.waitMinutes - minWait) / (maxWait - minWait);
  const availNorm = station.available ? 1 : 0.1;

  // Dynamic base weights based on battery level
  let wDist = 0.25;
  let wSpeed = 0.25;
  let wWait = 0.2;
  let wPrice = 0.2;
  let wAvail = 0.1;

  if (batteryPercent < 25) {
    // Low battery urgent mode: prioritize proximity and speed
    wDist = 0.35;
    wSpeed = 0.3;
    wWait = 0.15;
    wPrice = 0.05;
    wAvail = 0.15;
  } else if (batteryPercent > 70) {
    // High battery economy mode: prioritize price and availability
    wDist = 0.15;
    wSpeed = 0.15;
    wWait = 0.15;
    wPrice = 0.45;
    wAvail = 0.1;
  }

  // 3. Charging preference nudge
  // Shift 0.10 of weight proportionally toward preferred criterion (halved if battery < 25%)
  if (preference && preference !== "balanced") {
    const rawNudge = 0.1;
    const nudge = batteryPercent < 25 ? rawNudge * 0.5 : rawNudge;

    const applyNudge = (target: "speed" | "price" | "dist") => {
      let currentTarget = 0;
      if (target === "speed") currentTarget = wSpeed;
      if (target === "price") currentTarget = wPrice;
      if (target === "dist") currentTarget = wDist;

      const otherSum = 1 - currentTarget;
      if (otherSum > 0) {
        const factor = (otherSum - nudge) / otherSum;
        if (target !== "speed") wSpeed *= factor;
        if (target !== "price") wPrice *= factor;
        if (target !== "dist") wDist *= factor;
        wWait *= factor;
        wAvail *= factor;

        if (target === "speed") wSpeed += nudge;
        if (target === "price") wPrice += nudge;
        if (target === "dist") wDist += nudge;
      }
    };

    if (preference === "fastest") applyNudge("speed");
    else if (preference === "cheapest") applyNudge("price");
    else if (preference === "nearest") applyNudge("dist");
  }

  // Calculate raw score
  let rawScore =
    (distNorm * wDist +
      speedNorm * wSpeed +
      waitNorm * wWait +
      priceNorm * wPrice +
      availNorm * wAvail) *
    100;

  // Incompatible connector gets penalized to rank last
  if (!isCompatible) {
    rawScore = 12; // Rank last
  }

  const aiScore = isCompatible
    ? Math.min(99, Math.max(20, Math.round(rawScore)))
    : 12;

  // Factors for display
  const factors: { text: string; score: number }[] = [];

  if (station.distanceKm <= 2.0) {
    factors.push({ text: `${station.distanceKm} km away`, score: distNorm * wDist });
  } else {
    factors.push({ text: `${station.distanceKm} km`, score: distNorm * wDist });
  }

  if (station.waitMinutes === 0) {
    factors.push({ text: "no wait time", score: waitNorm * wWait });
  } else {
    factors.push({ text: `${station.waitMinutes}m wait`, score: waitNorm * wWait });
  }

  if (stationEffectiveSpeed >= 50) {
    factors.push({
      text: `${stationEffectiveSpeed} kW fast charge`,
      score: speedNorm * wSpeed,
    });
  } else {
    factors.push({ text: `${stationEffectiveSpeed} kW`, score: speedNorm * wSpeed });
  }

  if (priceNorm > 0.6) {
    factors.push({ text: `₹${station.price}/kWh low rate`, score: priceNorm * wPrice });
  }

  // Sort top factors
  factors.sort((a, b) => b.score - a.score);
  const topTwo = factors.slice(0, 3).map((f) => f.text);

  let prefix = "Best for you";
  if (!isCompatible && userConnector) {
    prefix = `Incompatible (${userConnector} required)`;
  } else if (preference && preference !== "balanced") {
    const prefName =
      preference === "fastest"
        ? "Fastest"
        : preference === "cheapest"
        ? "Cheapest"
        : "Nearest";
    prefix = `Matches your ${prefName} preference`;
  } else if (batteryPercent < 25) {
    prefix = "Best for low battery";
  } else if (batteryPercent > 70) {
    prefix = "Cheapest fast option";
  }

  const aiPickReason = isCompatible
    ? `${prefix}: ${topTwo.join(", ")}`
    : `Incompatible: station lacks ${userConnector || "matching"} port`;

  return {
    ...station,
    aiScore,
    aiPickReason,
    topFactors: isCompatible ? topTwo : ["Incompatible connector"],
    isIncompatible: !isCompatible,
  };
}

export function scoreAllStations(
  stations: Station[],
  batteryPercent: number,
  vehicle?: ScoringVehicle | null,
  preference?: ChargingPreference | null
): ScoredStation[] {
  return stations
    .map((st) => scoreStation(st, batteryPercent, stations, vehicle, preference))
    .sort((a, b) => {
      // Incompatible always ranked last
      if (a.isIncompatible && !b.isIncompatible) return 1;
      if (!a.isIncompatible && b.isIncompatible) return -1;
      return b.aiScore - a.aiScore;
    });
}
