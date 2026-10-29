export interface SessionStatRecord {
  kwh?: number;
}

export function computeChargingStats(sessionHistory: SessionStatRecord[]) {
  const totalSessions = sessionHistory.length;
  const totalKwh = parseFloat(
    sessionHistory.reduce((acc, s) => acc + (s.kwh || 0), 0).toFixed(1)
  );

  // Carbon offset: ~0.82 kg CO2 saved per kWh delivered compared to petrol ICE vehicles
  const co2Kg = Math.round(totalKwh * 0.82);
  const co2Formatted = co2Kg >= 1000 ? `${(co2Kg / 1000).toFixed(1)} t` : `${co2Kg} kg`;

  return {
    totalSessions,
    totalKwh,
    co2Kg,
    co2Formatted,
  };
}
