import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  enabledLocales,
  getLocaleData,
  getLocaleFlag,
  localeSwitchingEnabled,
} from "@/lib/i18n";
import { getLocale, getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";
import { CurrentPageLink } from "./current-page-link";
import { GlobeIcon } from "lucide-react";

export async function TopBanner() {
  if (!localeSwitchingEnabled) {
    return null;
  }

  const [currentLocale, t] = await Promise.all([
    getLocale(),
    getTranslations("nav"),
  ]);

  const currentLocaleData = getLocaleData(currentLocale);

  return (
    <div className="bg-muted/50 border-b border-border">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-10 text-xs">
          <div className="text-muted-foreground hidden sm:block" />
          <div className="ml-auto">
            <DropdownMenu key={currentLocale}>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity text-foreground"
                aria-label={t("switchLanguage")}
              >
                <GlobeIcon className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {getLocaleFlag(currentLocale)} {currentLocaleData.label}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                {enabledLocales.map((locale) => {
                  const localeData = getLocaleData(locale);

                  return (
                    <DropdownMenuItem key={locale} asChild>
                      <CurrentPageLink
                        locale={locale}
                        className={cn(
                          "flex items-center gap-3 w-full cursor-pointer",
                          locale === currentLocale && "bg-muted font-semibold",
                        )}
                      >
                        <span className="text-lg">{getLocaleFlag(locale)}</span>
                        <span>{localeData.label}</span>
                        {locale === currentLocale && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            ✓
                          </span>
                        )}
                      </CurrentPageLink>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
