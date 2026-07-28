import { initBotId } from "botid/client/core";

import { botIdProtectedRoutes, isBotIdEnabled } from "@/lib/botid";

if (isBotIdEnabled && botIdProtectedRoutes.length > 0) {
  initBotId({ protect: botIdProtectedRoutes });
}
