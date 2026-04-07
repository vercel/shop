"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  title: string;
  description?: string;
  slug: string;
  snippet?: string;
  anchor?: string;
  heading?: string;
  score: number;
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, { signal: controller.signal });
        const data = await res.json();
        setResults(data);
        setSelected(0);
      } catch {}
      setLoading(false);
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const navigate = useCallback((result: SearchResult) => {
    const path = result.slug ? `/docs/${result.slug}` : "/docs";
    const url = result.anchor ? `${path}#${result.anchor}` : path;
    router.push(url);
    setOpen(false);
  }, [router]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  }, [results, selected, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] font-sans" onKeyDown={onKeyDown}>
      <button
        type="button"
        className="fixed inset-0 bg-background/80 backdrop-blur-sm cursor-default"
        onClick={() => setOpen(false)}
        aria-label="Close search"
      />
      <div className="relative z-10 max-w-[640px] mx-auto" style={{ marginTop: "calc(50vh - 250px)" }}>
        <div className="bg-sidebar border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 py-4 bg-transparent text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="px-2 py-1 text-xs text-muted-foreground bg-background border border-border rounded-md font-mono">
              ESC
            </kbd>
          </div>
          {query.trim() && (
            <div className="max-h-[460px] overflow-y-auto p-1">
              {loading && results.length === 0 ? null : results.length === 0 ? null : (
                results.map((result, i) => (
                  <button
                    key={`${result.slug}-${result.anchor}-${i}`}
                    type="button"
                    onClick={() => navigate(result)}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                      i === selected ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">{result.title}</div>
                    {result.heading && (
                      <div className="text-xs text-muted-foreground mt-0.5 ps-3 border-l border-border">
                        {result.heading}
                      </div>
                    )}
                    {result.snippet && (
                      <div className="text-xs text-muted-foreground mt-0.5 ps-3 border-l border-border truncate">
                        {result.snippet}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
