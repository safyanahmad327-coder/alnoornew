import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Navigation, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/mosques")({
  ssr: false,
  component: MosquesPage,
});

interface Mosque {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number; // km
  address?: string;
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const s1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1)));
}

async function fetchMosques(lat: number, lon: number, radius = 5000): Promise<Mosque[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
      relation["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});
    );
    out center tags 60;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error("Failed to fetch mosques");
  const data = await res.json();
  const items: Mosque[] = (data.elements || [])
    .map((el: any) => {
      const p = el.type === "node" ? { lat: el.lat, lon: el.lon } : el.center;
      if (!p) return null;
      const tags = el.tags || {};
      const parts = [tags["addr:street"], tags["addr:city"]].filter(Boolean);
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name || tags["name:en"] || "Unnamed mosque",
        lat: p.lat,
        lon: p.lon,
        distance: haversine([lat, lon], [p.lat, p.lon]),
        address: parts.join(", ") || undefined,
      } as Mosque;
    })
    .filter(Boolean) as Mosque[];
  items.sort((a, b) => a.distance - b.distance);
  return items;
}

function MosquesPage() {
  const [loc, setLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);

  const getLocation = () => {
    setStatus("locating");
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setError("Geolocation not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoc({ lat: p.coords.latitude, lon: p.coords.longitude });
      },
      (err) => {
        setStatus("error");
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser to find nearby mosques."
            : "Couldn't determine your location. Please try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (!loc) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fetchMosques(loc.lat, loc.lon, radius)
      .then((list) => {
        if (cancelled) return;
        setMosques(list);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e?.message || "Failed to load mosques.");
      });
    return () => {
      cancelled = true;
    };
  }, [loc, radius]);

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader
        title="Nearby Mosques"
        subtitle="Find masajid around you"
        right={
          <button
            onClick={getLocation}
            aria-label="Refresh"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-3">
        <div className="rounded-2xl gradient-hero islamic-pattern p-4 text-primary-foreground shadow-elegant">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <p className="text-xs opacity-90">
              {loc
                ? `${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}`
                : "Locating you…"}
            </p>
          </div>
          <p className="mt-1 text-sm font-semibold">
            {mosques.length > 0
              ? `${mosques.length} masjid${mosques.length === 1 ? "" : "s"} within ${radius / 1000} km`
              : "Searching your area…"}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {[2000, 5000, 10000, 25000].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                radius === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {r / 1000} km
            </button>
          ))}
        </div>

        {status === "locating" && (
          <StateCard icon={<Loader2 className="h-4 w-4 animate-spin" />}>
            Finding your location…
          </StateCard>
        )}
        {status === "loading" && (
          <StateCard icon={<Loader2 className="h-4 w-4 animate-spin" />}>
            Loading nearby mosques…
          </StateCard>
        )}
        {status === "error" && error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
            <button
              onClick={getLocation}
              className="mt-2 block text-xs underline"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && mosques.length === 0 && (
          <StateCard>
            No mosques found nearby. Try increasing the search radius.
          </StateCard>
        )}

        <div className="space-y-2">
          {mosques.map((m) => {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`;
            return (
              <a
                key={m.id}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card transition-colors hover:border-primary/60"
              >
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  {m.address && (
                    <p className="truncate text-xs text-muted-foreground">
                      {m.address}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary">
                    <Navigation className="h-3 w-3" />
                    {m.distance < 1
                      ? `${Math.round(m.distance * 1000)} m away`
                      : `${m.distance.toFixed(1)} km away`}
                  </p>
                </div>
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            );
          })}
        </div>

        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Data © OpenStreetMap contributors
        </p>
      </div>
    </div>
  );
}

function StateCard({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}
