import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LocalePicker } from "@/components/nav/locale-picker";
import { ShippingZip } from "@/components/nav/shipping-zip";
import { localeSwitchingEnabled } from "@/lib/i18n";
import { getLocale } from "@/lib/params";

import { AnnouncementBarClient } from "./announcement-bar-client";

export async function AnnouncementBar() {
  const [t, locale] = await Promise.all([getTranslations("announcement"), getLocale()]);

  return (
    <div className="flex h-8 w-full shrink-0 items-center overflow-hidden bg-cta text-primary-foreground">
      <div className="mx-auto flex h-full w-full max-w-[96rem] items-center gap-4 px-5 lg:px-10">
        <AnnouncementBarClient messages={[t("freeShipping"), t("newArrivals"), t("returns")]} />
        <div className="flex shrink-0 items-center gap-5">
          <Suspense>
            <ShippingZip />
          </Suspense>
          {localeSwitchingEnabled && <LocalePicker locale={locale} />}
        </div>
      </div>
    </div>
  );
}
