import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function SignOutButton() {
  const t = await getTranslations("account");

  return (
    <form action="/account/logout?return_to=/" method="post">
      <Button className="w-full" size="sm" type="submit" variant="outline">
        {t("signOut")}
      </Button>
    </form>
  );
}
