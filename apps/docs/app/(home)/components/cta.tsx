import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CTAProps {
  cta: string;
  href: string;
  title: string;
}

export const CTA = ({ title, href, cta }: CTAProps) => (
  <section className="flex flex-col gap-4 border-y px-8 py-10 sm:border-x sm:px-12 md:flex-row md:items-center md:justify-between">
    <h2 className="font-sans font-semibold text-xl tracking-tight dark:text-white sm:text-2xl md:text-3xl lg:text-[40px]">
      {title}
    </h2>
    <Button asChild className="mt-2 h-10 w-fit rounded-full" size="default">
      <Link href={href}>{cta}</Link>
    </Button>
  </section>
);
