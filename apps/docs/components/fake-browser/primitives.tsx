export const ImagePlaceholder = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center bg-black/10 dark:bg-white/10 ${className ?? ""}`}
  >
    <svg
      className="size-8 text-black/30 dark:text-white/30"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="8" cy="9" r="2.5" />
      <path d="M21 17l-5-5-4 4-3-3-5 5v2h17z" />
    </svg>
  </div>
);

export const StaticBadge = () => (
  <span className="inline-flex size-5 items-center justify-center rounded-full bg-purple-700 text-[10px] font-bold text-white">
    S
  </span>
);

export const DynamicBadge = ({ label }: { label: string }) => (
  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 text-[10px] font-bold whitespace-nowrap text-white transition-all duration-200 group-hover/dynamic:px-2 group-focus-within/dynamic:px-2">
    <span>D</span>
    <span className="ml-0 max-w-0 overflow-hidden transition-all duration-200 group-hover/dynamic:ml-1 group-hover/dynamic:max-w-32 group-focus-within/dynamic:ml-1 group-focus-within/dynamic:max-w-32">
      {label}
    </span>
  </span>
);

export const StaticBoundary = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`relative rounded-lg border-2 border-purple-700 bg-white p-3 dark:bg-purple-950/20 ${className ?? ""}`}
  >
    <div className="absolute -top-2.5 -left-2.5">
      <StaticBadge />
    </div>
    {children}
  </div>
);

export const DynamicBoundary = ({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) => (
  <div
    tabIndex={0}
    className={`group/dynamic relative cursor-default rounded-lg border-2 border-dashed border-blue-700 bg-blue-100/70 p-2.5 outline-none transition-colors hover:bg-blue-200/60 focus-within:bg-blue-200/60 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:focus-within:bg-blue-900/30 ${className ?? ""}`}
  >
    <div className="absolute -top-2.5 -left-2.5">
      <DynamicBadge label={label} />
    </div>
    {children}
  </div>
);
