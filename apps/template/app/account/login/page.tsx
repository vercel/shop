import { tNamespace } from "@/lib/i18n/server";

import { LoginRedirect } from "./login-client";

export default async function LoginPage() {
  const labels = await tNamespace("common");
  return (
    <LoginRedirect
      redirectingLabel={labels.loginRedirecting}
      notRedirectedLabel={labels.loginNotRedirected}
      clickHereLabel={labels.loginClickHere}
    />
  );
}
