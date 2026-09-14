import { createTranslator, type Messages, type NamespaceKeys, type NestedKeyOf } from "next-intl";

import { defaultLocale, type Locale } from ".";

// Widened message shape so per-locale catalogs (which lack the generated literal
// declaration that en.json has) satisfy a single loader type. Type-safe `t()`
// keys still come from the createMessagesDeclaration build of en.json.
type MessageCatalog = { [key: string]: MessageCatalog | string };

const messageLoaders: Record<string, () => Promise<{ default: MessageCatalog }>> = {
  en: () => import("./messages/en.json"),
  fr: () => import("./messages/fr.json"),
};

// Messages key on the language subtag, falling back to the default language until others ship.
export async function loadMessages(locale: Locale): Promise<Messages> {
  const language = locale.split("-")[0];
  const loader = messageLoaders[language] ?? messageLoaders[defaultLocale.split("-")[0]];
  return (await loader()).default as unknown as Messages;
}

// Translator for code that already knows its locale and has no request scope, such as Route Handlers.
export async function getTranslator<
  NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
>(locale: Locale, namespace?: NestedKey) {
  return createTranslator({ locale, messages: await loadMessages(locale), namespace });
}
