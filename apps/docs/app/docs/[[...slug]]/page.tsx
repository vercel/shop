import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
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
    <article className="prose max-w-3xl px-8 py-12">
      <h1 className="mb-2 text-2xl font-bold">{doc.title}</h1>
      {doc.description ? (
        <p className="text-muted-foreground mb-8">{doc.description}</p>
      ) : null}
      <MDXRemote source={doc.content} components={mdxComponents} />
    </article>
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
