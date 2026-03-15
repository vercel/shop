"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { cn } from "@/lib/utils";

type StepStatus = "completed" | "current" | "upcoming";

interface Step {
  label: string;
  status: StepStatus;
}

interface OrderProgressProps extends React.ComponentProps<"div"> {
  steps: Step[];
}

function OrderProgress({ steps, className, ...props }: OrderProgressProps) {
  return (
    <div
      data-slot="order-progress"
      className={cn("flex flex-row items-start", className)}
      {...props}
    >
      {steps.map((step, index) => (
        <OrderProgressStep
          key={step.label}
          label={step.label}
          status={step.status}
          isFirst={index === 0}
          isLast={index === steps.length - 1}
        />
      ))}
    </div>
  );
}

interface OrderProgressStepProps extends React.ComponentProps<"div"> {
  label: string;
  status: StepStatus;
  isFirst?: boolean;
  isLast?: boolean;
}

function OrderProgressStep({
  label,
  status,
  isFirst = false,
  isLast = false,
  className,
  ...props
}: OrderProgressStepProps) {
  return (
    <div
      data-slot="order-progress-step"
      data-status={status}
      className={cn("flex flex-col items-center gap-[11px]", className)}
      {...props}
    >
      {/* Connector row: leading line + dot + trailing line */}
      <div className="flex flex-row items-center">
        {/* Leading line */}
        {!isFirst && <OrderProgressLine status={status} position="leading" />}

        {/* Dot */}
        <OrderProgressDot status={status} />

        {/* Trailing line */}
        {!isLast && (
          <OrderProgressLine
            status={status === "completed" ? "completed" : "upcoming"}
            position="trailing"
          />
        )}
      </div>

      {/* Label */}
      <OrderProgressLabel status={status}>{label}</OrderProgressLabel>
    </div>
  );
}

interface OrderProgressDotProps extends React.ComponentProps<"div"> {
  status: StepStatus;
}

function OrderProgressDot({
  status,
  className,
  ...props
}: OrderProgressDotProps) {
  return (
    <div
      data-slot="order-progress-dot"
      data-status={status}
      className={cn(
        "rounded-full shrink-0",
        // Completed: filled blue dot
        "data-[status=completed]:size-[9px] data-[status=completed]:bg-[#2986ff]",
        // Current: filled black dot
        "data-[status=current]:size-[9px] data-[status=current]:bg-[#010101]",
        // Upcoming: larger gray dot with border effect
        "data-[status=upcoming]:size-[8px] data-[status=upcoming]:bg-[#cecece]",
        className,
      )}
      {...props}
    />
  );
}

interface OrderProgressLineProps extends React.ComponentProps<"div"> {
  status: StepStatus | "completed" | "upcoming";
  position: "leading" | "trailing";
}

function OrderProgressLine({
  status,
  className,
  ...props
}: OrderProgressLineProps) {
  // Completed lines are solid, upcoming lines are dashed
  const isCompleted = status === "completed";

  return (
    <div
      data-slot="order-progress-line"
      data-status={status}
      className={cn(
        "h-[4px] w-[60px]",
        isCompleted ? "bg-[#010101]" : "bg-[#e8e8e8]",
        // Dashed effect for upcoming using gradient
        !isCompleted &&
          "bg-[repeating-linear-gradient(90deg,#e8e8e8_0px,#e8e8e8_6px,transparent_6px,transparent_10px)]",
        className,
      )}
      {...props}
    />
  );
}

interface OrderProgressLabelProps extends React.ComponentProps<"span"> {
  status: StepStatus;
}

function OrderProgressLabel({
  status,
  className,
  children,
  ...props
}: OrderProgressLabelProps) {
  return (
    <span
      data-slot="order-progress-label"
      data-status={status}
      className={cn(
        "text-lg text-[#010101] whitespace-nowrap",
        // Completed/current: font-semibold, full opacity
        "data-[status=completed]:font-semibold",
        "data-[status=current]:font-semibold",
        // Upcoming: font-medium, reduced opacity
        "data-[status=upcoming]:font-medium data-[status=upcoming]:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

type FulfillmentStatus =
  | "received"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface OrderProgressComposedProps extends Omit<OrderProgressProps, "steps"> {
  currentStatus: FulfillmentStatus;
}

const DEFAULT_STEP_KEYS = [
  { key: "received", labelKey: "received" as const },
  { key: "shipped", labelKey: "shipped" as const },
  { key: "out_for_delivery", labelKey: "outForDelivery" as const },
  { key: "delivered", labelKey: "delivered" as const },
] as const;

const STATUS_ORDER: Record<FulfillmentStatus, number> = {
  received: 0,
  processing: 0, // Maps to same position as received
  shipped: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1, // Special case
};

function OrderProgressComposed({
  currentStatus,
  ...props
}: OrderProgressComposedProps) {
  const t = useTranslations("orders.progress");
  const currentIndex = STATUS_ORDER[currentStatus];

  // Handle cancelled - show all as upcoming
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

export {
  OrderProgress,
  OrderProgressStep,
  OrderProgressDot,
  OrderProgressLine,
  OrderProgressLabel,
  OrderProgressComposed,
  type Step,
  type StepStatus,
  type FulfillmentStatus,
};
