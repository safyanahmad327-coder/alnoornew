import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Bookmark, Search, ChevronRight, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  fetchSurahList,
  getBookmarks,
  getLastRead,
  type Bookmark as BM,
  type LastRead,
} from "@/lib/quran";

export const Route = createFileRoute("/quran/")({
  ssr: false,
  component: QuranIndex,
});

function QuranIndex() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<BM[]>([]);

  useEffect(() => {
    setLastRead(getLastRead());
    setBookmarks(getBookmarks());
  }, []);

  const query = useQuery({
    queryKey: ["quran", "surah-list"],
    queryFn: fetchSurahList,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const surahs = useMemo(() => {
    const list = query.data ?? [];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter(
      (x) =>
        x.englishName.toLowerCase().includes(s) ||
        x.englishNameTranslation.toLowerCase().includes(s) ||
        x.name.includes(s) ||
        String(x.number) === s,
    );
  }, [query.data, q]);

  return (
    <div className="mx-auto max-w-md pb-6">
      <PageHeader title={t("sections.quran")} subtitle="القرآن الكريم" />

      <div className="px-4 pt-4 space-y-4">
        {lastRead && (
          <Link
            to="/quran/$surah"
            params={{ surah: String(lastRead.surah) }}
            hash={`ayah-${lastRead.ayah}`}
            className="block overflow-hidden rounded-2xl gradient-hero islamic-pattern p-4 text-primary-foreground shadow-elegant"
          >
            <p className="text-[10px] uppercase tracking-widest opacity-70">
              Continue reading
            </p>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">
                  {lastRead.englishName}
                </p>
                <p className="text-xs opacity-80">
                  Ayah {lastRead.ayah}
                </p>
              </div>
              <PlayCircle className="h-8 w-8 opacity-90" />
            </div>
          </Link>
        )}

        {bookmarks.length > 0 && (
          <section>
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Bookmark className="h-4 w-4 text-primary" />
              Bookmarks
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {bookmarks.slice(0, 12).map((b) => (
                <Link
                  key={`${b.surah}-${b.ayah}`}
                  to="/quran/$surah"
                  params={{ surah: String(b.surah) }}
                  hash={`ayah-${b.ayah}`}
                  className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-card"
                >
                  <p className="font-semibold">{b.englishName}</p>
                  <p className="text-muted-foreground">Ayah {b.ayah}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search surah…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-card outline-none focus:border-primary"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {query.isLoading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse border-b border-border bg-muted/40 last:border-b-0" />
            ))}
          {query.error && (
            <div className="p-4 text-sm text-destructive">
              Failed to load surahs. Check your connection.
            </div>
          )}
          {surahs.map((s, i) => (
            <Link
              key={s.number}
              to="/quran/$surah"
              params={{ surah: String(s.number) }}
              className={`flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rotate-45 rounded-md border border-primary/40" />
                <span className="text-[11px] font-semibold text-primary">
                  {s.number}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-semibold">
                    {s.englishName}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {s.englishNameTranslation}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {s.revelationType} · {s.numberOfAyahs} ayahs
                </p>
              </div>
              <span className="font-arabic text-lg text-foreground">{s.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flip-rtl" />
            </Link>
          ))}
        </div>

        {!query.isLoading && !query.error && surahs.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            <BookOpen className="mx-auto mb-1 h-5 w-5" />
            No results
          </div>
        )}
      </div>
    </div>
  );
}
