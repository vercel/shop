import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment, type ReactNode } from "react";

import Link from "next/link";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface AccountPageHeaderProps {
  breadcrumbs: BreadcrumbEntry[];
  title: string;
  /** Content rendered inline after the heading (e.g., order name) */
  titleSuffix?: ReactNode;
  /** Content rendered below the heading (e.g., filters) */
  actions?: ReactNode;
}

export function AccountPageHeader({
  breadcrumbs,
  title,
  titleSuffix,
  actions,
}: AccountPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-start gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {titleSuffix}
        </div>
        {actions}
      </div>
    </div>
  );
}
