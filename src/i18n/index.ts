import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ur from "./locales/ur.json";
import ar from "./locales/ar.json";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

export const RTL_LANGS: LangCode[] = ["ur", "ar"];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ur: { translation: ur },
        ar: { translation: ar },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "ur", "ar"],
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "noor-lang",
      },
      react: { useSuspense: false },
    });
}

export function applyLangToDocument(lng: string) {
  if (typeof document === "undefined") return;
  const dir = RTL_LANGS.includes(lng as LangCode) ? "rtl" : "ltr";
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
}

export default i18n;
