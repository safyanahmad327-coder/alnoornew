import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Search, Heart, Play, Square } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DUAS, DUA_CATEGORIES, type Dua } from "@/lib/duas";
import { speakArabic, stopSpeaking, ttsSupported } from "@/lib/tts";

export const Route = createFileRoute("/duas")({
  ssr: false,
  component: DuasPage,
});

const FAV_KEY = "noor-duas-favs";

function readFavs(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
function writeFavs(s: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

function DuasPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [favs, setFavs] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : readFavs(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const supported = ttsSupported();

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const playDua = (d: Dua) => {
    if (playingId === d.id) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }
    setPlayingId(d.id);
    speakArabic(d.arabic, {
      onend: () => setPlayingId((p) => (p === d.id ? null : p)),
    });
  };


  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return DUAS.filter((d) => {
      if (cat !== "All" && cat !== "Favorites" && d.category !== cat) return false;
      if (cat === "Favorites" && !favs.has(d.id)) return false;
      if (!s) return true;
      return (
        d.title.toLowerCase().includes(s) ||
        d.translation.toLowerCase().includes(s) ||
        d.transliteration.toLowerCase().includes(s)
      );
    });
  }, [q, cat, favs]);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      writeFavs(s);
      return s;
    });
  };

  const copy = async (d: Dua) => {
    const text = `${d.arabic}\n\n${d.transliteration}\n\n${d.translation}${
      d.reference ? `\n\n— ${d.reference}` : ""
    }`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(d.id);
      setTimeout(() => setCopiedId((c) => (c === d.id ? null : c)), 1500);
    } catch {
      /* ignore */
    }
  };

  const chips = ["All", "Favorites", ...DUA_CATEGORIES];

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader title="Duas" subtitle="Everyday supplications" />

      <div className="px-4 pt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search duas…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-card outline-none focus:border-primary"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                cat === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((d) => {
            const fav = favs.has(d.id);
            const copied = copiedId === d.id;
            const playing = playingId === d.id;
            return (
              <article
                key={d.id}
                className={`rounded-2xl border bg-card p-4 shadow-card transition-colors ${
                  playing ? "border-primary" : "border-border"
                }`}
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      {d.category}
                    </p>
                    <h3 className="text-sm font-semibold">{d.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {supported && (
                      <button
                        onClick={() => playDua(d)}
                        aria-label={playing ? "Stop" : "Play"}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          playing
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {playing ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => copy(d)}
                      aria-label="Copy"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleFav(d.id)}
                      aria-label="Favorite"
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        fav ? "text-red-500" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={fav ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </header>

                <p
                  dir="rtl"
                  lang="ar"
                  className="mt-3 font-arabic text-xl leading-loose text-foreground"
                >
                  {d.arabic}
                </p>
                <p className="mt-2 text-xs italic text-muted-foreground">
                  {d.transliteration}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">
                  {d.translation}
                </p>
                {d.reference && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    — {d.reference}
                  </p>
                )}
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No duas match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
