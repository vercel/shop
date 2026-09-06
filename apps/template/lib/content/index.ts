import { shopConfig } from "@/lib/config";

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${new Intl.NumberFormat(shopConfig.localization.locale).format(count)} ${count === 1 ? singular : plural}`;
}
