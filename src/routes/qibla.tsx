import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Compass, MapPin, Navigation, WifiOff, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  getBrowserCoords,
  reverseGeocode,
  type Coords,
} from "@/lib/prayer-times";
import {
  qiblaBearing,
  haversineKm,
  cardinal,
  saveQiblaCache,
  loadQiblaCache,
} from "@/lib/qibla";

export const Route = createFileRoute("/qibla")({
  ssr: false,
  component: QiblaPage,
});

interface OrientationEventLike extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

function QiblaPage() {
  const { t } = useTranslation();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locName, setLocName] = useState("");
  const [bearing, setBearing] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [compassOk, setCompassOk] = useState(true);
  const listenerRef = useRef<((e: OrientationEventLike) => void) | null>(null);

  // Load location (with offline fallback)
  const initLocation = () => {
    setError(null);
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    if (!online) {
      const cache = loadQiblaCache();
      if (cache) {
        setCoords(cache.coords);
        setBearing(cache.bearing);
        setDistance(cache.distanceKm);
        setLocName(cache.locationName ?? "");
        setOffline(true);
        return;
      }
    }
    getBrowserCoords()
      .then(async (c) => {
        const b = qiblaBearing(c);
        const d = haversineKm(c);
        setCoords(c);
        setBearing(b);
        setDistance(d);
        setOffline(false);
        const name = await reverseGeocode(c).catch(() => "");
        setLocName(name);
        saveQiblaCache({
          coords: c,
          bearing: b,
          distanceKm: d,
          savedAt: Date.now(),
          locationName: name,
        });
      })
      .catch(() => {
        const cache = loadQiblaCache();
        if (cache) {
          setCoords(cache.coords);
          setBearing(cache.bearing);
          setDistance(cache.distanceKm);
          setLocName(cache.locationName ?? "");
          setOffline(true);
        } else {
          setError(t("qibla.no_location"));
        }
      });
  };

  useEffect(() => {
    initLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach compass
  const attachCompass = () => {
    const handler = (e: OrientationEventLike) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading; // iOS: 0..360, clockwise from N
      } else if (typeof e.alpha === "number") {
        // alpha: counterclockwise from N. Convert to clockwise.
        h = (360 - e.alpha) % 360;
      }
      if (h != null && !Number.isNaN(h)) setHeading(h);
    };
    listenerRef.current = handler;
    const evt =
      "ondeviceorientationabsolute" in window
        ? "deviceorientationabsolute"
        : "deviceorientation";
    window.addEventListener(evt, handler as EventListener, true);
  };

  const requestCompass = async () => {
    const DOE =
      typeof DeviceOrientationEvent !== "undefined"
        ? (DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<"granted" | "denied">;
          })
        : null;
    if (DOE?.requestPermission) {
      try {
        const res = await DOE.requestPermission();
        if (res === "granted") {
          setNeedsPermission(false);
          attachCompass();
        } else {
          setCompassOk(false);
        }
      } catch {
        setCompassOk(false);
      }
    } else {
      attachCompass();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) {
      setCompassOk(false);
      return;
    }
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DOE.requestPermission === "function") {
      setNeedsPermission(true);
    } else {
      attachCompass();
    }
    return () => {
      if (listenerRef.current) {
        window.removeEventListener(
          "deviceorientationabsolute",
          listenerRef.current as EventListener,
          true,
        );
        window.removeEventListener(
          "deviceorientation",
          listenerRef.current as EventListener,
          true,
        );
      }
    };
  }, []);

  // Online listener
  useEffect(() => {
    const onOnline = () => {
      if (offline) initLocation();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  // Rotate compass dial: if we have heading, rotate ring so N stays at top.
  const dialRotation = heading != null ? -heading : 0;
  // Arrow points toward qibla relative to device heading.
  const arrowRotation =
    bearing != null && heading != null
      ? (bearing - heading + 360) % 360
      : bearing ?? 0;

  const diff =
    bearing != null && heading != null
      ? ((bearing - heading + 540) % 360) - 180
      : null;
  const aligned = diff != null && Math.abs(diff) <= 5;

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader title={t("qibla.title")} subtitle={t("qibla.subtitle")} />

      <div className="px-4 pt-4">
        {offline && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-foreground">
            <WifiOff className="h-4 w-4" />
            <span>{t("qibla.offline")}</span>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <div className="flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                onClick={initLocation}
                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" /> {t("qibla.retry")}
              </button>
            </div>
          </div>
        )}

        {needsPermission && (
          <div className="mb-3 rounded-xl border border-border bg-card p-3 shadow-card">
            <p className="text-sm font-medium">{t("qibla.permission")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("qibla.permission_hint")}
            </p>
            <button
              onClick={requestCompass}
              className="mt-2 w-full rounded-lg gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("qibla.permission")}
            </button>
          </div>
        )}

        {/* Compass */}
        <div className="relative mx-auto mt-2 aspect-square w-full max-w-[320px]">
          <div className="absolute inset-0 rounded-full gradient-hero islamic-pattern shadow-elegant" />
          <div
            className="absolute inset-2 rounded-full border border-white/15 bg-background/85 backdrop-blur"
            style={{
              transform: `rotate(${dialRotation}deg)`,
              transition: "transform 120ms linear",
            }}
          >
            {/* Cardinal marks */}
            {(["N", "E", "S", "W"] as const).map((dir, i) => (
              <span
                key={dir}
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold ${
                  dir === "N" ? "text-primary" : "text-muted-foreground"
                }`}
                style={{
                  transform: `rotate(${i * 90}deg) translateY(-46%) rotate(${-i * 90}deg)`,
                }}
              >
                {dir}
              </span>
            ))}
            {/* Tick marks */}
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className={`absolute left-1/2 top-1 h-2 w-px origin-[50%_155px] ${
                  i % 9 === 0 ? "bg-foreground/70" : "bg-foreground/25"
                }`}
                style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}
              />
            ))}
          </div>

          {/* Qibla arrow */}
          <div
            className="absolute inset-0 flex items-start justify-center"
            style={{
              transform: `rotate(${arrowRotation}deg)`,
              transition: "transform 160ms linear",
            }}
          >
            <div className="mt-4 flex flex-col items-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-gold ${
                  aligned ? "gradient-gold" : "gradient-primary"
                }`}
              >
                <Navigation className="h-6 w-6 -rotate-0 text-primary-foreground" />
              </div>
              <div className="mt-1 h-24 w-1 rounded-full bg-gradient-to-b from-[oklch(0.78_0.15_80)] to-transparent" />
            </div>
          </div>

          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70" />
        </div>

        {/* Status */}
        <div className="mt-5 text-center">
          {aligned ? (
            <p className="text-sm font-semibold text-primary">
              ✓ {t("qibla.aligned")}
            </p>
          ) : diff != null ? (
            <p className="text-sm text-muted-foreground">
              {diff > 0 ? t("qibla.turn_right") : t("qibla.turn_left")} ·{" "}
              {Math.abs(Math.round(diff))}°
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {compassOk ? t("qibla.calibrate") : t("qibla.no_compass")}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <StatCard
            icon={<Compass className="h-4 w-4" />}
            label={t("qibla.bearing")}
            value={
              bearing != null
                ? `${Math.round(bearing)}° ${cardinal(bearing)}`
                : "—"
            }
            hint={t("qibla.from_north")}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4" />}
            label={t("qibla.distance")}
            value={
              distance != null
                ? `${Math.round(distance).toLocaleString()} ${t("qibla.km")}`
                : "—"
            }
            hint={t("qibla.location")}
          />
        </div>

        {(locName || coords) && (
          <div className="mt-3 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-card">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">
                {locName ||
                  (coords
                    ? `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
                    : "")}
              </span>
            </div>
            {heading != null && (
              <p className="mt-1 tabular-nums">
                {t("qibla.heading")}: {Math.round(heading)}°
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
