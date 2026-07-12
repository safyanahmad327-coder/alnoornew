import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import {
  fetchMonthPrayers,
  fetchTodayPrayers,
  formatTime,
  getBrowserCoords,
  MAKKAH,
  PRAYER_ORDER,
  type Coords,
} from "@/lib/prayer-times";

export const Route = createFileRoute("/prayer-times")({
  ssr: false,
  component: PrayerTimesPage,
});

type Tab = "today" | "weekly" | "monthly";

function PrayerTimesPage() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("today");
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    getBrowserCoords()
      .then(setCoords)
      .catch(() => setCoords(MAKKAH));
  }, []);

  const today = useQuery({
    queryKey: ["prayers-today", coords],
    queryFn: () => fetchTodayPrayers(coords!),
    enabled: !!coords,
  });
  const month = useQuery({
    queryKey: ["prayers-month", coords],
    queryFn: () => fetchMonthPrayers(coords!),
    enabled: !!coords && (tab === "weekly" || tab === "monthly"),
  });

  const lang = i18n.language || "en";
  const days =
    tab === "weekly"
      ? month.data?.slice(new Date().getDate() - 1, new Date().getDate() + 6)
      : month.data;

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t("prayers.timings")} />
      <div className="px-4 pt-3">
        <div className="flex gap-1 rounded-full border border-border bg-muted p-1">
          {(["today", "weekly", "monthly"] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === k
                  ? "gradient-primary text-primary-foreground shadow-elegant"
                  : "text-muted-foreground"
              }`}
            >
              {t(`prayers.${k}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === "today" && (
        <div className="px-4 pt-4 space-y-2">
          {today.data
            ? PRAYER_ORDER.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
                >
                  <span className="text-sm font-medium">
                    {t(`prayers.${name.toLowerCase()}`)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatTime(today.data!.timings[name], lang)}
                  </span>
                </div>
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
              ))}
        </div>
      )}

      {(tab === "weekly" || tab === "monthly") && (
        <div className="px-4 pt-4 space-y-2">
          {days
            ? days.map((d) => (
                <div
                  key={d.date.gregorian.date}
                  className="rounded-xl border border-border bg-card p-3 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {d.date.gregorian.weekday.en}, {d.date.readable}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.date.hijri.day} {d.date.hijri.month.en} {d.date.hijri.year}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11px]">
                    {PRAYER_ORDER.map((name) => (
                      <div
                        key={name}
                        className="rounded-md bg-muted px-2 py-1 text-center"
                      >
                        <div className="text-muted-foreground">
                          {t(`prayers.${name.toLowerCase()}`)}
                        </div>
                        <div className="font-semibold tabular-nums">
                          {formatTime(d.timings[name], lang)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
        </div>
      )}
    </div>
  );
}
