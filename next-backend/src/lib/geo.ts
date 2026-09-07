/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS = 6371000; // meters

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS * c * 100) / 100;
}

export function parseTimeString(timeStr?: string | Date | null): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 9, minutes: 0 };
  if (timeStr instanceof Date) {
    return {
      hours: timeStr.getUTCHours(),
      minutes: timeStr.getUTCMinutes(),
    };
  }
  const str = String(timeStr).trim();
  if (str.includes("T")) {
    const d = new Date(str);
    return { hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
  }
  const parts = str.split(":");
  return {
    hours: parseInt(parts[0] || "9", 10),
    minutes: parseInt(parts[1] || "0", 10),
  };
}

export function isTimeAfter(date: Date, hours: number, minutes: number): boolean {
  const target = new Date(date);
  target.setHours(hours, minutes, 0, 0);
  return date.getTime() > target.getTime();
}
