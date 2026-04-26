"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

interface SignOutButtonProps {
  signOutLabel: string;
}

export function SignOutButton({ signOutLabel }: SignOutButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={() => signOut()}>
      {signOutLabel}
    </Button>
  );
}
