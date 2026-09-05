import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";

export default function NotFoundError() {
  return (
    <Page className="flex flex-1 flex-col">
      <Container className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center text-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">Page Not Found</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            The link may be incorrect, or the page has been removed.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </Container>
    </Page>
  );
}
