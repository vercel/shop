import { DynamicBoundary } from "./primitives";

const PRODUCTS = [
  { name: "Apex Runner GTS", price: "$95" },
  { name: "Velocity Knit Trainer", price: "$110" },
  { name: "PulseRide Daily", price: "$85" },
  { name: "CarbonFly X1", price: "$160" },
  { name: "Quantum Pace", price: "$125" },
];

export const Recommendations = () => (
  <DynamicBoundary className="mt-6" label="Recommendations">
    <div className="mt-2 grid grid-cols-2 @docs-sm:grid-cols-3 @docs-md:grid-cols-5 gap-1.5">
      {PRODUCTS.map((product) => (
        <div
          className="flex h-16 @docs-sm:h-[92px] flex-col justify-end rounded-md border border-gray-300 bg-background-100 p-2.5"
          key={product.name}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-gray-600">{product.name}</span>
            <span className="text-xs text-gray-500">{product.price}</span>
          </div>
        </div>
      ))}
    </div>
  </DynamicBoundary>
);
