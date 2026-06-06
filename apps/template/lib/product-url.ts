import type { SelectedOption } from "@/lib/types";

export function getProductUrl(
  handle: string,
  selectedOptions: SelectedOption[] = [],
  searchParams: Record<string, string | string[] | undefined> = {},
): string {
  const params = new URLSearchParams();
  const optionNames = new Set(selectedOptions.map((option) => option.name));

  for (const option of selectedOptions) {
    if (option.name === "Title" && option.value === "Default Title") continue;
    params.set(option.name, option.value);
  }

  for (const [name, rawValue] of Object.entries(searchParams)) {
    if (name.toLowerCase() === "variant" || optionNames.has(name)) continue;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value) params.append(name, value);
    }
  }

  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}
