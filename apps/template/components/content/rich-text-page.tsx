import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Prose } from "@/components/ui/prose";
import { Skeleton } from "@/components/ui/skeleton";

interface RichTextPageProps {
  body: string;
  title: string;
}

export function RichTextPage({ body, title }: RichTextPageProps) {
  return (
    <Page>
      <Container className="max-w-2xl">
        <Prose>
          <h1>{title}</h1>
          <div
            // oxlint-disable-next-line react/no-danger -- Shopify sanitizes rich text stored in Pages and policies.
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </Prose>
      </Container>
    </Page>
  );
}

export function RichTextPageSkeleton() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <div aria-busy="true" className="grid gap-5">
          <Skeleton className="h-10 w-3/4" />
          <div className="grid gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Container>
    </Page>
  );
}
