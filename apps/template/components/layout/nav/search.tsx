import { SearchClient } from "./search-client";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchFallback() {
  const t = useTranslations("nav");

  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={t("searchPlaceholder")}
        className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 text-base md:text-sm placeholder:text-muted-foreground"
        disabled
      />
    </div>
  );
}

export async function Search() {
  return <SearchClient />;
}
