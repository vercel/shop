"use client";

import { useState } from "react";

import { Price } from "@/components/product/price";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Cart } from "@/lib/types";

interface OverlaySummaryProps {
  cart: Cart;
  locale: string;
}

export function OverlaySummary({ cart, locale }: OverlaySummaryProps) {
  const [isGift, setIsGift] = useState(false);

  const currencyCode = cart.cost.subtotalAmount.currencyCode;

  // Calculate totals from line items for accurate real-time display
  const itemCount = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.lines.reduce(
    (sum, line) => sum + parseFloat(line.cost.totalAmount.amount),
    0,
  );

  return (
    <Card className="overflow-hidden py-0 gap-0" aria-label="Order summary">
      <CardContent className="px-5 pt-5 pb-2.5 space-y-2.5">
        {/* Order Summary Title */}
        <h3 className="text-base font-semibold text-foreground">Order total</h3>

        {/* Price Lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items ({itemCount})</span>
            <Price
              amount={subtotal.toString()}
              currencyCode={currencyCode}
              locale={locale}
              className="text-foreground"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Tax</span>
            <Price
              amount={cart.cost.totalTaxAmount.amount}
              currencyCode={currencyCode}
              locale={locale}
              className="text-foreground"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2.5 bg-muted/30 px-5 py-2.5">
        {/* Gift Toggle */}
        <div className="flex items-center gap-2">
          <Switch id="gift-toggle" checked={isGift} onCheckedChange={setIsGift} />
          <Label htmlFor="gift-toggle" className="text-sm text-muted-foreground cursor-pointer">
            Is this a gift?
          </Label>
        </div>
      </CardFooter>
    </Card>
  );
}
