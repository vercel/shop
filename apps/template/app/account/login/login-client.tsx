"use client";

import { useEffect } from "react";

import { signIn } from "@/lib/auth/client";

interface LoginRedirectProps {
  clickHereLabel: string;
  notRedirectedLabel: string;
  redirectingLabel: string;
}

export function LoginRedirect({
  clickHereLabel,
  notRedirectedLabel,
  redirectingLabel,
}: LoginRedirectProps) {
  useEffect(() => {
    signIn("/account");
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">{redirectingLabel}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {notRedirectedLabel}{" "}
          <button type="button" onClick={() => signIn("/account")} className="underline">
            {clickHereLabel}
          </button>
        </p>
      </div>
    </div>
  );
}
