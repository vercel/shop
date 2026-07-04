import { formatMoney } from "@shopify/hydrogen";

import type { Money } from "@/lib/types";

export function formatPrice(money: Money, locale: string): string {
  return formatMoney(money, { currencyDisplay: "narrowSymbol", locale }).localizedString;
}

/** Handles: | (table pipes), * (bold/italic), _ (italic), ` (code), # (headers). */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/\|/g, "\\|")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/`/g, "\\`")
    .replace(/^#/gm, "\\#");
}

/** Empty rows are dropped; mismatched cell counts are truncated or padded with empty cells. */
export function createTable(headers: string[], rows: string[][]): string {
  if (headers.length === 0 || rows.length === 0) return "";

  const normalizedRows = rows
    .filter((row) => row.length > 0)
    .map((row) => {
      if (row.length < headers.length) {
        return [...row, ...Array(headers.length - row.length).fill("")];
      }
      return row.slice(0, headers.length);
    });

  if (normalizedRows.length === 0) return "";

  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `|${headers.map(() => "---").join("|")}|`;
  const dataRows = normalizedRows.map((row) => `| ${row.join(" | ")} |`).join("\n");

  return `${headerRow}\n${separator}\n${dataRows}`;
}
