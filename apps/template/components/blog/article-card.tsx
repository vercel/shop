import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import type { BlogArticle } from "@/lib/types";

export interface ArticleCardProps {
  article: BlogArticle;
  locale: string;
}

export function ArticleCard({ article, locale }: ArticleCardProps) {
  const href = `/blogs/${article.blogHandle}/${article.handle}`;
  const publishedAt = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(article.publishedAt),
  );

  return (
    <article className="grid content-start gap-4">
      <Link className="relative aspect-3/2 overflow-hidden rounded-xl" href={href}>
        {article.image ? (
          <Image
            alt={article.image.altText}
            className="object-cover transition-transform duration-300 hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            src={article.image.url}
          />
        ) : (
          <ImagePlaceholder className="size-full bg-muted" />
        )}
      </Link>
      <div className="grid gap-2.5">
        <time className="text-muted-foreground text-sm" dateTime={article.publishedAt}>
          {publishedAt}
        </time>
        <h2 className="font-medium text-xl tracking-tight">
          <Link className="hover:underline" href={href}>
            {article.title}
          </Link>
        </h2>
        {article.excerpt && (
          <p className="text-muted-foreground text-sm leading-6 line-clamp-3">{article.excerpt}</p>
        )}
      </div>
    </article>
  );
}
