import { Station } from "@/types/station";

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

export type LearnedUserHabit = {
  inferredPreference: "fastest" | "cheapest" | "balanced";
  habitTitle: string;
  description: string;
  speedBias: number;
  priceBias: number;
  avgSpeedKw: number;
  avgPricePerKwh: number;
  totalSessionsAnalyzed: number;
};

/**
 * Infers user habit from past charging sessions.
 * Learns whether the user prioritizes high-speed turnarounds (Speed Seeker)
 * or lower electricity rates (Budget Conscious).
 */
export function inferHabitFromHistory(
  sessions: Array<{ kwh: number; cost: number; durationMinutes: number; network?: string }>
): LearnedUserHabit {
  if (!sessions || sessions.length === 0) {
    return {
      inferredPreference: "balanced",
      habitTitle: "Balanced Commuter",
      description: "Standard balanced optimization across distance, speed, and cost.",
      speedBias: 0,
      priceBias: 0,
      avgSpeedKw: 30,
      avgPricePerKwh: 18,
      totalSessionsAnalyzed: 0,
    };
  }

  let totalKwSpeed = 0;
  let totalPricePerKwh = 0;
  let fastSessionCount = 0;
  let cheapSessionCount = 0;

  for (const s of sessions) {
    const hours = Math.max(0.1, (s.durationMinutes || 30) / 60);
    const speed = s.kwh / hours;
    totalKwSpeed += speed;

    const unitPrice = s.cost / Math.max(1, s.kwh);
    totalPricePerKwh += unitPrice;

    // Fast DC indicators: speed >= 40 kW or network known for high-speed charging or price tolerance
    if (speed >= 38 || (s.network && (s.network.includes("Jio-bp") || s.network.includes("Zeon") || s.network.includes("Fast")))) {
      fastSessionCount++;
    }
    // Budget indicators: unit price <= 16 ₹/kWh or low speed AC usage
    if (unitPrice <= 16 || speed <= 25) {
      cheapSessionCount++;
    }
  }

  const avgSpeedKw = Math.round(totalKwSpeed / sessions.length);
  const avgPricePerKwh = Math.round((totalPricePerKwh / sessions.length) * 10) / 10;

  if (fastSessionCount > cheapSessionCount || avgSpeedKw >= 42) {
    return {
      inferredPreference: "fastest",
      habitTitle: "Speed Seeker",
      description: `Prefers high-power DC fast charging (Avg ${avgSpeedKw} kW in history).`,
      speedBias: 0.22,
      priceBias: -0.10,
      avgSpeedKw,
      avgPricePerKwh,
      totalSessionsAnalyzed: sessions.length,
    };
  }

  if (cheapSessionCount > fastSessionCount || avgPricePerKwh <= 16.5) {
    return {
      inferredPreference: "cheapest",
      habitTitle: "Budget Conscious",
      description: `Prefers economical charging hubs (Avg ₹${avgPricePerKwh}/kWh in history).`,
      speedBias: -0.12,
      priceBias: 0.25,
      avgSpeedKw,
      avgPricePerKwh,
      totalSessionsAnalyzed: sessions.length,
    };
  }

  return {
    inferredPreference: "balanced",
    habitTitle: "Balanced Commuter",
    description: "Evenly balances travel time, charger speed, and charging rates.",
    speedBias: 0,
    priceBias: 0,
    avgSpeedKw,
    avgPricePerKwh,
    totalSessionsAnalyzed: sessions.length,
  };
}

export function scoreStation(
  station: Station,
  batteryPercent: number,
  allStations: Station[],
  vehicle?: ScoringVehicle | null,
  preference?: ChargingPreference | null,
  learnedHabit?: LearnedUserHabit | null
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

  // 3b. Personalisation from History: Apply learned habit if no manual override
  const effectiveHabit = (!preference || preference === "balanced") ? learnedHabit : null;
  if (effectiveHabit && effectiveHabit.inferredPreference !== "balanced") {
    if (effectiveHabit.inferredPreference === "fastest") {
      wSpeed += 0.22;
      wPrice = Math.max(0.05, wPrice - 0.12);
      wDist = Math.max(0.10, wDist - 0.08);
    } else if (effectiveHabit.inferredPreference === "cheapest") {
      wPrice += 0.26;
      wSpeed = Math.max(0.05, wSpeed - 0.15);
      wWait = Math.max(0.08, wWait - 0.08);
    }

    // Renormalize weights so total is exactly 1.0
    const totalW = wDist + wSpeed + wWait + wPrice + wAvail;
    if (totalW > 0) {
      wDist /= totalW;
      wSpeed /= totalW;
      wWait /= totalW;
      wPrice /= totalW;
      wAvail /= totalW;
    }
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
  } else if (effectiveHabit && effectiveHabit.inferredPreference !== "balanced") {
    prefix = `Learned habit: ${effectiveHabit.habitTitle}`;
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
  preference?: ChargingPreference | null,
  learnedHabit?: LearnedUserHabit | null
): ScoredStation[] {
  return stations
    .map((st) => scoreStation(st, batteryPercent, stations, vehicle, preference, learnedHabit))
    .sort((a, b) => {
      // Incompatible always ranked last
      if (a.isIncompatible && !b.isIncompatible) return 1;
      if (!a.isIncompatible && b.isIncompatible) return -1;
      return b.aiScore - a.aiScore;
    });
}
