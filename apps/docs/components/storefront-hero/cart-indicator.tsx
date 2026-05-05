import { IconCart } from "@/components/assets/icons/icon-cart";

export const CartIndicator = () => (
  <div className="flex items-center gap-1">
    <span className="bg-teal-300 text-teal-900 px-1.5 py-0.5 rounded-full flex items-center text-[11px] font-medium leading-0 h-5">
      Dynamic / Cart
    </span>
    <span className="relative inline-flex items-center justify-center rounded border border-teal-900 border-dashed size-4.5 text-teal-900">
      <IconCart size={11} />
      <span className="absolute top-0 right-0 bg-teal-700 size-2.5 rounded-full -translate-y-1/2 translate-x-1/2" />
    </span>
  </div>
);
