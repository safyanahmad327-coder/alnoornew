export interface SurahMeta {
  number: number;
  name: string; // Arabic
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
}

export interface Ayah {
  number: number; // global ayah number (1..6236)
  numberInSurah: number;
  text: string;
  juz?: number;
  page?: number;
}

export interface SurahEditions {
  meta: SurahMeta;
  arabic: Ayah[];
  english: Ayah[];
  urdu: Ayah[];
}

const API = "https://api.alquran.cloud/v1";
const AUDIO_CDN = "https://cdn.islamic.network/quran/audio/128";

export const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
  { id: "ar.husary", name: "Mahmoud Al-Husary" },
  { id: "ar.minshawi", name: "Al-Minshawi" },
  { id: "ar.hudhaify", name: "Ali Al-Hudhaify" },
] as const;

export type ReciterId = (typeof RECITERS)[number]["id"];

export function ayahAudioUrl(globalAyahNumber: number, reciter: ReciterId = "ar.alafasy") {
  return `${AUDIO_CDN}/${reciter}/${globalAyahNumber}.mp3`;
}

export function surahAudioUrl(surahNumber: number, reciter: ReciterId = "ar.alafasy") {
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${surahNumber}.mp3`;
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  const res = await fetch(`${API}/surah`);
  if (!res.ok) throw new Error("Failed to load surah list");
  const j = await res.json();
  return j.data as SurahMeta[];
}

export async function fetchSurah(number: number): Promise<SurahEditions> {
  const url = `${API}/surah/${number}/editions/quran-uthmani,en.sahih,ur.jalandhry`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load surah");
  const j = await res.json();
  const [ar, en, ur] = j.data as Array<{
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: SurahMeta["revelationType"];
    ayahs: Ayah[];
  }>;
  return {
    meta: {
      number: ar.number,
      name: ar.name,
      englishName: ar.englishName,
      englishNameTranslation: ar.englishNameTranslation,
      numberOfAyahs: ar.numberOfAyahs,
      revelationType: ar.revelationType,
    },
    arabic: ar.ayahs,
    english: en.ayahs,
    urdu: ur.ayahs,
  };
}

// --- Bookmarks & last-read (localStorage) ---

export interface Bookmark {
  surah: number;
  ayah: number; // numberInSurah
  surahName: string;
  englishName: string;
  savedAt: number;
}

export interface LastRead {
  surah: number;
  ayah: number;
  surahName: string;
  englishName: string;
  updatedAt: number;
}

const BM_KEY = "noor-quran-bookmarks";
const LR_KEY = "noor-quran-last-read";

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function safeSet(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore */
  }
}

export function getBookmarks(): Bookmark[] {
  return safeGet<Bookmark[]>(BM_KEY, []);
}
export function isBookmarked(surah: number, ayah: number): boolean {
  return getBookmarks().some((b) => b.surah === surah && b.ayah === ayah);
}
export function toggleBookmark(b: Omit<Bookmark, "savedAt">): boolean {
  const list = getBookmarks();
  const i = list.findIndex((x) => x.surah === b.surah && x.ayah === b.ayah);
  if (i >= 0) {
    list.splice(i, 1);
    safeSet(BM_KEY, list);
    return false;
  }
  list.unshift({ ...b, savedAt: Date.now() });
  safeSet(BM_KEY, list.slice(0, 200));
  return true;
}
export function removeBookmark(surah: number, ayah: number) {
  safeSet(
    BM_KEY,
    getBookmarks().filter((b) => !(b.surah === surah && b.ayah === ayah)),
  );
}

export function getLastRead(): LastRead | null {
  return safeGet<LastRead | null>(LR_KEY, null);
}
export function setLastRead(v: Omit<LastRead, "updatedAt">) {
  safeSet(LR_KEY, { ...v, updatedAt: Date.now() });
}

// --- Last playback position (audio resume) ---

export interface LastPlayback {
  surah: number;
  mode: "surah" | "ayah";
  ayah?: number; // numberInSurah when mode === 'ayah'
  position: number; // seconds
  reciter: ReciterId;
  surahName: string;
  englishName: string;
  updatedAt: number;
}

const PB_KEY = "noor-quran-last-playback";

export function getLastPlayback(): LastPlayback | null {
  return safeGet<LastPlayback | null>(PB_KEY, null);
}
export function setLastPlayback(v: Omit<LastPlayback, "updatedAt">) {
  safeSet(PB_KEY, { ...v, updatedAt: Date.now() });
}
export function clearLastPlayback() {
  try {
    localStorage.removeItem(PB_KEY);
  } catch {
    /* ignore */
  }
}
