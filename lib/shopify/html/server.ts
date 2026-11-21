import { Parser } from "htmlparser2";

// Everything listed renders without running code or submitting data; unlisted markup such as srcdoc, formaction, and custom elements can.
const ALLOWED_TAGS = new Set([
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "br",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "font",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "i",
  "iframe",
  "img",
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "rb",
  "rp",
  "rt",
  "rtc",
  "ruby",
  "s",
  "samp",
  "section",
  "small",
  "source",
  "span",
  "strike",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "track",
  "tt",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "align",
  "allow",
  "allowfullscreen",
  "alt",
  "autoplay",
  "bgcolor",
  "border",
  "cellpadding",
  "cellspacing",
  "cite",
  "class",
  "color",
  "colspan",
  "controls",
  "crossorigin",
  "datetime",
  "decoding",
  "default",
  "dir",
  "download",
  "face",
  "frameborder",
  "headers",
  "height",
  "hidden",
  "href",
  "hreflang",
  "id",
  "kind",
  "label",
  "lang",
  "loading",
  "loop",
  "media",
  "muted",
  "open",
  "playsinline",
  "poster",
  "preload",
  "referrerpolicy",
  "rel",
  "reversed",
  "role",
  "rowspan",
  "sandbox",
  "scope",
  "size",
  "sizes",
  "span",
  "src",
  "srclang",
  "srcset",
  "start",
  "style",
  "target",
  "title",
  "type",
  "valign",
  "value",
  "width",
]);

const ARIA_ATTRIBUTE = /^aria-[a-z-]+$/;

// Kept when empty; an empty sandbox is the strictest one. Other empty attributes are dropped.
const EMPTY_ATTRIBUTES = new Set([
  "allowfullscreen",
  "alt",
  "autoplay",
  "controls",
  "crossorigin",
  "default",
  "download",
  "hidden",
  "loop",
  "muted",
  "open",
  "playsinline",
  "reversed",
  "sandbox",
]);

// htmlparser2 reads script, style, textarea, and xmp as raw text, so a discarded one takes its content with it.
const DISCARDED_WITH_CONTENT_TAGS = new Set(["option", "script", "style", "textarea", "xmp"]);

const SELF_CLOSING_TAGS = new Set(["br", "col", "hr", "img", "source", "track", "wbr"]);

const URL_ATTRIBUTES = new Set(["cite", "href", "poster", "src"]);

const DEFAULT_SCHEMES = ["http", "https", "mailto", "tel"];

const SCHEMES_BY_TAG: Record<string, string[]> = {
  iframe: ["https"],
  img: ["data", "http", "https"],
};

const SRCSET_WHITESPACE = /[\t\n\f\r ]/;

interface OpenElement {
  discarded: boolean;
  hasSrc: boolean;
  name: string;
  start: number;
}

function escapeText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Browsers ignore control characters, spaces, and comments when they read a URL's scheme.
function normalizeUrl(url: string): string {
  let compact = "";
  for (const char of url) if (char > " ") compact += char;
  let normalized = "";
  let position = 0;
  while (position < compact.length) {
    const open = compact.indexOf("<!--", position);
    const close = open === -1 ? -1 : compact.indexOf("-->", open + 4);
    if (close === -1) return normalized + compact.slice(position);
    normalized += compact.slice(position, open);
    position = close + 3;
  }
  return normalized;
}

function hasAllowedScheme(tag: string, url: string): boolean {
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(normalizeUrl(url))?.[1];
  return !scheme || (SCHEMES_BY_TAG[tag] ?? DEFAULT_SCHEMES).includes(scheme.toLowerCase());
}

function sanitizeSrcset(tag: string, srcset: string): string {
  const candidates: string[] = [];
  let position = 0;
  while (position < srcset.length) {
    if (SRCSET_WHITESPACE.test(srcset[position]!) || srcset[position] === ",") {
      position++;
      continue;
    }
    let end = position;
    while (end < srcset.length && !SRCSET_WHITESPACE.test(srcset[end]!)) end++;
    let urlEnd = end;
    while (srcset[urlEnd - 1] === ",") urlEnd--;
    const url = srcset.slice(position, urlEnd);
    let descriptors = "";
    if (urlEnd < end) {
      position = end;
    } else {
      const comma = srcset.indexOf(",", end);
      const stop = comma === -1 ? srcset.length : comma;
      descriptors = srcset.slice(end, stop).trim().split(/\s+/).join(" ");
      position = stop + 1;
    }
    if (hasAllowedScheme(tag, url)) candidates.push(descriptors ? `${url} ${descriptors}` : url);
  }
  return candidates.join(", ");
}

function sanitizeAttribute(tag: string, name: string, value: string): string | undefined {
  if (
    !ALLOWED_ATTRIBUTES.has(name) &&
    !ARIA_ATTRIBUTE.test(name) &&
    !(tag === "a" && name === "name")
  )
    return undefined;
  if (value === "") return EMPTY_ATTRIBUTES.has(name) ? "" : undefined;
  if (URL_ATTRIBUTES.has(name) && !hasAllowedScheme(tag, value)) return undefined;
  if (tag === "iframe" && name === "src" && !/^(https:|[/\\]{2})/i.test(normalizeUrl(value)))
    return undefined;
  if (name === "srcset") return sanitizeSrcset(tag, value) || undefined;
  return value;
}

// Shopify returns rich text exactly as staff and apps wrote it, scripts and event handlers included.
export function sanitizeShopifyHtml(html: string): string {
  let result = "";
  let skippedDepth = 0;
  const stack: OpenElement[] = [];

  const parser = new Parser({
    onclosetag(name) {
      if (skippedDepth > 0 && --skippedDepth > 0) return;
      const element = stack.at(-1);
      if (element?.name !== name) return;
      stack.pop();
      if (element.discarded || SELF_CLOSING_TAGS.has(name)) return;
      // An iframe loses its src unless it is an https URL; drop it rather than render an empty frame.
      if (name === "iframe" && !element.hasSrc) {
        result = result.slice(0, element.start);
        return;
      }
      result += `</${name}>`;
    },
    onopentag(name, attribs) {
      if (skippedDepth > 0) {
        skippedDepth++;
        return;
      }
      const element: OpenElement = {
        discarded: !ALLOWED_TAGS.has(name),
        hasSrc: false,
        name,
        start: result.length,
      };
      stack.push(element);
      if (element.discarded) {
        if (DISCARDED_WITH_CONTENT_TAGS.has(name)) skippedDepth = 1;
        return;
      }
      const attributes =
        name === "a" && attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs;
      result += `<${name}`;
      for (const [attribute, raw] of Object.entries(attributes)) {
        const value = sanitizeAttribute(name, attribute, raw);
        if (value === undefined) continue;
        if (attribute === "src") element.hasSrc = true;
        if (value !== "")
          result += ` ${attribute}="${escapeText(value).replaceAll('"', "&quot;")}"`;
        else result += attribute === "alt" ? ' alt=""' : ` ${attribute}`;
      }
      result += SELF_CLOSING_TAGS.has(name) ? " />" : ">";
    },
    ontext(text) {
      if (skippedDepth === 0) result += escapeText(text);
    },
  });
  parser.write(html);
  parser.end();
  return result;
}
