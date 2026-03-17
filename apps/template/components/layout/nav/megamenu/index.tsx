import { MegamenuMobile, MegamenuMobileFallback } from "./megamenu-mobile";

import { getMegamenuData } from "@/lib/shopify/operations/megamenu";
import { MegamenuDesktop } from "./megamenu-desktop";
import { MegamenuFallback } from "./megamenu-client";
import { Suspense } from "react";

type MegamenuProps = {
  locale: string;
};

async function MegamenuContent({ locale }: MegamenuProps) {
  const data = await getMegamenuData(locale);
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
