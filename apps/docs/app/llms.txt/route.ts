import { docs } from "@/lib/fromsrc/content";

export const revalidate = false;

export async function GET() {
  const allDocs = await docs.getDocs();

  const lines = allDocs.map((doc) => {
    const url = doc.slug ? `/docs/${doc.slug}` : "/docs";
    return `# ${doc.title}\n\nURL: ${url}\n${doc.description ?? ""}\n\n${doc.content}\n\n---`;
  });

  return new Response(lines.join("\n\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
