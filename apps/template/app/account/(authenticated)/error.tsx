"use client";

import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";

export default function AccountError({ reset }: { reset: () => void }) {
  return <ErrorBoundaryContent reset={reset} />;
}
