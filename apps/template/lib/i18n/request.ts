import { getRequestConfig } from "next-intl/server";

import { getLocale } from "../params";
import { loadMessages } from "./translator";

// Resolve via getLocale() (next/root-params) rather than the callback's `{ locale }`
// arg: that arg comes from the x-next-intl-locale header, and reading request
// headers inside a cached tree forces dynamic rendering.
export default getRequestConfig(async () => {
  const locale = await getLocale();
  return { locale, messages: await loadMessages(locale) };
});
