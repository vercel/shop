import { getTranslations } from "next-intl/server";
import Link from "next/link";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Breadcrumb as BreadcrumbUI,
} from "@/components/ui/breadcrumb";

export async function Breadcrumb({ title, handle }: { title: string; handle: string }) {
  const t = await getTranslations("product.breadcrumb");

  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{t("home")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/products/${handle}`}>{title}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </BreadcrumbUI>
  );
}
