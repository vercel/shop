"use client";

import { cn } from "cn";
import { useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addGiftCardToCart } from "@/lib/cart/gift-card-client";
import type { OptimisticProductInfo } from "@/lib/product";

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
  const { setOverlayOpen } = useCartDrawer();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [sendOnEnabled, setSendOnEnabled] = useState(false);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const sendOn = String(formData.get("sendOn") ?? "");
    const form = event.currentTarget;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("A valid recipient email is required");
      return;
    }
    const scheduled = sendOnEnabled && sendOn;
    if (scheduled) {
      const parsed = new Date(`${sendOn}T00:00:00`);
      if (Number.isNaN(parsed.getTime()) || parsed < new Date(new Date().toDateString())) {
        setError("Send date must be today or later");
        return;
      }
    }
    setIsPending(true);
    try {
      const confirmation = addGiftCardToCart(
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
      setOverlayOpen(true);
      await confirmation;
      form.reset();
      setSendOnEnabled(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add the gift card. Please try again.",
      );
    } finally {
      setIsPending(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="group grid gap-5">
      <fieldset disabled={isPending} data-slot="gift-card-fields" className="grid gap-2.5">
        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-email">Recipient email</Label>
          <Input
            id="gift-card-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="friend@example.com"
          />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-name">Recipient name</Label>
          <Input
            id="gift-card-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Friend's name (optional)"
          />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-message">Message</Label>
          <Textarea
            id="gift-card-message"
            name="message"
            rows={3}
            placeholder="Write a personal note (optional)"
          />
        </div>

        <div className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2.5">
            <Label htmlFor="gift-card-send-later">Schedule for later</Label>
            <Switch
              id="gift-card-send-later"
              checked={sendOnEnabled}
              disabled={isPending}
              onCheckedChange={setSendOnEnabled}
            />
          </div>
          {sendOnEnabled ? (
            <div className="grid gap-2.5">
              <Label htmlFor="gift-card-send-on">Delivery date</Label>
              <Input id="gift-card-send-on" name="sendOn" type="date" required />
            </div>
          ) : null}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "h-12 w-full justify-center",
          "group-invalid:cursor-not-allowed group-invalid:opacity-50",
        )}
      >
        <span>{isPending ? "Adding…" : "Add to Cart"}</span>
      </Button>
    </form>
  );
}
