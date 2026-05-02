export function IconCart({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 16 16"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M0 2.5h.96c.45 0 .86.24 1.08.63L2.5 4.5l1.43 4.3a2.5 2.5 0 0 0 2.37 1.7h6.15a2.5 2.5 0 0 0 2.45-2.01l.8-3.99L16 3H3.62l-.12-.3A2.8 2.8 0 0 0 .96 1H0zm4.08 2 1.27 3.82A1 1 0 0 0 6.3 9h6.15a1 1 0 0 0 .98-.8l.74-3.7H4.08M12.5 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m-8-1.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
