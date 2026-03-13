"use client";

import { ErrorBoundaryContent } from "@/components/error-boundary-content";

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent reset={reset} />;
}
