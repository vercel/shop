import { LocaleSwitcher } from "@/components/nav/locale-switcher";
import { getEnabledLocaleOptions, localeSwitchingEnabled } from "@/lib/i18n";

export function LocaleBar({ locale }: { locale: string }) {
  if (!localeSwitchingEnabled) return null;

  return (
    <div className="w-full bg-shop text-white">
      <div className="flex h-12 items-center justify-end px-5 lg:px-10">
        <LocaleSwitcher current={locale} options={getEnabledLocaleOptions()} />
      </div>
    </div>
  );
}
