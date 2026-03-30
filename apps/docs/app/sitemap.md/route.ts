import { docs } from "@/lib/fromsrc/content";

export const revalidate = false;

type PageNode = {
  title: string;
  description: string;
  url: string;
  children: PageNode[];
};

function buildTree(
  pages: Array<{ slug: string; title: string; description?: string }>
): PageNode[] {
  const root: PageNode[] = [];
  const map = new Map<string, PageNode>();

  const sorted = [...pages].sort((a, b) => {
    const urlA = a.slug ? `/docs/${a.slug}` : "/docs";
    const urlB = b.slug ? `/docs/${b.slug}` : "/docs";
    return urlA.localeCompare(urlB);
  });

  for (const page of sorted) {
    const url = page.slug ? `/docs/${page.slug}` : "/docs";
    const node: PageNode = {
      title: page.title,
      description: page.description ?? "",
      url,
      children: [],
    };
    map.set(url, node);

    const segments = url.split("/").filter(Boolean);
    if (segments.length <= 1) {
      root.push(node);
    } else {
      const parentUrl = `/${segments.slice(0, -1).join("/")}`;
      const parent = map.get(parentUrl);
      if (parent) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  }

  return root;
}

function renderNode(node: PageNode, indent: number): string {
  const prefix = "    ".repeat(indent);
  const lines: string[] = [];

  const summary = node.description
    ? `Summary: ${node.description}`
    : "";

  lines.push(
    `${prefix}- [${node.title}](${node.url})${summary ? ` | ${summary}` : ""}`
  );

  for (const child of node.children) {
    lines.push("");
    lines.push(renderNode(child, indent + 1));
  }

  return lines.join("\n");
}

export async function GET() {
  const allDocs = await docs.getAllDocs();
  const tree = buildTree(allDocs);

  const header = `# Documentation Sitemap

## Purpose

This file is a high-level semantic index of the documentation.

---

`;

  const body = tree.map((node) => renderNode(node, 0)).join("\n\n");

  return new Response(header + body, {
    headers: {
      "Content-Type": "text/markdown",
    },
  });
}
