import Image from "next/image";
import { cn } from "@/lib/utils";

const COUNTRY_CODES: Record<string, string> = {
  "en-US": "US",
  "en-GB": "GB",
  "es-ES": "ES",
  "de-DE": "DE",
  "fr-FR": "FR",
  "nl-NL": "NL",
  "pt-PT": "PT",
  "zh-CN": "CN",
  "ar-SA": "SA",
  "ja-JP": "JP",
  "ko-KR": "KR",
  "it-IT": "IT",
  "ru-RU": "RU",
};

type CountryFlagProps = {
  locale: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_DIMENSIONS = {
  sm: { width: 20, height: 16 },
  md: { width: 32, height: 24 },
  lg: { width: 40, height: 28 },
};

export function CountryFlag({
  locale,
  className,
  size = "md",
}: CountryFlagProps) {
  const countryCode = COUNTRY_CODES[locale] || locale.split("-")[1] || "US";
  const dimensions = SIZE_DIMENSIONS[size];

  return (
    <Image
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={`${countryCode} flag`}
      width={dimensions.width}
      height={dimensions.height}
      className={cn("object-cover", className)}
      unoptimized
    />
  );
}
