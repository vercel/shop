import { auth } from "./auth";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export { auth };

export interface CustomerSession {
  customerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface FullSession extends CustomerSession {
  accessToken: string;
}

const getAuthSession = cache(async () => {
  const reqHeaders = await headers();
  return auth.api.getSession({ headers: reqHeaders });
});

function mapCustomerSession(
  session: Awaited<ReturnType<typeof getAuthSession>>,
): CustomerSession | null {
  if (!session?.user) return null;

  const [firstName, ...lastParts] = (session.user.name || "").split(" ");

  return {
    customerId: session.user.id,
    email: session.user.email,
    firstName: firstName || undefined,
    lastName: lastParts.join(" ") || undefined,
  };
}

const getAccessToken = cache(async (): Promise<string> => {
  const session = await getAuthSession();
  if (!session?.user) return "";

  const reqHeaders = await headers();

  let accessToken = "";
  try {
    const tokenResponse = await auth.api.getAccessToken({
      headers: reqHeaders,
      body: { providerId: "shopify" },
    });
    accessToken = tokenResponse?.accessToken || "";
  } catch (error) {
    console.error("Failed to get access token:", error);
  }

  return accessToken;
});

export const getCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  const session = await getAuthSession();
  return mapCustomerSession(session);
});

export const getSession = cache(async (): Promise<FullSession | null> => {
  const session = await getCustomerSession();
  if (!session) return null;

  return {
    ...session,
    accessToken: await getAccessToken(),
  };
});

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");

  return session;
}

export async function requireSession(): Promise<FullSession> {
  const session = await getSession();
  if (!session) redirect("/account/login");
  return session;
}
