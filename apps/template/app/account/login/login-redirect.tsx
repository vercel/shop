"use client";

import { useEffect } from "react";

import { signIn } from "@/lib/auth/client";

export function LoginRedirect() {
  useEffect(() => {
    signIn("/account");
  }, []);

  return <div data-storefront-canvas="account-login" />;
}
