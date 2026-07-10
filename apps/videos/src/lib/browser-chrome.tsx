import type { ReactNode } from "react";

/** Port of apps/docs/components/storefront-hero/browser-chrome.tsx. */
export const BrowserChrome = ({
  url,
  children,
  showLockIcon = true,
}: {
  url: string;
  children: ReactNode;
  showLockIcon?: boolean;
}) => (
  <div className="w-full rounded-xl border border-gray-alpha-400 bg-background-100">
    <div className="relative flex items-center justify-center overflow-hidden rounded-t-xl border-b border-gray-alpha-400 px-4 py-3">
      <div className="absolute left-4 flex gap-1.5">
        <div className="size-2.5 rounded-full bg-gray-400" />
        <div className="size-2.5 rounded-full bg-gray-400" />
        <div className="size-2.5 rounded-full bg-gray-400" />
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-800">
        {showLockIcon && (
          <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {url}
      </div>
    </div>
    <div className="relative p-4">{children}</div>
  </div>
);
