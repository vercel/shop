import "server-only";
import { type Locale, type Namespace, type NamespaceMessages, type PluralForms } from ".";
import { getLocale } from "../params";
import en from "./messages/en.json";

const messageLoaders = {
  "en-US": () => en,
} as const satisfies Record<Locale, () => typeof en>;

const PLURAL_RE =
  /\{(\w+),\s*plural,\s*((?:\s*(?:zero|one|two|few|many|other)\s*\{[^{}]*\}\s*)+)\}/g;
const VAR_RE = /\{(\w+)\}/g;
const FORM_RE = /(zero|one|two|few|many|other)\s*\{([^{}]*)\}/g;
const WHOLE_PLURAL_RE =
  /^\{\w+,\s*plural,\s*(?:\s*(?:zero|one|two|few|many|other)\s*\{[^{}]*\}\s*)+\}$/;

function lookup(messages: typeof en, key: string): string | undefined {
  let cursor: unknown = messages;
  for (const part of key.split(".")) {
    if (cursor && typeof cursor === "object" && part in cursor) {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function format(
  template: string,
  params: Record<string, string | number> | undefined,
  locale: Locale,
): string {
  if (!params) return template;
  const rules = new Intl.PluralRules(locale);
  const withPlurals = template.replace(PLURAL_RE, (_match, varName, formsBlock) => {
    const count = Number(params[varName] ?? 0);
    const forms: Record<string, string> = {};
    for (const m of (formsBlock as string).matchAll(FORM_RE)) {
      forms[m[1]] = m[2];
    }
    const category = rules.select(count);
    const chosen = forms[category] ?? forms.other ?? "";
    return chosen.replace(/#/g, String(count));
  });
  return withPlurals.replace(VAR_RE, (_, n) => String(params[n] ?? ""));
}

function pluralToForms(s: string): PluralForms {
  const inner = s.match(/^\{\w+,\s*plural,\s*(.+)\}$/);
  const forms: PluralForms = {};
  if (!inner) return forms;
  for (const m of inner[1].matchAll(FORM_RE)) {
    forms[m[1] as Intl.LDMLPluralRule] = m[2];
  }
  return forms;
}

function resolveValue(value: unknown): unknown {
  if (typeof value === "string") {
    return WHOLE_PLURAL_RE.test(value) ? pluralToForms(value) : value;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveValue(v);
    return out;
  }
  return value;
}

export async function t(key: string, params?: Record<string, string | number>): Promise<string> {
  const locale = await getLocale();
  const messages = messageLoaders[locale]();
  const template = lookup(messages, key);
  if (template === undefined) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`i18n: missing key "${key}"`);
    }
    return key;
  }
  return format(template, params, locale);
}

export async function tNamespace<N extends Namespace>(ns: N): Promise<NamespaceMessages<N>> {
  const locale = await getLocale();
  const messages = messageLoaders[locale]();
  return resolveValue(messages[ns]) as NamespaceMessages<N>;
}
