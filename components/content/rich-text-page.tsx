import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Prose } from "@/components/ui/prose";

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
