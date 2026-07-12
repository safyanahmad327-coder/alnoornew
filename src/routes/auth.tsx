import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
export const Route = createFileRoute("/auth")({
  component: () => <ComingSoon titleKey="sections.auth" />,
});
