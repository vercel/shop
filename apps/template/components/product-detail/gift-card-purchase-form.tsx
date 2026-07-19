"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useCart } from "@/components/cart/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      event.currentTarget.reset();
      setSendOnEnabled(false);
      setOverlayOpen(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <div data-slot="gift-card-fields" className="grid gap-2.5">
        <div className="grid gap-1.5">
          <Label htmlFor="gift-card-email">{t("recipientEmail")}</Label>
          <Input
            id="gift-card-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("recipientEmailPlaceholder")}
            aria-invalid={!!error}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="gift-card-name">{t("recipientName")}</Label>
          <Input
            id="gift-card-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t("recipientNamePlaceholder")}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="gift-card-message">{t("message")}</Label>
          <Textarea
            id="gift-card-message"
            name="message"
            rows={3}
            placeholder={t("messagePlaceholder")}
          />
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSendOnEnabled((prev) => !prev)}
              className="cursor-pointer text-sm font-medium text-foreground"
              aria-pressed={sendOnEnabled}
            >
              {sendOnEnabled ? t("sendNow") : t("sendOn")}
            </button>
          </div>
          {sendOnEnabled ? (
            <div className="grid gap-1.5">
              <Label htmlFor="gift-card-send-on">{t("sendOnLabel")}</Label>
              <Input id="gift-card-send-on" name="sendOn" type="date" />
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className={cn("h-12 w-full justify-center")}>
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
