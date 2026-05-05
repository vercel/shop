"use client";

import Image from "next/image";
import { AvatarTommy } from "@/components/assets/avatars/avatar-tommy";

interface Shoe {
  name: string;
  price: string;
  image: string;
  imageDark: string;
}

const shoes: Shoe[] = [
  {
    name: "Running",
    price: "$95",
    image: "/sneakers/sneaker-1.png",
    imageDark: "/sneakers/sneaker-1-dark.png",
  },
  {
    name: "Street",
    price: "$88",
    image: "/sneakers/sneaker-2.png",
    imageDark: "/sneakers/sneaker-2-dark.png",
  },
  {
    name: "Running",
    price: "$72",
    image: "/sneakers/sneaker-3.png",
    imageDark: "/sneakers/sneaker-3-dark.png",
  },
  {
    name: "Sport",
    price: "$60",
    image: "/sneakers/sneaker-4.png",
    imageDark: "/sneakers/sneaker-4-dark.png",
  },
];

export const AssistantDemo = () => (
  <div className="not-prose w-full rounded-xl border border-gray-alpha-400 bg-background-100 p-4">
    <div className="flex flex-col gap-6">
      {/* User message */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">
            Tommy Triangle
          </span>
          <AvatarTommy className="size-5 rounded-full" />
        </div>
        <div className="relative rounded-2xl bg-gray-100 px-4 py-2 text-sm text-foreground">
          Find me a <span className="dark:hidden">white</span>
          <span className="hidden dark:inline">black</span> sneaker under $120
          <svg
            aria-hidden
            className="absolute -top-[7px] left-full -ml-3.5 text-gray-100"
            fill="currentColor"
            height="16"
            viewBox="0 0 15 16"
            width="15"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M-0.00028528 7C7.033 7.10168 11.1622 3.97537 13.9997 -9.98928e-06C14.9997 5.50001 13.9997 12 12.4997 16L-0.00028528 7Z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* Assistant intro */}
        <div className="text-sm text-foreground">
          I have found some options for you:
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {shoes.map((shoe, i) => (
            <div
              className="flex flex-col gap-3 rounded-lg border border-gray-300 p-3"
              key={`${shoe.name}-${i}`}
            >
              <div className="relative h-20 w-full overflow-hidden">
                <Image
                  alt={shoe.name}
                  className="object-contain dark:hidden"
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  src={shoe.image}
                />
                <Image
                  alt={shoe.name}
                  className="hidden object-contain dark:block"
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  src={shoe.imageDark}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">{shoe.name}</span>
                <span className="text-xs text-gray-800">{shoe.price}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-background-200 p-2.5">
          <span className="text-sm text-gray-600">Ask anything…</span>
          <button
            aria-label="Send"
            className="flex size-7 items-center justify-center rounded-md bg-gray-500 text-background-200"
            type="button"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);
