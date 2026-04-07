"use client";

import { isToolUIPart } from "ai";
import { BookmarkIcon } from "lucide-react";
import type { MyUIMessage } from "@/app/api/chat/types";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";

export function Metadata({
  parts,
  streaming,
}: {
  parts: MyUIMessage["parts"];
  streaming: boolean;
}) {
  const lastPart = parts
    .filter((part) => part.type === "text" || isToolUIPart(part))
    .at(-1);

  if (!lastPart) {
    return <Shimmer className="text-xs">Thinking...</Shimmer>;
  }

  const tool = isToolUIPart(lastPart) ? lastPart : null;
  const hasText = parts.some((part) => part.type === "text");

  const sources = Array.from(
    new Map(
      parts
        .filter((part) => part.type === "source-url")
        .map((part) => [part.url, part])
    ).values()
  );

  if (sources.length > 0 && !hasText && streaming) {
    return <Shimmer className="text-xs">Searching sources...</Shimmer>;
  }

  if (sources.length > 0 && !(tool && streaming)) {
    return (
      <Sources>
        <SourcesTrigger count={sources.length}>
          <BookmarkIcon className="size-4" />
          <p>Used {sources.length} sources</p>
        </SourcesTrigger>
        <SourcesContent>
          <ul className="flex flex-col gap-2">
            {sources.map((source) => (
              <li className="ml-4.5 list-disc pl-1" key={source.url}>
                <Source href={source.url} title={source.url}>
                  {source.title}
                </Source>
              </li>
            ))}
          </ul>
        </SourcesContent>
      </Sources>
    );
  }

  if (!tool && sources.length === 0) {
    return null;
  }

  return <div className="h-12" />;
}
