import { useEffect, useState, type ReactNode } from "react";
import i18n, { applyLangToDocument } from "@/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finalize = () => {
      applyLangToDocument(i18n.language || "en");
      setReady(true);
    };
    if (i18n.isInitialized) finalize();
    else i18n.on("initialized", finalize);
    i18n.on("languageChanged", (lng) => applyLangToDocument(lng));
    return () => {
      i18n.off("initialized", finalize);
    };
  }, []);

  // Avoid a flash of untranslated text on first client render.
  if (!ready) return null;
  return <>{children}</>;
}
