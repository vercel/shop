import type { MegamenuItem } from "@/lib/types";

import { MegamenuClient } from "./megamenu-client";

type Props = {
  items: MegamenuItem[];
  children?: React.ReactNode;
};

export function MegamenuDesktop({ items, children }: Props) {
  if (!items.length) {
    return null;
  }

  return <MegamenuClient items={items}>{children}</MegamenuClient>;
}
