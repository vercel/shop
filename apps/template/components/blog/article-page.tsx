import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Prose } from "@/components/ui/prose";
import { Sections } from "@/components/ui/sections";
import type { BlogArticle } from "@/lib/types";

export interface ArticlePageProps {
  article: BlogArticle;
  locale: string;
}

export function ArticlePage({ article, locale }: ArticlePageProps) {
  const publishedAt = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(article.publishedAt),
  );

  return (
    <Page>
      <Container className="max-w-4xl">
        <Sections className="gap-5">
          <header className="grid gap-4 text-center">
            <Link
              className="justify-self-center text-muted-foreground text-sm hover:text-foreground"
              href={`/blogs/${article.blogHandle}`}
            >
              {article.blogTitle}
            </Link>
            <h1 className="text-3xl tracking-tight sm:text-4xl md:text-5xl">{article.title}</h1>
            <div className="flex flex-wrap justify-center gap-x-2 text-muted-foreground text-sm">
              {article.author && <span>{article.author}</span>}
              {article.author && <span aria-hidden>·</span>}
              <time dateTime={article.publishedAt}>{publishedAt}</time>
            </div>
          </header>
          {article.image && (
            <div className="relative aspect-3/2 overflow-hidden rounded-xl">
              <Image
                alt={article.image.altText}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                src={article.image.url}
              />
            </div>
          )}
          <Prose className="mx-auto w-full max-w-2xl">
            <div
              // oxlint-disable-next-line react/no-danger -- Shopify sanitizes article HTML.
              dangerouslySetInnerHTML={{ __html: article.body ?? "" }}
            />
          </Prose>
        </Sections>
      </Container>
    </Page>
  );
}
