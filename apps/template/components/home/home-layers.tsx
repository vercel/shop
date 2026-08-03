import { Fragment } from "react";

import { CategoryBand } from "@/components/home/category-band";
import { CategoryMosaic } from "@/components/home/category-mosaic";
import { CollectionRail } from "@/components/home/collection-rail";
import { EditorialSplit } from "@/components/home/editorial-split";
import { NewsletterCta } from "@/components/home/newsletter-cta";
import { PromoBanner } from "@/components/home/promo-banner";
import { ValueProps } from "@/components/home/value-props";
import { HOME_LAYERS } from "@/lib/home/layers";
import { TONES } from "@/lib/home/tones";
import type { Locale } from "@/lib/i18n";

export function HomeLayers({ locale }: { locale: Locale }) {
  return (
    <div className="grid">
      {HOME_LAYERS.map((layer) => (
        <Fragment key={layer.id}>
          <div aria-hidden className={`${TONES[layer.tone].divider} h-1.5`} />
          {renderLayer(layer, locale)}
        </Fragment>
      ))}
    </div>
  );
}

function renderLayer(layer: (typeof HOME_LAYERS)[number], locale: Locale) {
  switch (layer.kind) {
    case "category-band":
      return (
        <CategoryBand
          links={layer.links}
          subheadline={layer.subheadline}
          tile={layer.tile}
          title={layer.title}
          tone={layer.tone}
        />
      );
    case "collection-rail":
      return (
        <CollectionRail
          collection={layer.collection}
          eyebrow={layer.eyebrow}
          limit={layer.limit}
          locale={locale}
          tone={layer.tone}
        />
      );
    case "editorial-split":
      return (
        <EditorialSplit
          ctaHref={layer.ctaHref}
          ctaLabel={layer.ctaLabel}
          mediaSide={layer.mediaSide}
          mediaSlotLabel={layer.mediaSlotLabel}
          mediaTone={layer.mediaTone}
          subheadline={layer.subheadline}
          title={layer.title}
          tone={layer.tone}
        />
      );
    case "mosaic":
      return (
        <CategoryMosaic
          eyebrow={layer.eyebrow}
          tiles={layer.tiles}
          title={layer.title}
          tone={layer.tone}
          viewAllLabel={layer.viewAllLabel}
        />
      );
    case "banner":
      return (
        <PromoBanner
          ctaHref={layer.ctaHref}
          ctaLabel={layer.ctaLabel}
          mediaSlotLabel={layer.mediaSlotLabel}
          subheadline={layer.subheadline}
          title={layer.title}
          tone={layer.tone}
        />
      );
    case "value-props":
      return <ValueProps items={layer.items} tone={layer.tone} />;
    case "newsletter":
      return (
        <NewsletterCta
          buttonLabel={layer.buttonLabel}
          description={layer.description}
          eyebrow={layer.eyebrow}
          finePrint={layer.finePrint}
          placeholder={layer.placeholder}
          title={layer.title}
          tone={layer.tone}
        />
      );
  }
}
