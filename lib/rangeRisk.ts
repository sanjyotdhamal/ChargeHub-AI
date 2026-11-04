import treeModel from "@/lib/models/range-anxiety-tree.json";

export interface VehicleRiskInfo {
  batteryCapacityKwh?: number;
  claimedRangeKm?: number;
  batteryHealthPct?: number;
  type?: string;
  model?: string;
  brand?: string;
}

export interface PredictRangeRiskInput {
  batteryPercent: number; // 0 to 100
  vehicle?: VehicleRiskInfo | null;
  nearestStationKm?: number;
}

export interface RangeRiskResult {
  level: "Low" | "Medium" | "High";
  probability: number;
  reason: string;
}

interface TreeNode {
  node_id: number;
  is_leaf: boolean;
  feature?: string;
  threshold?: number;
  samples?: number;
  class_probabilities?: Record<string, number>;
  predicted_class?: string;
  left?: TreeNode;
  right?: TreeNode;
}

/**
 * Predicts range anxiety risk based on the decision tree trained on EV usage data.
 * Includes graceful defaults and transparent fallback safety rule.
 */
export function predictRangeRisk({
  batteryPercent,
  vehicle,
  nearestStationKm,
}: PredictRangeRiskInput): RangeRiskResult {
  // 1. Sensible defaults
  const validBatteryPercent = Math.max(0, Math.min(100, Number(batteryPercent) || 50));
  const batteryCapacity = Number(vehicle?.batteryCapacityKwh) > 0 ? Number(vehicle?.batteryCapacityKwh) : 40;
  const claimedRange = Number(vehicle?.claimedRangeKm) > 0 ? Number(vehicle?.claimedRangeKm) : 300;
  const batteryHealth = Number(vehicle?.batteryHealthPct) > 0 ? Math.min(100, Number(vehicle?.batteryHealthPct)) : 90;
  const stationDist =
    nearestStationKm != null && !isNaN(Number(nearestStationKm)) && Number(nearestStationKm) >= 0
      ? Number(nearestStationKm)
      : 4.5;

  // Determine vehicle category for one-hot encoding
  const rawType = (vehicle?.type || vehicle?.model || "").toLowerCase();
  let vehicleCategory: "Four-Wheeler" | "Three-Wheeler" | "Two-Wheeler" = "Four-Wheeler";
  if (rawType.includes("two") || rawType.includes("bike") || rawType.includes("scooter")) {
    vehicleCategory = "Two-Wheeler";
  } else if (rawType.includes("three") || rawType.includes("auto") || rawType.includes("rickshaw")) {
    vehicleCategory = "Three-Wheeler";
  }

  // Estimated usable range taking SoC and SOH into account
  const estimatedRemainingRange = (validBatteryPercent / 100) * claimedRange * (batteryHealth / 100);

  // 2. Transparent fallback safety rule:
  // High risk when estimated remaining range is below 1.5 times the distance to the nearest station
  const safetyThreshold = stationDist * 1.5;
  if (estimatedRemainingRange < safetyThreshold) {
    return {
      level: "High",
      probability: 0.95,
      reason: `Estimated remaining range (~${Math.round(
        estimatedRemainingRange
      )} km) is below 1.5× the distance to the nearest station (${stationDist.toFixed(
        1
      )} km). Immediate charging recommended.`,
    };
  }

  // 3. Decision Tree Evaluation
  try {
    const features: Record<string, number> = {
      battery_capacity_kwh: batteryCapacity,
      battery_health_pct: batteryHealth,
      range_km_estimated: estimatedRemainingRange,
      charging_station_distance_km: stationDist,
      "vehicle_type_Four-Wheeler": vehicleCategory === "Four-Wheeler" ? 1 : 0,
      "vehicle_type_Three-Wheeler": vehicleCategory === "Three-Wheeler" ? 1 : 0,
      "vehicle_type_Two-Wheeler": vehicleCategory === "Two-Wheeler" ? 1 : 0,
    };

    let currNode: TreeNode | undefined = (treeModel as unknown as { root?: TreeNode })?.root;

    while (currNode && !currNode.is_leaf && currNode.left && currNode.right && currNode.feature) {
      const featVal = features[currNode.feature] ?? 0;
      const thresh = currNode.threshold ?? 0;
      if (featVal <= thresh) {
        currNode = currNode.left;
      } else {
        currNode = currNode.right;
      }
    }

    if (currNode && currNode.class_probabilities) {
      const pHigh =
        currNode.class_probabilities["1"] ??
        currNode.class_probabilities["1.0"] ??
        (currNode.predicted_class === "1" ? 0.85 : 0.15);
      const pLow =
        currNode.class_probabilities["0"] ??
        currNode.class_probabilities["0.0"] ??
        (1 - pHigh);

      if (pHigh >= 0.65 || validBatteryPercent < 18) {
        return {
          level: "High",
          probability: Math.round(pHigh * 100) / 100,
          reason: `High range anxiety predicted (${Math.round(
            pHigh * 100
          )}% probability). At ${validBatteryPercent}% SoC (~${Math.round(
            estimatedRemainingRange
          )} km range), station distance (${stationDist.toFixed(1)} km) requires immediate charging plan.`,
        };
      } else if (pHigh >= 0.35 || validBatteryPercent < 30) {
        return {
          level: "Medium",
          probability: Math.round(Math.max(pHigh, 0.5) * 100) / 100,
          reason: `Moderate range anxiety risk (${Math.round(
            Math.max(pHigh, 0.5) * 100
          )}% probability). At ${validBatteryPercent}% SoC (~${Math.round(
            estimatedRemainingRange
          )} km range), consider planning your charge at nearby hubs (${stationDist.toFixed(1)} km away).`,
        };
      } else {
        return {
          level: "Low",
          probability: Math.round(pLow * 100) / 100,
          reason: `Low range anxiety risk (${Math.round(
            pLow * 100
          )}% safety confidence). Current SoC (${validBatteryPercent}%) provides comfortable ~${Math.round(
            estimatedRemainingRange
          )} km buffer for stations ${stationDist.toFixed(1)} km away.`,
        };
      }
    }
  } catch (err) {
    console.warn("Failed to evaluate range anxiety tree model, using rule-based fallback:", err);
  }

  // Rule-based fallback if tree evaluation is inconclusive
  if (validBatteryPercent <= 20) {
    return {
      level: "High",
      probability: 0.9,
      reason: `Low battery SoC (${validBatteryPercent}%). Estimated remaining range is ~${Math.round(
        estimatedRemainingRange
      )} km with nearest station at ${stationDist.toFixed(1)} km.`,
    };
  } else if (validBatteryPercent <= 35) {
    return {
      level: "Medium",
      probability: 0.6,
      reason: `Battery at ${validBatteryPercent}%. Estimated range is ~${Math.round(
        estimatedRemainingRange
      )} km. Safe for local commute; monitor battery level.`,
    };
  } else {
    return {
      level: "Low",
      probability: 0.9,
      reason: `Healthy battery SoC (${validBatteryPercent}%). Estimated range (~${Math.round(
        estimatedRemainingRange
      )} km) comfortably exceeds distance to nearest station (${stationDist.toFixed(1)} km).`,
    };
  }
}
