"use client";

import { cn } from "cn";
import { useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { useProductForm } from "@/components/product-detail/product-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function GiftCardPurchaseForm() {
  const { formProps, pending, register, selectedVariant } = useProductForm();
  const { openOverlay } = useCartDrawer();
  const [error, setError] = useState<string | null>(null);
  const [sendOnEnabled, setSendOnEnabled] = useState(false);
  const isUnavailable = !selectedVariant?.availableForSale;

  return (
    <form
      {...formProps({
        beforeSubmit: (event) => {
          if (pending || isUnavailable) {
            event.preventDefault();
            return;
          }
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          const email = String(formData.get("attributes.Recipient email") ?? "").trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            event.preventDefault();
            setError("A valid recipient email is required");
            return;
          }
          if (sendOnEnabled) {
            const sendOn = String(formData.get("attributes.Send on") ?? "");
            const parsed = new Date(`${sendOn}T00:00:00`);
            if (Number.isNaN(parsed.getTime()) || parsed < new Date(new Date().toDateString())) {
              event.preventDefault();
              setError("Send date must be today or later");
              return;
            }
            // Capture the browser offset at submission, not during server rendering.
            const offset = form.elements.namedItem("attributes.__shopify_offset");
            if (offset instanceof HTMLInputElement) {
              offset.value = String(new Date().getTimezoneOffset());
            }
          }
          for (const key of ["Recipient email", "Recipient name", "Message"]) {
            const input = form.elements.namedItem(`attributes.${key}`);
            if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
              input.value = input.value.trim();
            }
          }
          openOverlay();
        },
      })}
      className="group grid gap-5"
    >
      <input type="hidden" {...register("merchandiseId", {})} />
      <input type="hidden" {...register("quantity", { value: 1 })} />
      <input
        type="hidden"
        {...register("attributeValue", {
          key: "__shopify_send_gift_card_to_recipient",
          value: "true",
        })}
      />
      <input
        type="hidden"
        disabled={!sendOnEnabled}
        {...register("attributeValue", { defaultValue: "", key: "__shopify_offset" })}
      />
      <fieldset disabled={pending} data-slot="gift-card-fields" className="grid gap-2.5">
        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-email">Recipient email</Label>
          <Input
            id="gift-card-email"
            {...register("attributeValue", { defaultValue: "", key: "Recipient email" })}
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
            {...register("attributeValue", { defaultValue: "", key: "Recipient name" })}
            type="text"
            autoComplete="name"
            placeholder="Friend's name (optional)"
          />
        </div>

        <div className="grid gap-2.5">
          <Label htmlFor="gift-card-message">Message</Label>
          <Textarea
            id="gift-card-message"
            {...register("attributeValue", { defaultValue: "", key: "Message" })}
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
              disabled={pending}
              onCheckedChange={setSendOnEnabled}
            />
          </div>
          {sendOnEnabled ? (
            <div className="grid gap-2.5">
              <Label htmlFor="gift-card-send-on">Delivery date</Label>
              <Input
                id="gift-card-send-on"
                {...register("attributeValue", { defaultValue: "", key: "Send on" })}
                type="date"
                required
              />
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
        {...register("addToCart", {})}
        data-selection-unresolved={!selectedVariant && !pending}
        disabled={pending || isUnavailable}
        className={cn(
          "h-12 w-full justify-center group-valid:data-[selection-unresolved=true]:disabled:opacity-100",
          "group-invalid:cursor-not-allowed group-invalid:opacity-50",
        )}
      >
        <span>{pending ? "Adding…" : "Add to Cart"}</span>
      </Button>
    </form>
  );
}
