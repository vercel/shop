"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * Mostly to switch languages for the same page
 */
export function CurrentPageLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const pathname = usePathname();
  return <Link href={pathname} {...props} />;
}
