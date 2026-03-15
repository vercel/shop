"use client";

import { useTranslations } from "next-intl";
import {
  OrderProgress,
  type FulfillmentStatus,
  type Step,
  type StepStatus,
} from "./order-progress";

interface OrderProgressComposedProps {
  currentStatus: FulfillmentStatus;
  className?: string;
}

const DEFAULT_STEP_KEYS = [
  { key: "received", labelKey: "received" as const },
  { key: "shipped", labelKey: "shipped" as const },
  { key: "out_for_delivery", labelKey: "outForDelivery" as const },
  { key: "delivered", labelKey: "delivered" as const },
] as const;

const STATUS_ORDER: Record<FulfillmentStatus, number> = {
  received: 0,
  processing: 0,
  shipped: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

export function OrderProgressComposed({
  currentStatus,
  ...props
}: OrderProgressComposedProps) {
  const t = useTranslations("orders.progress");
  const currentIndex = STATUS_ORDER[currentStatus];

  if (currentStatus === "cancelled") {
    const steps: Step[] = DEFAULT_STEP_KEYS.map((step) => ({
      label: t(step.labelKey),
      status: "upcoming" as const,
    }));
    return <OrderProgress steps={steps} {...props} />;
  }

  const steps: Step[] = DEFAULT_STEP_KEYS.map((step, index) => {
    let status: StepStatus;
    if (index < currentIndex) {
      status = "completed";
    } else if (index === currentIndex) {
      status = "current";
    } else {
      status = "upcoming";
    }
    return { label: t(step.labelKey), status };
  });

  return <OrderProgress steps={steps} {...props} />;
}
