"use client";

import { cn } from "cn";
import { useState } from "react";

import { useCartDrawer } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useProductForm } from "@/lib/product/client";

export function GiftCardPurchaseForm() {
  const { formProps, pending, register, selectedVariant } = useProductForm();
  const { openOverlay } = useCartDrawer();
  const [minimumSendDate, setMinimumSendDate] = useState("");
  const sendOnEnabled = Boolean(minimumSendDate);
  const isUnavailable = !selectedVariant?.availableForSale;

  return (
    <form
      {...formProps({
        beforeSubmit: (event) => {
          if (pending || isUnavailable) {
            event.preventDefault();
            return;
          }
          if (sendOnEnabled) {
            // Capture the browser offset at submission, not during server rendering.
            const offset = event.currentTarget.elements.namedItem("attributes.__shopify_offset");
            if (offset instanceof HTMLInputElement) {
              offset.value = String(new Date().getTimezoneOffset());
            }
          }
          openOverlay();
        },
      })}
      className="group grid gap-5"
      onReset={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        setMinimumSendDate("");
      }}
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
          <div className="flex items-center justify-between gap-2.5">
            <Label htmlFor="gift-card-email">Recipient email</Label>
            <Button className="h-auto p-0 text-xs" disabled={pending} type="reset" variant="link">
              Clear recipient details
            </Button>
          </div>
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
              onCheckedChange={(checked) => {
                const today = new Date();
                setMinimumSendDate(
                  checked
                    ? [
                        today.getFullYear(),
                        String(today.getMonth() + 1).padStart(2, "0"),
                        String(today.getDate()).padStart(2, "0"),
                      ].join("-")
                    : "",
                );
              }}
            />
          </div>
          {sendOnEnabled ? (
            <div className="grid gap-2.5">
              <Label htmlFor="gift-card-send-on">Delivery date</Label>
              <Input
                id="gift-card-send-on"
                {...register("attributeValue", { defaultValue: "", key: "Send on" })}
                type="date"
                min={minimumSendDate}
                required
              />
            </div>
          ) : null}
        </div>
      </fieldset>

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
