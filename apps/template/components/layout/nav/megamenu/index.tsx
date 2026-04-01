import { Suspense } from "react";

import { commerce } from "@/lib/commerce";

import { MegamenuFallback } from "./megamenu-client";
import { MegamenuDesktop } from "./megamenu-desktop";
import { MegamenuMobile, MegamenuMobileFallback } from "./megamenu-mobile";

type MegamenuProps = {
  locale: string;
};

async function MegamenuContent({ locale }: MegamenuProps) {
  const data = await commerce.menu.getMegamenuData(locale);
  return (
    <>
      <div className="hidden md:block">
        <MegamenuDesktop items={data.items} />
      </div>

      <MegamenuMobile data={data} />
    </>
  );
}

function MegamenuCombinedFallback() {
  return (
    <>
      <div className="hidden md:block">
        <MegamenuFallback />
      </div>
      <MegamenuMobileFallback />
    </>
  );
}

export function Megamenu({ locale }: MegamenuProps) {
  return (
    <Suspense fallback={<MegamenuCombinedFallback />}>
      <MegamenuContent locale={locale} />
    </Suspense>
  );
}
