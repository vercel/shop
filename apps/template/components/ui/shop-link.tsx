import Link from "next/link";
import type { ComponentProps } from "react";

export function ShopLink(props: ComponentProps<typeof Link>) {
  const isInternal =
    typeof props.href === "string"
      ? props.href.startsWith("/")
      : props.href.pathname?.startsWith("/");

  return (
    <Link
      {...props}
      prefetch={undefined}
      // @ts-ignore — unstable_dynamicOnHover is not yet in next/link types
      unstable_dynamicOnHover={isInternal}
    />
  );
}
