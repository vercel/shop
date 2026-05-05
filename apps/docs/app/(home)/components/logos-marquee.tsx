import type { ReactNode } from "react";
import { LogoAg1 } from "@/components/assets/logos/logo-ag1";
import { LogoBombas } from "@/components/assets/logos/logo-bombas";
import { LogoMadeIn } from "@/components/assets/logos/logo-made-in";
import { LogoPaige } from "@/components/assets/logos/logo-paige";
import { LogoRuggable } from "@/components/assets/logos/logo-ruggable";
import { LogoSupreme } from "@/components/assets/logos/logo-supreme";

interface LogoEntry {
  key: string;
  node: ReactNode;
}

const LOGOS: LogoEntry[] = [
  { key: "ruggable", node: <LogoRuggable className="h-7 w-auto md:h-8" /> },
  { key: "bombas", node: <LogoBombas className="h-4 w-auto md:h-5" /> },
  { key: "paige", node: <LogoPaige className="h-7 w-auto md:h-8" /> },
  { key: "ag1", node: <LogoAg1 className="h-7 w-auto md:h-8" /> },
  { key: "supreme", node: <LogoSupreme className="h-8 w-auto md:h-10" /> },
  { key: "made-in", node: <LogoMadeIn className="h-5 w-auto md:h-6" /> },
];

export const LogosMarquee = () => (
  <section
    aria-label="Featured brands"
    className="relative w-full overflow-hidden py-10 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
  >
    <div className="flex w-max animate-marquee gap-16 pr-16 text-foreground md:gap-24 md:pr-24">
      {[...LOGOS, ...LOGOS].map((logo, index) => (
        <div
          key={`${logo.key}-${index}`}
          className="flex shrink-0 items-center"
        >
          {logo.node}
        </div>
      ))}
    </div>
  </section>
);
