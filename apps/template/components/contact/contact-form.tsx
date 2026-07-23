"use client";

import { CircleCheckIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ContactActionState, submitContactAction } from "@/lib/contact/action";

const INITIAL_STATE: ContactActionState = { success: false };

export function ContactForm() {
  const t = useTranslations("contact");
  const [state, formAction, isPending] = useActionState(submitContactAction, INITIAL_STATE);

  if (state.success) {
    return (
      <div role="status" className="grid max-w-xl gap-2.5 rounded-lg border p-5">
        <CircleCheckIcon className="size-5" aria-hidden="true" />
        <h2 className="text-lg font-medium">{t("successTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("successDescription")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid max-w-xl gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2.5">
          <Label htmlFor="contact-name">{t("name")}</Label>
          <Input
            autoComplete="name"
            id="contact-name"
            name="name"
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="contact-email">{t("email")}</Label>
          <Input
            autoComplete="email"
            id="contact-email"
            name="email"
            placeholder={t("emailPlaceholder")}
            required
            type="email"
          />
        </div>
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="contact-phone">{t("phone")}</Label>
        <Input
          autoComplete="tel"
          id="contact-phone"
          name="phone"
          placeholder={t("phonePlaceholder")}
          type="tel"
        />
      </div>

      <div className="grid gap-2.5">
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea
          id="contact-message"
          name="body"
          placeholder={t("messagePlaceholder")}
          required
          rows={8}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {t(state.error === "invalid" ? "invalidError" : "submitError")}
        </p>
      ) : null}

      <Button className="w-fit" disabled={isPending} type="submit">
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            {t("sending")}
          </>
        ) : (
          t("send")
        )}
      </Button>
    </form>
  );
}
