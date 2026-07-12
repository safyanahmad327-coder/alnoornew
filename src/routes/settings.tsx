import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LANGUAGES } from "@/i18n";

export const Route = createFileRoute("/settings")({
  ssr: false,
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("noor-theme") as Theme) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const changeTheme = (v: Theme) => {
    setTheme(v);
    localStorage.setItem("noor-theme", v);
    applyTheme(v);
  };

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
  };

  const methods = [
    { id: 2, name: "ISNA (North America)" },
    { id: 3, name: "Muslim World League" },
    { id: 1, name: "University of Karachi" },
    { id: 4, name: "Umm Al-Qura (Makkah)" },
    { id: 5, name: "Egyptian General Authority" },
  ];

  const [method, setMethod] = useState<number>(() =>
    typeof window !== "undefined"
      ? Number(localStorage.getItem("noor-method") || 2)
      : 2,
  );
  const [madhab, setMadhab] = useState<number>(() =>
    typeof window !== "undefined"
      ? Number(localStorage.getItem("noor-madhab") || 0)
      : 0,
  );

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t("sections.settings")} />
      <div className="space-y-6 px-4 py-5">
        <Section title={t("settings.language")}>
          {LANGUAGES.map((l) => (
            <Row
              key={l.code}
              label={l.label}
              active={i18n.language === l.code}
              onClick={() => changeLang(l.code)}
            />
          ))}
        </Section>

        <Section title={t("settings.theme")}>
          {[
            { v: "light" as const, label: t("settings.light"), Icon: Sun },
            { v: "dark" as const, label: t("settings.dark"), Icon: Moon },
            { v: "system" as const, label: t("settings.system"), Icon: Monitor },
          ].map(({ v, label, Icon }) => (
            <Row
              key={v}
              label={
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {label}
                </span>
              }
              active={theme === v}
              onClick={() => changeTheme(v)}
            />
          ))}
        </Section>

        <Section title={t("settings.calculation")}>
          {methods.map((m) => (
            <Row
              key={m.id}
              label={m.name}
              active={method === m.id}
              onClick={() => {
                setMethod(m.id);
                localStorage.setItem("noor-method", String(m.id));
              }}
            />
          ))}
        </Section>

        <Section title={t("settings.madhab")}>
          {[
            { id: 0, name: "Shafi'i / Maliki / Hanbali" },
            { id: 1, name: "Hanafi" },
          ].map((m) => (
            <Row
              key={m.id}
              label={m.name}
              active={madhab === m.id}
              onClick={() => {
                setMadhab(m.id);
                localStorage.setItem("noor-madhab", String(m.id));
              }}
            />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  active,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left text-sm last:border-b-0 hover:bg-muted"
    >
      <span>{label}</span>
      {active ? <Check className="h-4 w-4 text-primary" /> : null}
    </button>
  );
}
