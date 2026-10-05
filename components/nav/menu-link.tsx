import Link from "next/link";
import type { ReactNode } from "react";

export interface MenuLinkProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  url: string;
}

export function MenuLink({ children, className, onClick, url }: MenuLinkProps) {
  if (url.startsWith("http")) {
    return (
      <a
        className={className}
        href={url}
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={url} onClick={onClick}>
      {children}
    </Link>
  );
}
