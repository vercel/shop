import { cn } from "@/lib/utils";

const SIZES = [
  "5.0",
  "5.5",
  "6.0",
  "6.5",
  "7.0",
  "7.5",
  "8.0",
  "8.5",
  "9.0",
  "9.5",
  "10.0",
  "10.5",
];

export const ProductInfo = () => (
  <div className="flex flex-col gap-4 w-full">
    <div className="flex items-baseline justify-between">
      <p className="text-[32px] text-gray-500 font-semibold">Classic Shoe</p>
      <p className="text-[18px] text-gray-500">$100.00</p>
    </div>
    <hr className="border-gray-300" />
    <div className="mt-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] text-gray-500">Select Size:</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1">
          {SIZES.map((size, i) => (
            <div
              className={cn(
                "rounded-lg border bg-gray-100 py-2 text-center text-[11px] text-gray-500",
                i < 6 && "hidden sm:block",
                size === "10.0"
                  ? "border-gray-alpha-400"
                  : "border-transparent",
              )}
              key={size}
            >
              {size}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md bg-gray-100 py-3 text-center text-xs text-gray-600 border border-gray-alpha-100">
        Add to Cart ($100)
      </div>
    </div>
  </div>
);
