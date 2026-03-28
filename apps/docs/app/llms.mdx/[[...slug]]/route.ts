import { notFound } from "next/navigation";
import { docs } from "@/lib/fromsrc/content";

export const revalidate = false;

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const doc = await docs.getDoc(slug ?? []);

  if (!doc) {
    notFound();
  }

  const text = `# ${doc.title}\n\n${doc.description ?? ""}\n\n${doc.content}`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}

export async function generateStaticParams() {
  const allDocs = await docs.getAllDocs();
  return allDocs.map((doc) => ({
    slug: doc.slug ? doc.slug.split("/") : [],
  }));
}
