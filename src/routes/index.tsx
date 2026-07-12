import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Sunrise as SunriseIcon,
  Sun,
  Sunset,
  Moon,
  Star,
  Compass,
  BookOpen,
  Heart,
  Hand,
  Calendar,
} from "lucide-react";
import {
  computeNextPrayer,
  fetchTodayPrayers,
  formatCountdown,
  formatTime,
  getBrowserCoords,
  MAKKAH,
  PRAYER_ORDER,
  reverseGeocode,
  type Coords,
  type PrayerName,
} from "@/lib/prayer-times";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

const PRAYER_ICONS: Record<PrayerName, typeof Sun> = {
  Fajr: Star,
  Sunrise: SunriseIcon,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

function Home() {
  const { t, i18n } = useTranslation();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locName, setLocName] = useState("");
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBrowserCoords()
      .then(async (c) => {
        if (cancelled) return;
        setCoords(c);
        const name = await reverseGeocode(c);
        if (!cancelled) setLocName(name);
      })
      .catch(() => {
        if (cancelled) return;
        setLocError(true);
        setCoords(MAKKAH);
        setLocName("Makkah, Saudi Arabia");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = useQuery({
    queryKey: ["prayers", "today", coords?.latitude, coords?.longitude],
    queryFn: () => fetchTodayPrayers(coords!),
    enabled: !!coords,
    staleTime: 1000 * 60 * 30,
  });

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => {
    if (!query.data) return null;
    return computeNextPrayer(query.data.timings, now);
  }, [query.data, now]);

  const countdown = next ? formatCountdown(next.msRemaining) : null;
  const lang = i18n.language || "en";

  return (
    <div className="mx-auto max-w-md">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero islamic-pattern px-5 pt-8 pb-10 text-primary-foreground">
        <div className="flex items-center justify-between text-xs opacity-90">
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[180px]">
              {locError
                ? t("home.location_error")
                : locName || t("home.locating")}
            </span>
          </div>
          <Link
            to="/settings"
            className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-medium hover:bg-white/10"
          >
            {(i18n.language || "en").toUpperCase()}
          </Link>
        </div>

        <p className="mt-5 text-sm/relaxed opacity-90">{t("home.greeting_morning")}</p>
        {query.data && (
          <p className="mt-1 text-xs opacity-75">
            {query.data.date.readable} · {query.data.date.hijri.day}{" "}
            {query.data.date.hijri.month.en} {query.data.date.hijri.year} AH
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <p className="text-[11px] uppercase tracking-widest opacity-70">
            {t("prayers.next")}
          </p>
          {next && query.data ? (
            <>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <h2 className="text-3xl font-semibold">
                  {t(`prayers.${next.name.toLowerCase()}`)}
                </h2>
                <span className="text-sm opacity-80">
                  {formatTime(query.data.timings[next.name], lang)}
                </span>
              </div>
              {countdown && (
                <div className="mt-3 flex items-center gap-2 text-2xl font-mono tabular-nums">
                  <TimeChip value={countdown.h} label={t("prayers.hours")} />
                  <TimeChip value={countdown.m} label={t("prayers.minutes")} />
                  <TimeChip value={countdown.s} label={t("prayers.seconds")} />
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 h-16 animate-pulse rounded-lg bg-white/10" />
          )}
        </div>
      </section>

      {/* Prayer list */}
      <section className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{t("prayers.today")}</h3>
          <Link to="/prayer-times" className="text-xs text-primary font-medium">
            {t("prayers.timings")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {query.data
            ? PRAYER_ORDER.map((name) => {
                const Icon = PRAYER_ICONS[name];
                const active = next?.currentName === name;
                return (
                  <div
                    key={name}
                    className={`rounded-xl border p-3 shadow-card ${
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                          active ? "gradient-primary text-primary-foreground" : "bg-muted text-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t(`prayers.${name.toLowerCase()}`)}
                        </p>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatTime(query.data!.timings[name], lang)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            : Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-4 pt-7 pb-8">
        <h3 className="text-sm font-semibold mb-3">{t("home.quick_actions")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: "/qibla", icon: Compass, key: "sections.qibla" },
            { to: "/quran", icon: BookOpen, key: "sections.quran" },
            { to: "/duas", icon: Heart, key: "sections.duas" },
            { to: "/tasbeeh", icon: Hand, key: "sections.tasbeeh" },
            { to: "/calendar", icon: Calendar, key: "sections.calendar" },
            { to: "/mosques", icon: MapPin, key: "sections.mosques" },
            { to: "/names", icon: Star, key: "sections.names" },
            { to: "/zakat", icon: Sun, key: "sections.zakat" },
          ].map(({ to, icon: Icon, key }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center shadow-card transition-transform active:scale-95"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-[10px] font-medium leading-tight">{t(key)}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function TimeChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-lg bg-white/10 py-2">
      <span className="text-2xl font-semibold leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wider opacity-70">
        {label}
      </span>
    </div>
  );
}
