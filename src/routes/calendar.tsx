import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/calendar")({
  component: () => <ComingSoon titleKey="sections.calendar" />,
});
