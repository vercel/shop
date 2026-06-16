export function decodeEncodedVariant(encodedVariantField: string | null | undefined): number[][] {
  if (!encodedVariantField) return [];
  if (!encodedVariantField.startsWith("v1_")) {
    throw new Error("Unsupported option value encoding");
  }

  const encoded = encodedVariantField.replace(/^v1_/, "");
  const tokenizer = /[ :,-]/g;
  const combinations: number[][] = [];
  const current: number[] = [];
  let depth = 0;
  let index = 0;
  let rangeStart: number | null = null;
  let token: RegExpExecArray | null;

  while ((token = tokenizer.exec(encoded))) {
    const operation = token[0];
    const valueIndex = Number.parseInt(encoded.slice(index, token.index)) || 0;

    if (rangeStart !== null) {
      for (; rangeStart < valueIndex; rangeStart++) {
        current[depth] = rangeStart;
        combinations.push([...current]);
      }
      rangeStart = null;
    }

    current[depth] = valueIndex;

    if (operation === "-") {
      rangeStart = valueIndex;
    } else if (operation === ":") {
      depth++;
    } else {
      if (operation === " " || (operation === "," && encoded[token.index - 1] !== ",")) {
        combinations.push([...current]);
      }
      if (operation === ",") {
        current.pop();
        depth--;
      }
    }

    index = tokenizer.lastIndex;
  }

  const finalIndex = encoded.match(/\d+$/)?.[0];
  if (finalIndex) {
    const valueIndex = Number.parseInt(finalIndex);
    if (rangeStart !== null) {
      for (; rangeStart <= valueIndex; rangeStart++) {
        current[depth] = rangeStart;
        combinations.push([...current]);
      }
    } else {
      current[depth] = valueIndex;
      combinations.push([...current]);
    }
  }

  return combinations;
}

export function encodedVariantSet(encodedVariantField: string | null | undefined): Set<string> {
  const combinations = new Set<string>();

  for (const combination of decodeEncodedVariant(encodedVariantField)) {
    for (let length = 1; length <= combination.length; length++) {
      combinations.add(combination.slice(0, length).join(","));
    }
  }

  return combinations;
}

export function allEncodedVariantsAvailable(
  encodedVariantExistence: string | null | undefined,
  encodedVariantAvailability: string | null | undefined,
): boolean {
  if (!encodedVariantExistence || !encodedVariantAvailability) return false;
  const existence = encodedVariantSet(encodedVariantExistence);
  const availability = encodedVariantSet(encodedVariantAvailability);
  return existence.size === availability.size && [...existence].every((c) => availability.has(c));
}
