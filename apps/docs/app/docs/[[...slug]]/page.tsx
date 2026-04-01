import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { Toc } from "fromsrc/client";
import { docs } from "@/lib/fromsrc/content";
import { mdxComponents } from "@/lib/fromsrc/mdx-components";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  const doc = await docs.getDoc(slug ?? []);

  if (!doc) {
    notFound();
  }

  return (
    <div className="relative flex flex-1">
      <article className="prose dark:prose-invert mx-auto max-w-5xl px-8 py-12">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight">{doc.title}</h1>
        {doc.description ? (
          <p className="text-muted-foreground mb-8">{doc.description}</p>
        ) : null}
        <MDXRemote
          source={doc.content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }}
        />
      </article>
      <aside className="hidden xl:block w-56 shrink-0">
        <div className="sticky top-12">
          <Toc title="" />
        </div>
      </aside>
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

  return {
    title: doc.title,
    description: doc.description,
  };
}
