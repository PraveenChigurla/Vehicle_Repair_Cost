import { createFileRoute } from "@tanstack/react-router";

import { VehicleDamageDashboard } from "@/components/dashboard/VehicleDamageDashboard";

const title = "Vehicle Damage AI · Holographic 3D Inspection Dashboard";
const description =
  "AI-powered vehicle damage assessment: holographic 3D inspection of the vehicle, part-level severity detection and INR repair-cost estimation.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // No `data` prop: falls back to local DEMO_DATA until the FastAPI
  // /analyze response is wired in. Pass real data as <VehicleDamageDashboard data={...} />.
  return <VehicleDamageDashboard />;
}
