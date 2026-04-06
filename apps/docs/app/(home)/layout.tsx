import type { ReactNode } from "react";
import { Footer } from "@/components/fromsrc/footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-sidebar pt-0 pb-32 font-sans dark:bg-background">{children}</div>
      <Footer />
    </>
  );
}
