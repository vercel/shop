import { ArticleCard } from "@/components/blog/article-card";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import type { Blog } from "@/lib/blog/types";

export interface BlogIndexProps {
  blog: Blog;
}

export function BlogIndex({ blog }: BlogIndexProps) {
  return (
    <Page className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl">{blog.title}</h1>
          {blog.articles.length > 0 ? (
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {blog.articles.map((article) => (
                <ArticleCard article={article} key={article.handle} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No articles found.</p>
          )}
        </Sections>
      </Container>
    </Page>
  );
}

export function BlogIndexSkeleton() {
  return (
    <Page aria-busy="true" className="pt-2.5 md:pt-10">
      <Container>
        <Sections className="gap-5">
          <Skeleton className="h-9 w-1/2 sm:h-10 md:h-12" />
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div className="grid content-start gap-4" key={index}>
                <Skeleton className="aspect-3/2 w-full rounded-xl" />
                <div className="grid gap-2.5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Sections>
      </Container>
    </Page>
  );
}
