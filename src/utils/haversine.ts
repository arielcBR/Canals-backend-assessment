/**
 * Calculates the distance between two geographic points using the Haversine formula.
 *
 * The formula treats the Earth as a sphere and returns the approximate distance in kilometers.
 *
 * IMPORTANT: latitude and longitude must be converted from degrees to radians,
 * as JavaScript's trigonometric functions operate in radians.
 */

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's mean radius in km

  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}