"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Polls `url` every `intervalMs` and returns the latest JSON response,
 * starting from `initialData` (usually rendered server-side for a fast
 * first paint / SEO) so the page never shows a loading flash.
 */
export function usePolling<T>(url: string, initialData: T, intervalMs = 10_000): T {
  const [data, setData] = useState<T>(initialData);
  const urlRef = useRef(url);
  urlRef.current = url;

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(urlRef.current, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // transient network error — next tick will retry
      }
    }

    const interval = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return data;
}
