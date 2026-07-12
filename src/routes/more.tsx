import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Compass,
  BookOpen,
  Heart,
  Hand,
  Calendar,
  MapPin,
  Settings,
  User,
  LogIn,
  Star,
  BarChart3,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/more")({
  component: MorePage,
});

function MorePage() {
  const { t } = useTranslation();

  const groups = [
    {
      items: [
        { to: "/qibla", icon: Compass, key: "sections.qibla" },
        { to: "/quran", icon: BookOpen, key: "sections.quran" },
        { to: "/duas", icon: Heart, key: "sections.duas" },
        { to: "/tasbeeh", icon: Hand, key: "sections.tasbeeh" },
        { to: "/calendar", icon: Calendar, key: "sections.calendar" },
        { to: "/mosques", icon: MapPin, key: "sections.mosques" },
      ],
    },
    {
      items: [
        { to: "/prayer-tracker", icon: BarChart3, key: "sections.prayer_tracker" },
        { to: "/names", icon: Star, key: "sections.names" },
        { to: "/zakat", icon: Calculator, key: "sections.zakat" },
      ],
    },
    {
      items: [
        { to: "/profile", icon: User, key: "sections.profile" },
        { to: "/settings", icon: Settings, key: "sections.settings" },
        { to: "/auth", icon: LogIn, key: "sections.auth" },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t("nav.more")} back={false} />
      <div className="space-y-4 px-4 pt-4">
        {groups.map((g, gi) => (
          <div
            key={gi}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            {g.items.map(({ to, icon: Icon, key }, i) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1 text-sm font-medium">{t(key)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flip-rtl" />
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
