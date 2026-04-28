import { permanentRedirect } from "next/navigation";

import { defaultLocale } from "@/lib/i18n";

export default function UnlocalizedRoot(): never {
  permanentRedirect(`/${defaultLocale}`);
}
