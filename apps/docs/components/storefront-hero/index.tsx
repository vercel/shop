import { BrowserChrome } from "./browser-chrome";
import { StaticBoundary } from "./primitives";
import { CartIndicator } from "./cart-indicator";
import { ProductInfo } from "./product-info";
import { Recommendations } from "./recommendations";
import { ShoePreviewImage } from "./shoe-preview-image";

export const StorefrontHero = () => (
  <BrowserChrome className="@container" url="vercel.shop">
    <StaticBoundary>
      <div className="mt-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="size-4.5 bg-gray-400 rounded-full" />
          <span className="text-[11px] font-medium text-gray-500">
            ACME Online Store
          </span>
        </div>
        <CartIndicator />
      </div>
      <div className="mt-6 flex flex-col @docs-lg:flex-row @docs-lg:items-start gap-7">
        <div className="inline-flex rounded-lg border border-gray-500 @docs-sm:min-w-[450px] py-5 px-12">
          <ShoePreviewImage className="h-[212px] text-gray-600 dark:text-gray-400 mx-auto" />
        </div>
        <ProductInfo />
      </div>
      <Recommendations />
    </StaticBoundary>
  </BrowserChrome>
);
