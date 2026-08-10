"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addToCart } from "@/lib/cart/client";
import type { OptimisticProductInfo } from "@/lib/product";
import { cn } from "@/lib/utils";

interface GiftCardPurchaseFormProps {
  merchandiseId: string;
  productInfo?: OptimisticProductInfo;
}

// Keys with the `__shopify_` prefix are recognized by Shopify to schedule and route gift card delivery.
function giftCardAttributes(recipient: {
  email: string;
  message?: string;
  name?: string;
  sendOn?: string;
  timezoneOffset?: number;
}): { key: string; value: string }[] {
  const attributes = [
    { key: "__shopify_send_gift_card_to_recipient", value: "true" },
    { key: "Recipient email", value: recipient.email },
  ];
  if (recipient.name) attributes.push({ key: "Recipient name", value: recipient.name });
  if (recipient.message) attributes.push({ key: "Message", value: recipient.message });
  if (recipient.sendOn) {
    attributes.push({ key: "Send on", value: recipient.sendOn });
    // Offset must reflect the buyer's browser, so it is captured client-side — never computed server-side (UTC).
    if (typeof recipient.timezoneOffset === "number" && Number.isFinite(recipient.timezoneOffset)) {
      attributes.push({ key: "__shopify_offset", value: String(recipient.timezoneOffset) });
    }
  }
  return attributes;
}

export function GiftCardPurchaseForm({ merchandiseId, productInfo }: GiftCardPurchaseFormProps) {
  const t = useTranslations("product.giftCard");
  const { setOverlayOpen, setWarnings } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [sendOnEnabled, setSendOnEnabled] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const sendOn = String(formData.get("sendOn") ?? "");
    const form = event.currentTarget;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("invalidEmail"));
      return;
    }

    const scheduled = sendOnEnabled && sendOn;
    if (scheduled) {
      const parsed = new Date(`${sendOn}T00:00:00`);
      if (Number.isNaN(parsed.getTime()) || parsed < new Date(new Date().toDateString())) {
        setError(t("invalidSendDate"));
        return;
      }
    }

    setWarnings([]);
    void addToCart(
      merchandiseId,
      1,
      productInfo,
      giftCardAttributes({
        email,
        message: message || undefined,
        name: name || undefined,
        sendOn: scheduled ? sendOn : undefined,
        // Captured in the browser so Shopify schedules delivery in the buyer's timezone, not the server's.
        timezoneOffset: scheduled ? new Date().getTimezoneOffset() : undefined,
      }),
    );

    form.reset();
    setSendOnEnabled(false);
    setOverlayOpen(true);
  }

  return (
    <form onSubmit={handleSubmit} className="group grid gap-5">
      <div data-slot="gift-card-fields" className="grid gap-2.5">
        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-email">{t("recipientEmail")}</Label>
          <Input
            id="gift-card-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("recipientEmailPlaceholder")}
          />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-name">{t("recipientName")}</Label>
          <Input
            id="gift-card-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t("recipientNamePlaceholder")}
          />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-message">{t("message")}</Label>
          <Textarea
            id="gift-card-message"
            name="message"
            rows={3}
            placeholder={t("messagePlaceholder")}
          />
        </div>

        <div className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2.5">
            <Label htmlFor="gift-card-send-later">{t("sendLater")}</Label>
            <Switch
              id="gift-card-send-later"
              checked={sendOnEnabled}
              onCheckedChange={setSendOnEnabled}
            />
          </div>
          {sendOnEnabled ? (
            <div className="grid gap-2.5">
              <Label htmlFor="gift-card-send-on">{t("sendOnLabel")}</Label>
              <Input id="gift-card-send-on" name="sendOn" type="date" required />
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className={cn(
          "h-12 w-full justify-center",
          "group-invalid:cursor-not-allowed group-invalid:opacity-50",
        )}
      >
        <span>{t("addToCart")}</span>
      </Button>
    </form>
  );
}
