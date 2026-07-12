import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/prayer-tracker")({
  component: () => <ComingSoon titleKey="sections.prayer_tracker" />,
});
