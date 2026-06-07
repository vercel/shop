import { Badge } from "@/components/ui/badge";
import { defaultLocale } from "@/lib/i18n";

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatOrderDate(iso: string, locale: string = defaultLocale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "FULFILLED" ? "default" : "secondary"}>
      {humanizeStatus(status)}
    </Badge>
  );
}
