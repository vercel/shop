import { getTranslations } from "next-intl/server";

import { AccountPageHeader } from "@/components/account/page-header";
import { requireCustomerSession } from "@/lib/auth/server";

export default async function ProfilePage() {
  const [session, t] = await Promise.all([
    requireCustomerSession(),
    getTranslations("account"),
  ]);

  return (
    <>
      <AccountPageHeader title={t("profile")} description={t("profileDescription")} />
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("name")}</dt>
              <dd className="font-medium">
                {[session.firstName, session.lastName].filter(Boolean).join(" ") || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("email")}</dt>
              <dd className="font-medium">{session.email}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
