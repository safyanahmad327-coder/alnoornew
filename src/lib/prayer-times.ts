export type PrayerName = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export const PRAYER_ORDER: PrayerName[] = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerDay {
  timings: PrayerTimings;
  date: {
    readable: string;
    gregorian: { date: string; weekday: { en: string }; month: { en: string }; year: string };
    hijri: {
      date: string;
      day: string;
      month: { en: string; ar: string; number: number };
      year: string;
      weekday: { en: string; ar: string };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
  };
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export const MAKKAH: Coords = { latitude: 21.4225, longitude: 39.8262 };

function todayParam() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export async function fetchTodayPrayers(
  coords: Coords,
  method = 2,
  school = 0,
): Promise<PrayerDay> {
  const url = `https://api.aladhan.com/v1/timings/${todayParam()}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}&school=${school}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch prayer times");
  const json = await res.json();
  return json.data as PrayerDay;
}

export async function fetchMonthPrayers(
  coords: Coords,
  method = 2,
  school = 0,
): Promise<PrayerDay[]> {
  const d = new Date();
  const url = `https://api.aladhan.com/v1/calendar/${d.getFullYear()}/${d.getMonth() + 1}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}&school=${school}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch monthly prayer times");
  const json = await res.json();
  return json.data as PrayerDay[];
}

function parseHHMM(hhmm: string, base = new Date()): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Strip trailing " (EET)"-style suffix Aladhan adds. */
export function cleanTime(t: string) {
  return t.split(" ")[0];
}

export function formatTime(hhmm: string, locale = "en") {
  const d = parseHHMM(cleanTime(hhmm));
  return d.toLocaleTimeString(locale === "ar" ? "ar" : locale === "ur" ? "ur-PK" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface NextPrayerInfo {
  name: PrayerName;
  at: Date;
  msRemaining: number;
  currentName: PrayerName | null;
}

export function computeNextPrayer(timings: PrayerTimings, now = new Date()): NextPrayerInfo {
  const times = PRAYER_ORDER.map((name) => ({
    name,
    at: parseHHMM(cleanTime(timings[name]), now),
  }));
  const upcoming = times.find((t) => t.at.getTime() > now.getTime());
  const last = [...times].reverse().find((t) => t.at.getTime() <= now.getTime());
  if (upcoming) {
    return {
      name: upcoming.name,
      at: upcoming.at,
      msRemaining: upcoming.at.getTime() - now.getTime(),
      currentName: last?.name ?? null,
    };
  }
  // After Isha → next is tomorrow's Fajr
  const fajrTomorrow = parseHHMM(cleanTime(timings.Fajr), new Date(now.getTime() + 86_400_000));
  return {
    name: "Fajr",
    at: fajrTomorrow,
    msRemaining: fajrTomorrow.getTime() - now.getTime(),
    currentName: "Isha",
  };
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s };
}

export function getBrowserCoords(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("geolocation-unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
    );
  });
}

export async function reverseGeocode(coords: Coords): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=10&accept-language=en`,
    );
    if (!res.ok) return "";
    const j = await res.json();
    const a = j.address ?? {};
    return [a.city || a.town || a.village || a.county, a.country].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}
