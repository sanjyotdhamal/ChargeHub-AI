import { Station } from "@/data/stations";

export type ScoredStation = Station & {
  aiScore: number;
  aiPickReason: string;
  topFactors: string[];
};

export function scoreStation(
  station: Station,
  batteryPercent: number,
  allStations: Station[]
): ScoredStation {
  if (allStations.length === 0) {
    return {
      ...station,
      aiScore: station.aiScore,
      aiPickReason: "Recommended for your EV",
      topFactors: ["Available now"],
    };
  }

  // Min and max across stations for normalization
  const distances = allStations.map((s) => s.distanceKm);
  const prices = allStations.map((s) => s.price);
  const speeds = allStations.map((s) => s.speedKw);
  const waits = allStations.map((s) => s.waitMinutes);

  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const minWait = Math.min(...waits);
  const maxWait = Math.max(...waits);

  // Normalized factors (0 to 1)
  const distNorm = maxDist === minDist ? 1 : 1 - (station.distanceKm - minDist) / (maxDist - minDist);
  const priceNorm = maxPrice === minPrice ? 1 : 1 - (station.price - minPrice) / (maxPrice - minPrice);
  const speedNorm = maxSpeed === minSpeed ? 1 : (station.speedKw - minSpeed) / (maxSpeed - minSpeed);
  const waitNorm = maxWait === minWait ? 1 : 1 - (station.waitMinutes - minWait) / (maxWait - minWait);
  const availNorm = station.available ? 1 : 0.1;

  // Dynamic weights based on battery level
  let wDist = 0.25;
  let wSpeed = 0.25;
  let wWait = 0.20;
  let wPrice = 0.20;
  let wAvail = 0.10;

  if (batteryPercent < 25) {
    // Low battery: prioritize proximity and high speed
    wDist = 0.35;
    wSpeed = 0.30;
    wWait = 0.15;
    wPrice = 0.05;
    wAvail = 0.15;
  } else if (batteryPercent > 70) {
    // High battery: prioritize price and availability
    wDist = 0.15;
    wSpeed = 0.15;
    wWait = 0.15;
    wPrice = 0.45;
    wAvail = 0.10;
  }

  const rawScore =
    (distNorm * wDist +
      speedNorm * wSpeed +
      waitNorm * wWait +
      priceNorm * wPrice +
      availNorm * wAvail) *
    100;

  const aiScore = Math.min(99, Math.max(20, Math.round(rawScore)));

  // Generate dynamic AI Pick reason factors
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

  if (station.speedKw >= 50) {
    factors.push({ text: `${station.speedKw} kW fast charge`, score: speedNorm * wSpeed });
  } else {
    factors.push({ text: `${station.speedKw} kW`, score: speedNorm * wSpeed });
  }

  if (priceNorm > 0.6) {
    factors.push({ text: `₹${station.price}/kWh low rate`, score: priceNorm * wPrice });
  }

  // Sort top factors by weighted contribution
  factors.sort((a, b) => b.score - a.score);
  const topTwo = factors.slice(0, 3).map((f) => f.text);

  let prefix = "Best for you";
  if (batteryPercent < 25) {
    prefix = "Best for low battery";
  } else if (batteryPercent > 70) {
    prefix = "Cheapest fast option";
  }

  const aiPickReason = `${prefix}: ${topTwo.join(", ")}`;

  return {
    ...station,
    aiScore,
    aiPickReason,
    topFactors: topTwo,
  };
}

export function scoreAllStations(stations: Station[], batteryPercent: number): ScoredStation[] {
  return stations
    .map((st) => scoreStation(st, batteryPercent, stations))
    .sort((a, b) => b.aiScore - a.aiScore);
}
