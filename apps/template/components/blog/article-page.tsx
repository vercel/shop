import Image from "next/image";

import { Container } from "@/components/ui/container";
import Link from "@/components/ui/link";
import { Page } from "@/components/ui/page";
import { Prose } from "@/components/ui/prose";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlogArticle } from "@/lib/blog/types";
import { shopConfig } from "@/lib/config";

export interface ArticlePageProps {
  article: BlogArticle;
}

export function ArticlePageSkeleton() {
  return (
    <Page aria-busy="true">
      <Container className="max-w-4xl">
        <Sections className="gap-5">
          <div className="grid justify-items-center gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-3/4 sm:h-10 md:h-12" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="aspect-3/2 w-full rounded-xl" />
          <div className="mx-auto grid w-full max-w-2xl gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </Sections>
      </Container>
    </Page>
  );
}

export function ArticlePage({ article }: ArticlePageProps) {
  const publishedAt = new Intl.DateTimeFormat(shopConfig.localization.locale, {
    dateStyle: "long",
  }).format(new Date(article.publishedAt));
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
