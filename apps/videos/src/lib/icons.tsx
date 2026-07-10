export const IconCart = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    className={className}
    fill="none"
    height={size}
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.75}
    viewBox="0 0 24 24"
    width={size}
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const CursorIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} fill="currentColor" style={style} viewBox="0 0 24 24">
    <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z" />
  </svg>
);

export const SpinnerIcon = ({ rotation }: { rotation: number }) => (
  <svg
    className="size-3"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    style={{ transform: `rotate(${rotation}deg)` }}
    viewBox="0 0 24 24"
  >
    <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
  </svg>
);

export const CheckIcon = () => (
  <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** Stand-in for the docs AvatarTommy component. */
export const AvatarTommy = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <circle cx="12" cy="12" fill="oklch(0.937 0 0)" r="12" />
    <path d="M12 6.5 18.5 17h-13L12 6.5Z" fill="oklch(0.205 0 0)" />
  </svg>
);
