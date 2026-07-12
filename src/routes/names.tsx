import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Play, Square, ListMusic } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NAMES } from "@/lib/names";
import { speakArabic, stopSpeaking, ttsSupported } from "@/lib/tts";

export const Route = createFileRoute("/names")({
  ssr: false,
  component: NamesPage,
});

function NamesPage() {
  const [q, setQ] = useState("");
  const [playingNum, setPlayingNum] = useState<number | null>(null);
  const [allPlaying, setAllPlaying] = useState(false);
  const allIndexRef = useRef(0);
  const supported = ttsSupported();

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return NAMES;
    return NAMES.filter(
      (n) =>
        n.transliteration.toLowerCase().includes(s) ||
        n.meaning.toLowerCase().includes(s) ||
        n.arabic.includes(s) ||
        String(n.number) === s,
    );
  }, [q]);

  const playOne = (num: number, arabic: string) => {
    if (playingNum === num) {
      stopSpeaking();
      setPlayingNum(null);
      return;
    }
    setAllPlaying(false);
    setPlayingNum(num);
    speakArabic(arabic, { onend: () => setPlayingNum((p) => (p === num ? null : p)) });
  };

  const playAll = () => {
    if (allPlaying) {
      stopSpeaking();
      setAllPlaying(false);
      setPlayingNum(null);
      return;
    }
    setAllPlaying(true);
    allIndexRef.current = 0;
    const next = () => {
      const list = filtered;
      const i = allIndexRef.current;
      if (i >= list.length) {
        setAllPlaying(false);
        setPlayingNum(null);
        return;
      }
      const n = list[i];
      setPlayingNum(n.number);
      speakArabic(n.arabic, {
        onend: () => {
          allIndexRef.current += 1;
          setTimeout(next, 200);
        },
      });
    };
    next();
  };

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader title="99 Names of Allah" subtitle="Asma al-Husna" />

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-2xl gradient-hero islamic-pattern p-4 text-center text-primary-foreground shadow-elegant">
          <p className="font-arabic text-3xl leading-relaxed">أَسْمَاءُ اللَّهِ الْحُسْنَىٰ</p>
          <p className="mt-2 text-xs opacity-85">
            "And to Allah belong the most beautiful names, so invoke Him by them."
          </p>
          <p className="mt-0.5 text-[10px] opacity-70">— Qur'an 7:180</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or meaning…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-card outline-none focus:border-primary"
          />
        </div>

        {supported ? (
          <button
            onClick={playAll}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
              allPlaying
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:border-primary/60"
            }`}
          >
            {allPlaying ? <Square className="h-4 w-4" /> : <ListMusic className="h-4 w-4" />}
            {allPlaying ? "Stop recitation" : "Recite all"}
          </button>
        ) : (
          <p className="rounded-lg border border-border bg-card px-3 py-2 text-center text-[11px] text-muted-foreground">
            Recitation not supported on this device.
          </p>
        )}

        <div className="grid grid-cols-1 gap-2">
          {filtered.map((n) => {
            const isPlaying = playingNum === n.number;
            return (
              <article
                key={n.number}
                className={`flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card transition-colors ${
                  isPlaying ? "border-primary" : "border-border"
                }`}
              >
                <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 rotate-45 rounded-md border border-primary/40" />
                  <span className="text-xs font-semibold text-primary">
                    {n.number}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.transliteration}</p>
                  <p className="text-xs text-muted-foreground">{n.meaning}</p>
                </div>
                <p
                  dir="rtl"
                  lang="ar"
                  className="font-arabic text-xl text-foreground"
                >
                  {n.arabic}
                </p>
                {supported && (
                  <button
                    onClick={() => playOne(n.number, n.arabic)}
                    aria-label={isPlaying ? "Stop" : "Play"}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isPlaying
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {isPlaying ? (
                      <Square className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </article>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No names match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
