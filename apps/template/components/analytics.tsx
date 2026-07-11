import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { analytics } from "@/lib/config";

export function AnalyticsComponents() {
  return (
    <>
      {analytics.vercel.enabled ? <Analytics /> : null}
      {analytics.speedInsights.enabled ? <SpeedInsights /> : null}
    </>
  );
}
