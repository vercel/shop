export const BrowserChrome = ({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) => (
  <div className="not-prose mb-6 w-full rounded-xl border bg-fd-background shadow-xl">
    {/* Browser chrome */}
    <div className="relative flex items-center justify-center overflow-hidden rounded-t-xl border-b bg-black/5 dark:bg-white/5 px-4 py-2.5">
      <div className="absolute left-4 flex gap-1.5">
        <div className="size-3 rounded-full bg-[#EE6D5E]" />
        <div className="size-3 rounded-full bg-[#F3BF4A]" />
        <div className="size-3 rounded-full bg-[#5DC753]" />
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-fd-background px-8 py-1.5 text-sm text-fd-muted-foreground">
        <svg
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {url}
      </div>
    </div>

    {/* Page content */}
    <div className="relative p-5">{children}</div>
  </div>
);
