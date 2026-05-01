export const StaticBadge = () => (
  <span className="inline-flex px-1.5 py-0.5 h-5 items-center justify-center rounded-full bg-blue-300 text-blue-900 text-[11px] font-medium">
    Static
  </span>
);

export const DynamicBadge = ({ label }: { label: string }) => (
  <span className="inline-flex px-1.5 py-0.5 h-5 items-center justify-center rounded-full bg-teal-300 text-teal-900 text-[11px] font-medium">
    Dynamic / {label}
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
    className={`relative rounded-lg border border-blue-600 p-4 ${className ?? ""}`}
  >
    <div className="absolute -translate-y-1/2 top-0 left-2">
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
    className={`relative rounded-lg border border-dashed border-teal-900 p-2.5 ${className ?? ""}`}
  >
    <div className="absolute -translate-y-1/2 top-0 left-2">
      <DynamicBadge label={label} />
    </div>
    {children}
  </div>
);
