import { getRequestConfig } from "next-intl/server";

import { defaultLocale } from ".";
import { getLocale } from "../params";

// Widened message shape so per-locale catalogs (which lack the generated literal
// declaration that en.json has) satisfy a single loader type. Type-safe `t()`
// keys still come from the createMessagesDeclaration build of en.json.
type Messages = { [key: string]: Messages | string };

const messageLoaders: Record<string, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en.json"),
  fr: () => import("./messages/fr.json"),
};

// Resolve via getLocale() (next/root-params) rather than the callback's `{ locale }`
// arg: that arg comes from the x-next-intl-locale header, and reading request
// headers inside a cached tree forces dynamic rendering. Messages key on the
// language subtag, falling back to the default language until others ship.
export default getRequestConfig(async () => {
  const locale = await getLocale();
  const language = locale.split("-")[0];
  const loader = messageLoaders[language] ?? messageLoaders[defaultLocale.split("-")[0]];
  const messages = (await loader()).default;

  return { locale, messages };
});
