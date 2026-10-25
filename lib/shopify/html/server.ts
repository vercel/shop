import sanitizeHtml from "sanitize-html";

const EMBED_DOMAINS = ["vimeo.com", "youtube-nocookie.com", "youtube.com"];

const SHOPIFY_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedAttributes: {
    "*": ["style"],
    a: ["href", "name", "rel", "target", "title"],
    iframe: [
      "allow",
      "allowfullscreen",
      "height",
      "loading",
      "referrerpolicy",
      "src",
      "title",
      "width",
    ],
    img: ["alt", "height", "loading", "sizes", "src", "srcset", "title", "width"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
  },
  allowedIframeDomains: EMBED_DOMAINS,
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { iframe: ["https"] },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
      "text-align": [/^(center|end|justify|left|right|start)$/],
      "text-decoration": [/^(line-through|none|underline)$/],
    },
  },
  allowedTags: [...sanitizeHtml.defaults.allowedTags, "iframe", "img"],
  allowIframeRelativeUrls: false,
  // An iframe loses its src when the host is not allowlisted; drop it rather than render an empty frame.
  exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
  transformTags: {
    a: (tagName, attribs) => ({
      attribs: attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
      tagName,
    }),
  },
};

// Shopify returns rich text exactly as staff and apps wrote it, scripts and event handlers included.
export function sanitizeShopifyHtml(html: string): string {
  return sanitizeHtml(html, SHOPIFY_HTML_OPTIONS);
}
