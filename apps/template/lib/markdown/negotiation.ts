const REPRESENTATIONS = ["text/html", "text/markdown"] as const;

type Representation = (typeof REPRESENTATIONS)[number];

interface AcceptEntry {
  position: number;
  quality: number;
  specificity: number;
  type: string;
}

export type NegotiatedRepresentation = Representation | null;

function matches(entry: AcceptEntry, representation: Representation): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*")) return representation.startsWith(entry.type.slice(0, -1));
  return entry.type === representation;
}

function parseAccept(header: string): AcceptEntry[] {
  return header
    .split(",")
    .map((value, position) => {
      const [type = "", ...parameters] = value
        .trim()
        .split(";")
        .map((part) => part.trim());
      let quality = 1;

      for (const parameter of parameters) {
        const [name, rawValue] = parameter.split("=").map((part) => part.trim());
        if (name?.toLowerCase() !== "q") continue;

        const parsed = Number(rawValue);
        quality = Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0;
      }

      const normalizedType = type.toLowerCase();
      const specificity = normalizedType === "*/*" ? 0 : normalizedType.endsWith("/*") ? 1 : 2;

      return { position, quality, specificity, type: normalizedType };
    })
    .filter(({ type }) => type.includes("/"));
}

export function negotiateRepresentation(accept: string | null): NegotiatedRepresentation {
  if (!accept) return "text/html";

  const entries = parseAccept(accept);
  if (entries.length === 0) return "text/html";

  let selection: { position: number; quality: number; representation: Representation } | null =
    null;

  for (const representation of REPRESENTATIONS) {
    let match: AcceptEntry | null = null;

    for (const entry of entries) {
      if (!matches(entry, representation)) continue;
      if (
        !match ||
        entry.specificity > match.specificity ||
        (entry.specificity === match.specificity && entry.position < match.position)
      ) {
        match = entry;
      }
    }

    if (!match || match.quality === 0) continue;
    if (
      !selection ||
      match.quality > selection.quality ||
      (match.quality === selection.quality && match.position < selection.position)
    ) {
      selection = {
        position: match.position,
        quality: match.quality,
        representation,
      };
    }
  }

  return selection?.representation ?? null;
}

export function appendVaryAccept(headers: Headers): void {
  const vary = headers.get("Vary");
  if (!vary) {
    headers.set("Vary", "Accept");
    return;
  }

  const values = vary.split(",").map((value) => value.trim().toLowerCase());
  if (!values.includes("accept")) headers.set("Vary", `${vary}, Accept`);
}
