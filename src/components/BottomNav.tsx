import { Link } from "@tanstack/react-router";
import { Home, Clock, Compass, BookOpen, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

const items = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/prayer-times", labelKey: "nav.prayers", icon: Clock },
  { to: "/qibla", labelKey: "nav.qibla", icon: Compass },
  { to: "/quran", labelKey: "nav.quran", icon: BookOpen },
  { to: "/more", labelKey: "nav.more", icon: Menu },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, labelKey, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
