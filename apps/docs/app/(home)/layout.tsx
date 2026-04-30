import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <div className="pt-0 pb-32 font-sans">{children}</div>;
}
