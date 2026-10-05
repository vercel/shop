import { Badge } from "@/components/ui/badge";
import { shopConfig } from "@/lib/config";

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat(shopConfig.localization.locale, { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "FULFILLED" ? "default" : "secondary"}>
      {humanizeStatus(status)}
    </Badge>
  );
}
