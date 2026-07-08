"use client";

import { useEffect, useState } from "react";

interface AnnouncementBarClientProps {
  messages: string[];
}

const INTERVAL_MS = 5000;
const TRANSITION_MS = 500;

export function AnnouncementBarClient({ messages }: AnnouncementBarClientProps) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const count = messages.length;

  useEffect(() => {
    if (count < 2) return;

    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer ??= setInterval(() => {
        setAnimate(true);
        setIndex((current) => current + 1);
      }, INTERVAL_MS);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count]);

  useEffect(() => {
    if (index !== count) return;
    const id = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, TRANSITION_MS);
    return () => clearTimeout(id);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div className="relative h-full flex-1 overflow-hidden" data-slot="announcement-bar">
      <ul
        aria-live="polite"
        className="flex flex-col transition-transform duration-500 ease-in-out data-[animate=false]:transition-none"
        data-animate={animate}
        style={{ transform: `translateY(-${index * 2}rem)` }}
      >
        {[...messages, messages[0]].map((message, i) => (
          <li
            key={i}
            aria-hidden={i !== index}
            className="flex h-8 items-center truncate text-xs sm:text-sm"
          >
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}
