"use client";

import { ErrorBoundaryContent } from "@/components/ui/error-boundary-content";
import { ERROR_BOUNDARY_LABELS } from "@/lib/i18n/error-fallback";

export default function CollectionError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryContent reset={reset} {...ERROR_BOUNDARY_LABELS} />;
}
