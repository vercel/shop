"use client";

import { StorefrontCanvas } from "@/components/storefront/canvas";

export function ErrorBoundaryContent({ reset }: { reset: () => void }) {
  return <StorefrontCanvas route="error" data-can-reset={Boolean(reset)} />;
}
