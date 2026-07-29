import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { shopConfig } from "@/lib/config";

export function AnalyticsComponents() {
  return (
    <>
      {shopConfig.analytics.vercel.enabled ? <Analytics /> : null}
      {shopConfig.analytics.speedInsights.enabled ? <SpeedInsights /> : null}
    </>
  );
}
