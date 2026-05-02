import { extractHeadings } from "fromsrc";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MobileDocsBar } from "@/components/geistdocs/mobile-docs-bar";
import { docs } from "@/lib/fromsrc/content";
import { mdxComponents } from "@/lib/fromsrc/mdx-components";
import { getDocsNavSections } from "@/lib/fromsrc/nav-sections";
import { docsDescription, siteName } from "@/lib/site";
import { Outline } from "../outline";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

interface NavItem {
  slug: string;
  title: string;
}

function flatten(navigation: { items: Record<string, unknown>[] }[]): NavItem[] {
  const result: NavItem[] = [];
  for (const section of navigation) {
    for (const item of section.items) {
      if ("slug" in item && typeof item.slug === "string") {
        result.push({ slug: item.slug, title: String(item.title ?? "") });
      }
      if ("items" in item && Array.isArray(item.items)) {
        for (const child of item.items) {
          if ("slug" in child && typeof child.slug === "string") {
            result.push({ slug: child.slug, title: String(child.title ?? "") });
          }
        }
      }
    }
  }
  return result;
}

function neighbors(ordered: NavItem[], current: string) {
  const index = ordered.findIndex((d) => d.slug === current);
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const [doc, allDocs, navigation, navSections] = await Promise.all([
    docs.getDoc(slug ?? []),
    docs.getAllDocs(),
    docs.getNavigation(),
    getDocsNavSections(),
  ]);

  if (!doc) {
    notFound();
  }

  const headings = extractHeadings(doc.content).filter(
    (heading) => heading.level >= 2 && heading.level <= 3
  );

  const ordered = flatten(navigation as { items: Record<string, unknown>[] }[]);
  const fallback = allDocs.map((d) => ({ slug: d.slug, title: d.title }));
  const { prev, next } = neighbors(
    ordered.length > 0 ? ordered : fallback,
    doc.slug
  );

  return (
    <div>
      <MobileDocsBar headings={headings} navigation={navSections} />
      <div className="grid w-full max-w-7xl mx-auto lg:grid-cols-[minmax(0,1fr)_14rem]">
      <article className="min-w-0 px-6 py-8 pb-32 sm:px-8 sm:py-12 sm:pb-32 lg:px-12">
        <div className="max-w-[860px]">
          <header className="mb-10">
            <h1 className="font-sans text-3xl font-semibold tracking-tight">
              {doc.title}
            </h1>
            {doc.description && (
              <p className="mt-3 text-lg text-muted-foreground">{doc.description}</p>
            )}
          </header>
          <div className="prose dark:prose-invert">
            <MDXRemote
              source={doc.content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
            />
          </div>

          <nav className="mt-16 pt-6 border-t border-border flex justify-between gap-4">
            {prev ? (
              <Link
                href={prev.slug ? `/docs/${prev.slug}` : "/docs"}
                className="group flex items-center gap-3 py-3 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex-1"
              >
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-muted-foreground">Previous</div>
                  <div className="text-sm font-medium">{prev.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={next.slug ? `/docs/${next.slug}` : "/docs"}
                className="group flex items-center gap-3 py-3 px-4 rounded-xl border border-border hover:bg-muted/50 transition-colors flex-1 justify-end"
              >
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Next</div>
                  <div className="text-sm font-medium">{next.title}</div>
                </div>
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </div>
      </article>
      <Outline headings={headings} />
    </div>
    </div>
  );
}

export async function generateStaticParams() {
  const allDocs = await docs.getAllDocs();
  return allDocs.map((doc) => ({
    slug: doc.slug ? doc.slug.split("/") : [],
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await docs.getDoc(slug ?? []);

  if (!doc) {
    notFound();
  }

  const description = doc.description ?? docsDescription;
  const image = doc.slug ? `/og/${doc.slug}/image.png` : "/og/image.png";
  const url = doc.slug ? `/docs/${doc.slug}` : "/docs";

  return {
    title: doc.title,
    description,
    openGraph: {
      title: doc.title,
      description,
      siteName,
      type: "website",
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 628,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: doc.title,
      description,
      images: [image],
    },
  };
}
