"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/customer/action";
import type { CustomerProfile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const t = useTranslations("account");
  const [firstName, setFirstName] = useState(profile.firstName ?? "");
  const [lastName, setLastName] = useState(profile.lastName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfileAction({ firstName, lastName });
      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? null);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              setSaved(false);
            }}
            autoComplete="given-name"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
              setSaved(false);
            }}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" value={profile.email} disabled autoComplete="email" />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : t("save")}
        </Button>
        {saved ? (
          <span className="text-sm text-muted-foreground">{t("profileUpdated")}</span>
        ) : null}
      </div>
    </form>
  );
}
