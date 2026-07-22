"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addGiftCardAction } from "@/lib/cart/action";
import { cn } from "@/lib/utils";

interface GiftCardPurchaseFormProps {
  merchandiseId: string;
}

export function GiftCardPurchaseForm({ merchandiseId }: GiftCardPurchaseFormProps) {
  const t = useTranslations("product.giftCard");
  const { setCart, setOverlayOpen, setWarnings } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sendOnEnabled, setSendOnEnabled] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const message = String(formData.get("message") ?? "");
    const sendOn = String(formData.get("sendOn") ?? "");
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await addGiftCardAction({
        merchandiseId,
        recipient: {
          email,
          message: message || undefined,
          name: name || undefined,
          sendOn: sendOnEnabled && sendOn ? sendOn : undefined,
        },
      });

      if (!result.success) {
        setError(result.error ?? "Failed to add gift card to cart");
        return;
      }

      if (result.cart) setCart(result.cart);
      setWarnings(result.warnings ?? []);

      form.reset();
      setSendOnEnabled(false);
      setOverlayOpen(true);
      router.refresh();
    });
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

        <div className="grid gap-2.5">
          <div className="flex items-center justify-between gap-2.5 rounded-lg border p-3">
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
        disabled={isPending}
        className={cn(
          "h-12 w-full justify-center",
          "group-invalid:cursor-not-allowed group-invalid:opacity-50",
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>{t("addingToCart")}</span>
          </span>
        ) : (
          <span>{t("addToCart")}</span>
        )}
      </Button>
    </form>
  );
}
