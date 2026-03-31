import type { ReactNode } from "react";
import { Footer } from "@/components/geistdocs/footer";
import { Navbar } from "@/components/geistdocs/navbar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="bg-sidebar pt-0 pb-32 font-sans dark:bg-background">{children}</div>
      <Footer />
    </>
  );
}
