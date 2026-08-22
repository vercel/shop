interface ImagePlaceholder {
  blurDataURL: string;
  height: number;
  width: number;
}

export type ImagePlaceholders = Map<string, ImagePlaceholder>;

const ALLOWED_DATA_URL_PREFIXES = [
  "data:image/avif;base64,",
  "data:image/jpeg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isAllowedDataURL(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const prefix = ALLOWED_DATA_URL_PREFIXES.find((candidate) => value.startsWith(candidate));
  return prefix !== undefined && value.length > prefix.length;
}

export function parseImagePlaceholders(value: unknown): ImagePlaceholders {
  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return new Map();
    }
  }

  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.images)) {
    return new Map();
  }

  const placeholders: ImagePlaceholders = new Map();

  for (const [mediaId, candidate] of Object.entries(parsed.images)) {
    if (
      !isRecord(candidate) ||
      !isAllowedDataURL(candidate.blurDataURL) ||
      !isPositiveFiniteNumber(candidate.height) ||
      !isPositiveFiniteNumber(candidate.width)
    ) {
      continue;
    }

    placeholders.set(mediaId, {
      blurDataURL: candidate.blurDataURL,
      height: candidate.height,
      width: candidate.width,
    });
  }

  return placeholders;
}
