import { TruckIcon } from "lucide-react";
import { headers } from "next/headers";

export async function ShippingZip() {
  const zip = (await headers()).get("x-vercel-ip-postal-code");
  if (!zip) return null;

  return (
    <div
      className="hidden md:flex shrink-0 items-center gap-1.5 text-sm font-medium"
      data-slot="shipping-zip"
    >
      <TruckIcon className="size-4" aria-hidden />
      <span>{zip}</span>
    </div>
  );
}
