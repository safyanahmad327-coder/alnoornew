import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Vibrate } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/tasbeeh")({
  ssr: false,
  component: TasbeehPage,
});

interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
}

const DHIKRS: Dhikr[] = [
  {
    id: "subhan",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "SubhanAllah",
    translation: "Glory be to Allah",
    target: 33,
  },
  {
    id: "hamd",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise is for Allah",
    target: 33,
  },
  {
    id: "akbar",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest",
    target: 34,
  },
  {
    id: "tahlil",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    transliteration: "La ilaha illallah",
    translation: "There is no god but Allah",
    target: 100,
  },
  {
    id: "istighfar",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    translation: "I seek Allah's forgiveness",
    target: 100,
  },
  {
    id: "salawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
    transliteration: "Allahumma salli 'ala Muhammad",
    translation: "O Allah, send blessings upon Muhammad",
    target: 100,
  },
];

const STATE_KEY = "noor-tasbeeh-state";

interface Saved {
  activeId: string;
  counts: Record<string, number>;
  vibrate: boolean;
}

function load(): Saved {
  const empty: Saved = {
    activeId: DHIKRS[0].id,
    counts: {},
    vibrate: true,
  };
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return empty;
    return { ...empty, ...(JSON.parse(raw) as Saved) };
  } catch {
    return empty;
  }
}
function save(s: Saved) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function TasbeehPage() {
  const [activeId, setActiveId] = useState<string>(DHIKRS[0].id);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [vibrate, setVibrate] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const s = load();
    setActiveId(s.activeId);
    setCounts(s.counts);
    setVibrate(s.vibrate);
  }, []);

  useEffect(() => {
    save({ activeId, counts, vibrate });
  }, [activeId, counts, vibrate]);

  const active = DHIKRS.find((d) => d.id === activeId) ?? DHIKRS[0];
  const count = counts[active.id] ?? 0;
  const target = active.target;
  const progress = Math.min(100, (count / target) * 100);

  const tap = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 120);
    const next = count + 1;
    setCounts((prev) => ({ ...prev, [active.id]: next }));
    if (vibrate && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(next % target === 0 ? [40, 40, 80] : 15);
      } catch {
        /* ignore */
      }
    }
  };

  const reset = () => setCounts((prev) => ({ ...prev, [active.id]: 0 }));
  const resetAll = () => setCounts({});

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const cycles = Math.floor(count / target);

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader
        title="Tasbeeh"
        subtitle="Digital dhikr counter"
        right={
          <button
            onClick={() => setVibrate((v) => !v)}
            aria-label="Toggle vibration"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              vibrate ? "text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Vibrate className="h-5 w-5" />
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {DHIKRS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                activeId === d.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {d.transliteration}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
          <p
            dir="rtl"
            lang="ar"
            className="font-arabic text-3xl leading-loose text-foreground"
          >
            {active.arabic}
          </p>
          <p className="mt-1 text-sm italic text-muted-foreground">
            {active.transliteration}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{active.translation}</p>
        </div>

        {/* Counter circle */}
        <div className="flex justify-center pt-2">
          <button
            onClick={tap}
            aria-label="Count"
            className={`relative inline-flex h-64 w-64 select-none items-center justify-center rounded-full gradient-hero islamic-pattern text-primary-foreground shadow-elegant transition-transform ${
              pulse ? "scale-95" : "scale-100"
            }`}
          >
            {/* Progress ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(progress * 2 * Math.PI * 46) / 100} 999`}
                className="transition-all duration-200"
              />
            </svg>
            <div className="relative z-10 text-center">
              <p className="text-6xl font-bold tabular-nums leading-none">
                {count % target || (count > 0 ? target : 0)}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-widest opacity-80">
                Target {target}
              </p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Total" value={count} />
          <Stat label="Cycles" value={cycles} />
          <Stat label="All dhikr" value={total} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-medium hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            Reset current
          </button>
          <button
            onClick={resetAll}
            className="flex-1 rounded-xl border border-destructive/40 bg-destructive/10 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/15"
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-2 py-3 shadow-card">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
