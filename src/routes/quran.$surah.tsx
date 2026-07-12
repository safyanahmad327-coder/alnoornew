import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Settings2,
  X,
} from "lucide-react";
import {
  RECITERS,
  ayahAudioUrl,
  clearLastPlayback,
  fetchSurah,
  getLastPlayback,
  isBookmarked,
  setLastPlayback,
  setLastRead,
  surahAudioUrl,
  toggleBookmark,
  type ReciterId,
} from "@/lib/quran";

export const Route = createFileRoute("/quran/$surah")({
  ssr: false,
  component: SurahPage,
});

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SurahPage() {
  const { surah } = Route.useParams();
  const num = Number(surah);
  if (!Number.isFinite(num) || num < 1 || num > 114) throw notFound();

  const query = useQuery({
    queryKey: ["quran", "surah", num],
    queryFn: () => fetchSurah(num),
    staleTime: 1000 * 60 * 60,
  });

  const [reciter, setReciter] = useState<ReciterId>(() => {
    if (typeof localStorage === "undefined") return "ar.alafasy";
    return (localStorage.getItem("noor-quran-reciter") as ReciterId) || "ar.alafasy";
  });
  const [showEn, setShowEn] = useState(true);
  const [showUr, setShowUr] = useState(true);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [surahMode, setSurahMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrolledRef = useRef(false);
  const resumedRef = useRef(false);
  const lastSavedSecRef = useRef(-1);

  useEffect(() => {
    localStorage.setItem("noor-quran-reciter", reciter);
  }, [reciter]);

  // Init bookmarks state
  useEffect(() => {
    if (!query.data) return;
    const s = new Set<number>();
    query.data.arabic.forEach((a) => {
      if (isBookmarked(num, a.numberInSurah)) s.add(a.numberInSurah);
    });
    setBookmarkedSet(s);
  }, [query.data, num]);

  // Deep-link scroll to #ayah-N
  useEffect(() => {
    if (!query.data || scrolledRef.current) return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        scrolledRef.current = true;
      }
    }
  }, [query.data]);

  // Save last-read on first render
  useEffect(() => {
    if (!query.data) return;
    setLastRead({
      surah: num,
      ayah: 1,
      surahName: query.data.meta.name,
      englishName: query.data.meta.englishName,
    });
  }, [query.data, num]);

  // Resume last playback (audio position) for this surah
  const [resumeInfo, setResumeInfo] = useState<{
    mode: "surah" | "ayah";
    ayah?: number;
    position: number;
  } | null>(null);
  useEffect(() => {
    if (!query.data || resumedRef.current) return;
    resumedRef.current = true;
    const pb = getLastPlayback();
    if (!pb || pb.surah !== num || pb.position < 2) return;
    setResumeInfo({ mode: pb.mode, ayah: pb.ayah, position: pb.position });
    if (pb.reciter) setReciter(pb.reciter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, num]);

  const doResume = () => {
    if (!resumeInfo || !query.data) return;
    if (resumeInfo.mode === "surah") {
      playFullSurah(resumeInfo.position);
    } else if (resumeInfo.ayah != null) {
      const target = query.data.arabic.find(
        (a) => a.numberInSurah === resumeInfo.ayah,
      );
      if (target) {
        document
          .getElementById(`ayah-${target.numberInSurah}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        playAyah(target.number, target.numberInSurah, resumeInfo.position);
      }
    }
    setResumeInfo(null);
  };

  const enMap = useMemo(() => {
    const m = new Map<number, string>();
    query.data?.english.forEach((a) => m.set(a.numberInSurah, a.text));
    return m;
  }, [query.data]);
  const urMap = useMemo(() => {
    const m = new Map<number, string>();
    query.data?.urdu.forEach((a) => m.set(a.numberInSurah, a.text));
    return m;
  }, [query.data]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingAyah(null);
    setSurahMode(false);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    lastSavedSecRef.current = -1;
    clearLastPlayback();
  };

  const savePlayback = (
    mode: "surah" | "ayah",
    position: number,
    ayahInSurah?: number,
  ) => {
    if (!query.data) return;
    setLastPlayback({
      surah: num,
      mode,
      ayah: ayahInSurah,
      position,
      reciter,
      surahName: query.data.meta.name,
      englishName: query.data.meta.englishName,
    });
  };

  const playFullSurah = (resumeAt = 0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(surahAudioUrl(num, reciter));
    audioRef.current = audio;
    setSurahMode(true);
    setPlayingAyah(null);
    setIsPlaying(true);
    setLoadingAudio(true);
    setProgress(resumeAt);
    setDuration(0);
    lastSavedSecRef.current = -1;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setLoadingAudio(false);
      if (resumeAt > 0 && resumeAt < (audio.duration || Infinity)) {
        try {
          audio.currentTime = resumeAt;
        } catch {
          /* ignore */
        }
      }
    };
    audio.ontimeupdate = () => {
      const t = audio.currentTime || 0;
      setProgress(t);
      const sec = Math.floor(t);
      if (sec !== lastSavedSecRef.current) {
        lastSavedSecRef.current = sec;
        savePlayback("surah", t);
      }
    };
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setSurahMode(false);
      clearLastPlayback();
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      setLoadingAudio(false);
    });
  };




  const playAyah = (
    globalNum: number,
    ayahInSurah: number,
    resumeAt = 0,
  ) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(ayahAudioUrl(globalNum, reciter));
    audioRef.current = audio;
    setPlayingAyah(ayahInSurah);
    setSurahMode(false);
    setIsPlaying(true);
    setLoadingAudio(true);
    setProgress(resumeAt);
    setDuration(0);
    lastSavedSecRef.current = -1;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      setLoadingAudio(false);
      if (resumeAt > 0 && resumeAt < (audio.duration || Infinity)) {
        try {
          audio.currentTime = resumeAt;
        } catch {
          /* ignore */
        }
      }
    };
    audio.ontimeupdate = () => {
      const t = audio.currentTime || 0;
      setProgress(t);
      const sec = Math.floor(t);
      if (sec !== lastSavedSecRef.current) {
        lastSavedSecRef.current = sec;
        savePlayback("ayah", t, ayahInSurah);
      }
    };
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      clearLastPlayback();
      if (autoAdvance && query.data) {
        const next = query.data.arabic.find(
          (a) => a.numberInSurah === ayahInSurah + 1,
        );
        if (next) {
          document
            .getElementById(`ayah-${next.numberInSurah}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
          playAyah(next.number, next.numberInSurah);
        } else {
          setPlayingAyah(null);
        }
      } else {
        setPlayingAyah(null);
      }
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      setLoadingAudio(false);
    });

    if (query.data) {
      setLastRead({
        surah: num,
        ayah: ayahInSurah,
        surahName: query.data.meta.name,
        englishName: query.data.meta.englishName,
      });
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  };

  const seekTo = (val: number) => {
    if (!audioRef.current || !Number.isFinite(val)) return;
    audioRef.current.currentTime = val;
    setProgress(val);
  };

  const playNeighbor = (delta: -1 | 1) => {
    if (!query.data || playingAyah == null) return;
    const target = query.data.arabic.find(
      (a) => a.numberInSurah === playingAyah + delta,
    );
    if (!target) return;
    document
      .getElementById(`ayah-${target.numberInSurah}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    playAyah(target.number, target.numberInSurah);
  };

  // If reciter changes while playing, restart with new reciter
  useEffect(() => {
    if (!query.data) return;
    if (surahMode) {
      playFullSurah();
      return;
    }
    if (playingAyah == null) return;
    const cur = query.data.arabic.find((a) => a.numberInSurah === playingAyah);
    if (cur) playAyah(cur.number, cur.numberInSurah);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleBM = (ayahInSurah: number) => {
    if (!query.data) return;
    const active = toggleBookmark({
      surah: num,
      ayah: ayahInSurah,
      surahName: query.data.meta.name,
      englishName: query.data.meta.englishName,
    });
    setBookmarkedSet((prev) => {
      const s = new Set(prev);
      if (active) s.add(ayahInSurah);
      else s.delete(ayahInSurah);
      return s;
    });
  };

  const [showSettings, setShowSettings] = useState(false);

  const hasPrev = playingAyah != null && playingAyah > 1;
  const hasNext =
    playingAyah != null &&
    !!query.data &&
    playingAyah < query.data.meta.numberOfAyahs;

  return (
    <div className="mx-auto max-w-md pb-40">
      {/* Custom header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link
            to="/quran"
            aria-label="Back"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 flip-rtl" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">
              {query.data?.meta.englishName ?? `Surah ${num}`}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {query.data?.meta.englishNameTranslation ?? ""} ·{" "}
              {query.data?.meta.revelationType ?? ""}
            </p>
          </div>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Settings"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>
        {showSettings && (
          <div className="border-t border-border bg-card px-4 py-3 space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Reciter
              </label>
              <select
                value={reciter}
                onChange={(e) => setReciter(e.target.value as ReciterId)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Toggle label="English" active={showEn} onClick={() => setShowEn((v) => !v)} />
              <Toggle label="اردو" active={showUr} onClick={() => setShowUr((v) => !v)} />
              <Toggle
                label="Auto-play next"
                active={autoAdvance}
                onClick={() => setAutoAdvance((v) => !v)}
              />
            </div>
          </div>
        )}
      </header>

      {/* Resume banner */}
      {resumeInfo && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">
                Resume{" "}
                {resumeInfo.mode === "surah"
                  ? "full surah"
                  : `ayah ${resumeInfo.ayah}`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                From {formatTime(resumeInfo.position)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={doResume}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
              <button
                onClick={() => {
                  clearLastPlayback();
                  setResumeInfo(null);
                }}
                aria-label="Dismiss resume"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bismillah banner */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl gradient-hero islamic-pattern px-4 py-5 text-center text-primary-foreground shadow-elegant">
          <p className="font-arabic text-3xl leading-relaxed">
            {query.data?.meta.name ?? "…"}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {query.data?.meta.numberOfAyahs ?? "…"} ayahs
          </p>
          {num !== 1 && num !== 9 && (
            <p className="mt-3 font-arabic text-xl leading-loose">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          )}
          <button
            onClick={() => (surahMode ? togglePlayPause() : playFullSurah())}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/25"
          >
            {surahMode && isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {surahMode ? (isPlaying ? "Pause Surah" : "Resume Surah") : "Play Full Surah"}
          </button>
        </div>
      </div>

      {/* Ayahs */}
      <div className="px-4 pt-4 space-y-3">
        {query.isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ))}
        {query.error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load surah. Check your connection.
          </div>
        )}

        {query.data?.arabic.map((a) => {
          const en = enMap.get(a.numberInSurah);
          const ur = urMap.get(a.numberInSurah);
          const bm = bookmarkedSet.has(a.numberInSurah);
          const active = playingAyah === a.numberInSurah;
          return (
            <article
              key={a.number}
              id={`ayah-${a.numberInSurah}`}
              className={`rounded-2xl border p-4 shadow-card transition-colors scroll-mt-24 ${
                active ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <header className="flex items-center justify-between">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {a.numberInSurah}
                </span>
                <div className="flex items-center gap-1">
                  <IconBtn
                    onClick={() => {
                      if (active) togglePlayPause();
                      else playAyah(a.number, a.numberInSurah);
                    }}
                    aria-label={active && isPlaying ? "Pause" : "Play"}
                  >
                    {active && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </IconBtn>
                  <IconBtn
                    onClick={() => toggleBM(a.numberInSurah)}
                    aria-label="Bookmark"
                    active={bm}
                  >
                    {bm ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </IconBtn>
                </div>
              </header>

              <p
                dir="rtl"
                lang="ar"
                className="mt-3 font-arabic text-2xl leading-loose text-foreground"
              >
                {a.text}
              </p>

              {showEn && en && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {en}
                </p>
              )}
              {showUr && ur && (
                <p
                  dir="rtl"
                  lang="ur"
                  className="mt-2 font-urdu text-base leading-loose text-foreground"
                >
                  {ur}
                </p>
              )}
            </article>
          );
        })}
      </div>

      {/* Persistent audio player */}
      {(playingAyah != null || surahMode) && query.data && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-md px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {query.data.meta.englishName}
                  {surahMode ? " · Full Surah" : ` · Ayah ${playingAyah}`}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {RECITERS.find((r) => r.id === reciter)?.name}
                </p>
              </div>
              <select
                value={reciter}
                onChange={(e) => setReciter(e.target.value as ReciterId)}
                className="max-w-[8rem] truncate rounded-md border border-border bg-background px-1.5 py-1 text-[11px]"
                aria-label="Reciter"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                onClick={stopAudio}
                aria-label="Close player"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="w-9 text-right text-[10px] tabular-nums text-muted-foreground">
                {formatTime(progress)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={progress}
                onChange={(e) => seekTo(Number(e.target.value))}
                disabled={!duration}
                className="h-1 flex-1 cursor-pointer accent-primary"
                aria-label="Seek"
              />
              <span className="w-9 text-[10px] tabular-nums text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              {!surahMode && (
                <button
                  onClick={() => playNeighbor(-1)}
                  disabled={!hasPrev}
                  aria-label="Previous ayah"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  <SkipBack className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={togglePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant disabled:opacity-60"
                disabled={loadingAudio}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>
              {!surahMode && (
                <button
                  onClick={() => playNeighbor(1)}
                  disabled={!hasNext}
                  aria-label="Next ayah"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              )}
              {!surahMode && (
                <button
                  onClick={() => setAutoAdvance((v) => !v)}
                  className={`ml-2 rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
                    autoAdvance
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                  aria-pressed={autoAdvance}
                >
                  Auto-next
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  active,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        active ? "bg-gold/20 text-foreground" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}
