import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type StepStatus = "completed" | "current" | "upcoming";

interface Step {
  label: string;
  status: StepStatus;
}

interface OrderProgressProps extends ComponentProps<"div"> {
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

interface OrderProgressStepProps extends ComponentProps<"div"> {
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

interface OrderProgressDotProps extends ComponentProps<"div"> {
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
        "data-[status=completed]:size-[9px] data-[status=completed]:bg-primary",
        // Current: filled black dot
        "data-[status=current]:size-[9px] data-[status=current]:bg-foreground",
        // Upcoming: larger gray dot with border effect
        "data-[status=upcoming]:size-[8px] data-[status=upcoming]:bg-border",
        className,
      )}
      {...props}
    />
  );
}

interface OrderProgressLineProps extends ComponentProps<"div"> {
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
        isCompleted ? "bg-foreground" : "bg-muted",
        // Dashed effect for upcoming using gradient
        !isCompleted &&
          "bg-[repeating-linear-gradient(90deg,var(--color-muted)_0px,var(--color-muted)_6px,transparent_6px,transparent_10px)]",
        className,
      )}
      {...props}
    />
  );
}

interface OrderProgressLabelProps extends ComponentProps<"span"> {
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
        "text-lg text-foreground whitespace-nowrap",
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

export {
  OrderProgress,
  OrderProgressStep,
  OrderProgressDot,
  OrderProgressLine,
  OrderProgressLabel,
  type Step,
  type StepStatus,
  type FulfillmentStatus,
};
