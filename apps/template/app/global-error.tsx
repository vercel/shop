"use client";

import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div data-can-reset={Boolean(reset)} data-storefront-canvas="global-error" />
      </body>
    </html>
  );
}
