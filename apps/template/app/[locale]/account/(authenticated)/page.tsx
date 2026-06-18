import { redirect } from "next/navigation";

import { getLocale } from "@/lib/params";

export default async function AccountPage() {
  redirect(`/${await getLocale()}/account/profile`);
}
