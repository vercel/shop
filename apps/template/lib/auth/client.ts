"use client";

import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { CustomerSession } from "./server";

export const authClient = createAuthClient({
  plugins: [genericOAuthClient()],
});

export interface SessionState {
  loading: boolean;
  authenticated: boolean;
  customer: CustomerSession | null;
}

export function useSession(): SessionState {
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return { loading: true, authenticated: false, customer: null };
  }

  if (!data?.user) {
    return { loading: false, authenticated: false, customer: null };
  }

  const [firstName, ...lastParts] = (data.user.name || "").split(" ");

  return {
    loading: false,
    authenticated: true,
    customer: {
      customerId: data.user.id,
      email: data.user.email,
      firstName: firstName || undefined,
      lastName: lastParts.join(" ") || undefined,
    },
  };
}

export function signIn(callbackURL = "/account"): void {
  authClient.signIn.oauth2({ providerId: "shopify", callbackURL });
}

export async function signOut(): Promise<void> {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = "/";
      },
    },
  });
}
