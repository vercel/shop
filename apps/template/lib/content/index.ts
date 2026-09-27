import { shopConfig } from "@/lib/config";

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${new Intl.NumberFormat(shopConfig.localization.locale).format(count)} ${count === 1 ? singular : plural}`;
}

export function summarizeText(text: string, maxLength = 200): string {
  const summary = text.replace(/\s+/g, " ").trim();
  return summary.length > maxLength ? `${summary.slice(0, maxLength - 1).trimEnd()}…` : summary;
}
