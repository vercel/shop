import type { ProductOption } from "@/lib/types";

// Decoder for Shopify's encodedVariantExistence / encodedVariantAvailability trie
// strings (Storefront API 2024-10+). Control chars: ":" descends an option level,
// "," ends a repeated prefix (consecutive commas pop multiple levels), " " marks a
// gap between non-contiguous sibling values, "-" a contiguous range of values.
export function decodeEncodedVariant(encoded: string): number[][] {
  if (!encoded) return [];
  if (!encoded.startsWith("v1_")) throw new Error("Unsupported option value encoding");
  return v1Decoder(encoded.replace(/^v1_/, ""));
}

function v1Decoder(encoded: string): number[][] {
  const result: number[][] = [];
  const combination: number[] = [];
  let depth = 0;
  let rangeStart: number | null = null;
  let prevControl = "";
  let lastIndex = 0;

  const pushRange = (end: number) => {
    for (let v = rangeStart as number; v <= end; v++) {
      combination[depth] = v;
      result.push(combination.slice(0, depth + 1));
    }
    rangeStart = null;
  };

  const tokenizer = /[ :,-]/g;
  let match = tokenizer.exec(encoded);
  while (match !== null) {
    const control = match[0];
    const value =
      match.index > lastIndex
        ? Number.parseInt(encoded.slice(lastIndex, match.index), 10) || 0
        : null;

    if (control === "-") {
      rangeStart = value ?? 0;
    } else if (control === ":") {
      if (value !== null) combination[depth] = value;
      depth++;
    } else if (control === " ") {
      if (rangeStart !== null) {
        pushRange(value ?? rangeStart);
      } else if (value !== null) {
        combination[depth] = value;
        result.push(combination.slice(0, depth + 1));
      }
    } else {
      // ","
      if (rangeStart !== null) {
        pushRange(value ?? rangeStart);
      } else if (prevControl !== ",") {
        if (value !== null) combination[depth] = value;
        result.push(combination.slice(0, depth + 1));
      }
      depth = Math.max(0, depth - 1);
      combination.length = depth;
    }

    prevControl = control;
    lastIndex = tokenizer.lastIndex;
    match = tokenizer.exec(encoded);
  }

  const trailing = encoded.slice(lastIndex);
  if (/\d/.test(trailing)) {
    const value = Number.parseInt(trailing, 10) || 0;
    if (rangeStart !== null) {
      pushRange(value);
    } else {
      combination[depth] = value;
      result.push(combination.slice(0, depth + 1));
    }
  }

  return result;
}

// Maps decoded availability combinations to the set of in-stock value names per
// option. Falls back to "all available" on missing data, decode failure, or the
// empty result Shopify returns for synthetic single-option products (a known
// upstream quirk) — the authoritative per-variant availability still gates the
// add-to-cart button via the suspended variant query.
export function getAvailableOptionValues(
  options: ProductOption[],
  encodedAvailability: string | undefined,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const allAvailable = () => {
    for (const option of options) {
      map.set(option.name, new Set(option.values.map((v) => v.name)));
    }
    return map;
  };

  if (!encodedAvailability) return allAvailable();

  let combinations: number[][];
  try {
    combinations = decodeEncodedVariant(encodedAvailability);
  } catch {
    return allAvailable();
  }
  if (combinations.length === 0) return allAvailable();

  for (const option of options) map.set(option.name, new Set());
  for (const combination of combinations) {
    for (let i = 0; i < combination.length; i++) {
      const option = options[i];
      const valueName = option?.values[combination[i]]?.name;
      if (valueName) map.get(option.name)?.add(valueName);
    }
  }
  return map;
}
