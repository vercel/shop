"use client";

import { ErrorBoundaryContent } from "@/components/error/error-boundary-content";

export default function AccountError({ retry }: { retry: () => void }) {
  return <ErrorBoundaryContent retry={retry} />;
}
