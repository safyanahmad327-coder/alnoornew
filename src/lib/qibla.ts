import { MAKKAH, type Coords } from "./prayer-times";

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle initial bearing from `from` to Kaaba (degrees, 0=N, clockwise). */
export function qiblaBearing(from: Coords, to: Coords = MAKKAH): number {
  const φ1 = toRad(from.latitude);
  const φ2 = toRad(to.latitude);
  const Δλ = toRad(to.longitude - from.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Haversine distance in km. */
export function haversineKm(from: Coords, to: Coords = MAKKAH): number {
  const R = 6371;
  const φ1 = toRad(from.latitude);
  const φ2 = toRad(to.latitude);
  const Δφ = toRad(to.latitude - from.latitude);
  const Δλ = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function cardinal(bearing: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(bearing / 45) % 8];
}

const CACHE_KEY = "noor-qibla-cache";

export interface QiblaCache {
  coords: Coords;
  bearing: number;
  distanceKm: number;
  savedAt: number;
  locationName?: string;
}

export function saveQiblaCache(data: QiblaCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadQiblaCache(): QiblaCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as QiblaCache) : null;
  } catch {
    return null;
  }
}
