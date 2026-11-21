import { Badge } from "@/components/ui/badge";

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "FULFILLED" ? "default" : "secondary"}>
      {humanizeStatus(status)}
    </Badge>
  );
}
