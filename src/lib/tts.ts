// Simple wrapper around the browser Web Speech API for Arabic recitation.
// Falls back gracefully when unsupported.

let currentUtter: SpeechSynthesisUtterance | null = null;
let arabicVoice: SpeechSynthesisVoice | null = null;

function pickArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (arabicVoice) return arabicVoice;
  const voices = window.speechSynthesis.getVoices();
  arabicVoice =
    voices.find((v) => /ar[-_]/i.test(v.lang)) ??
    voices.find((v) => v.lang?.toLowerCase().startsWith("ar")) ??
    null;
  return arabicVoice;
}

export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakArabic(
  text: string,
  opts?: { onend?: () => void; rate?: number },
): boolean {
  if (!ttsSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = opts?.rate ?? 0.85;
    u.pitch = 1;
    const v = pickArabicVoice();
    if (v) u.voice = v;
    u.onend = () => {
      if (currentUtter === u) currentUtter = null;
      opts?.onend?.();
    };
    u.onerror = () => {
      if (currentUtter === u) currentUtter = null;
      opts?.onend?.();
    };
    currentUtter = u;
    // Some browsers need voices to load first
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        arabicVoice = null;
        const nv = pickArabicVoice();
        if (nv) u.voice = nv;
        window.speechSynthesis.speak(u);
      };
    } else {
      window.speechSynthesis.speak(u);
    }
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  if (!ttsSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  currentUtter = null;
}
