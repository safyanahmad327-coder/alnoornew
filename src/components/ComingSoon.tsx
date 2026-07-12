import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { PageHeader } from "./PageHeader";

export function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title={t(titleKey)} />
      <div className="px-6 pt-16 text-center">
        <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("common.coming_soon")}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant"
        >
          {t("nav.home")}
        </Link>
      </div>
    </div>
  );
}
