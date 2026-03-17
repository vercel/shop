import type { CmsRichTextNode, ContentSection } from "@/lib/types";

import Image from "next/image";

interface RichTextSectionProps {
  section: ContentSection;
}

export function RichTextSection({ section }: RichTextSectionProps) {
  const { title, content, settings } = section;

  if (!content) return null;

  const isSplitIntro = settings.layout === "split-intro";

  if (isSplitIntro) {
    return (
      <section className="py-10">
        <div className="border-t border-border/40 pt-8">
          <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
            {title && (
              <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
            )}
            <div className="max-w-2xl text-base leading-7 text-muted-foreground [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_p:not(:last-child)]:mb-4">
              <RichTextRenderer node={content} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-6 text-3xl font-semibold tracking-tight">
            {title}
          </h2>
        )}
        <div className="prose prose-lg max-w-none">
          <RichTextRenderer node={content} />
        </div>
      </div>
    </section>
  );
}

interface RichTextRendererProps {
  node: CmsRichTextNode;
}

function getRichTextNodeSignature(node: CmsRichTextNode): string {
  return JSON.stringify({
    code: node.code ?? false,
    data: node.data ?? null,
    level: node.level ?? null,
    listType: node.listType ?? null,
    marks: node.marks ?? null,
    nodeType: node.nodeType ?? null,
    type: node.type ?? null,
    url: node.url ?? null,
    value: node.value ?? null,
  });
}

function renderText(node: CmsRichTextNode) {
  let element = <>{node.value ?? ""}</>;
  const marks = node.marks ?? [];

  const isBold = node.bold || marks.some((mark) => mark.type === "bold");
  const isItalic = node.italic || marks.some((mark) => mark.type === "italic");
  const isUnderline =
    node.underline || marks.some((mark) => mark.type === "underline");
  const isCode = node.code || marks.some((mark) => mark.type === "code");

  if (isCode) {
    element = <code>{element}</code>;
  }
  if (isUnderline) {
    element = <u>{element}</u>;
  }
  if (isItalic) {
    element = <em>{element}</em>;
  }
  if (isBold) {
    element = <strong>{element}</strong>;
  }

  return element;
}

function resolveImage(node: CmsRichTextNode) {
  const data = node.data ?? {};
  const image = (data as { image?: Record<string, unknown> }).image;
  const url =
    (node as { url?: string }).url ||
    (node as { src?: string }).src ||
    (image as { url?: string })?.url ||
    (data as { url?: string }).url ||
    (data as { src?: string }).src;
  const width =
    (node as { width?: number }).width ||
    (image as { width?: number })?.width ||
    (data as { width?: number }).width;
  const height =
    (node as { height?: number }).height ||
    (image as { height?: number })?.height ||
    (data as { height?: number }).height;
  const alt =
    (node as { alt?: string }).alt ||
    (image as { altText?: string; alt?: string })?.altText ||
    (image as { altText?: string; alt?: string })?.alt ||
    (data as { altText?: string; alt?: string }).altText ||
    (data as { altText?: string; alt?: string }).alt;

  if (!url || !width || !height) return null;

  return {
    url,
    width,
    height,
    alt: alt ?? "",
  };
}

function RichTextRenderer({ node }: RichTextRendererProps) {
  const nodeType = node.type ?? node.nodeType ?? "text";
  const seenChildKeys = new Map<string, number>();
  const children = (node.children ?? node.content ?? []).map((child) => {
    const signature = getRichTextNodeSignature(child);
    const occurrence = seenChildKeys.get(signature) ?? 0;
    seenChildKeys.set(signature, occurrence + 1);

    return <RichTextRenderer key={`${signature}-${occurrence}`} node={child} />;
  });

  switch (nodeType) {
    case "root":
    case "document":
      return <>{children}</>;
    case "paragraph":
      return <p>{children}</p>;
    case "heading": {
      const level = node.level ?? 2;
      switch (level) {
        case 1:
          return <h1>{children}</h1>;
        case 2:
          return <h2>{children}</h2>;
        case 3:
          return <h3>{children}</h3>;
        case 4:
          return <h4>{children}</h4>;
        case 5:
          return <h5>{children}</h5>;
        default:
          return <h6>{children}</h6>;
      }
    }
    case "heading-1":
      return <h1>{children}</h1>;
    case "heading-2":
      return <h2>{children}</h2>;
    case "heading-3":
      return <h3>{children}</h3>;
    case "heading-4":
      return <h4>{children}</h4>;
    case "heading-5":
      return <h5>{children}</h5>;
    case "heading-6":
      return <h6>{children}</h6>;
    case "unordered-list":
    case "bullet-list":
      return <ul>{children}</ul>;
    case "ordered-list":
      return <ol>{children}</ol>;
    case "list":
      return node.listType === "ordered" ? (
        <ol>{children}</ol>
      ) : (
        <ul>{children}</ul>
      );
    case "list-item":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "hr":
      return <hr />;
    case "line-break":
      return <br />;
    case "image":
    case "embedded-asset-block": {
      const image = resolveImage(node);
      if (!image) return null;
      return (
        <figure className="my-6">
          <Image
            src={image.url}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="rounded-lg"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </figure>
      );
    }
    case "link":
    case "hyperlink": {
      const href = node.url || (node.data?.uri as string | undefined);
      if (!href) return <>{children}</>;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    case "text":
      return renderText(node);
    default:
      return <>{children}</>;
  }
}
