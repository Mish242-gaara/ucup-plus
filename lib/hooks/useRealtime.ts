"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fetches `url`, then stays in sync via a Pusher channel event named
 * "update" — falling back to a slow poll (`fallbackIntervalMs`, default
 * 45s) so the page still self-heals if a push is ever missed or Pusher
 * isn't configured at all.
 *
 * Refetches immediately whenever `url` itself changes (e.g. switching
 * between /matches?filter=live and ?filter=finished client-side) — without
 * this, a component that doesn't unmount on navigation (same route, only
 * searchParams differ) would keep showing whatever it last fetched until
 * the next poll tick, which looked like the page being "stuck" until a
 * manual refresh.
 */
export function useRealtime<T>(
  url: string,
  initialData: T,
  channelName: string,
  fallbackIntervalMs = 45_000
): T {
  const [data, setData] = useState<T>(initialData);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchNow = useCallback(async () => {
    try {
      const res = await fetch(urlRef.current, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
    } catch {
      // transient network error — next tick/event will retry
    }
  }, []);

  // Refetch immediately whenever the URL changes.
  useEffect(() => {
    fetchNow();
  }, [url, fetchNow]);

  // Subscribe to push updates + keep a slow fallback poll running,
  // independent of URL changes (no need to resubscribe on every filter switch).
  useEffect(() => {
    let localPusher: any = null;
    let channel: any = null;

    const setup = async () => {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      if (!key || !cluster) return;

      try {
        const PusherMod = await import("pusher-js");
        const Pusher = PusherMod && (PusherMod.default ?? PusherMod);
        localPusher = new Pusher(key, { cluster });
        channel = localPusher.subscribe(channelName);
        channel.bind("update", fetchNow);
      } catch {
        // If dynamic import or setup fails, ignore and rely on polling fallback.
      }
    };

    setup();

    const interval = setInterval(fetchNow, fallbackIntervalMs);

    return () => {
      clearInterval(interval);
      try {
        if (channel) {
          channel.unbind("update", fetchNow);
        }
        if (localPusher) {
          localPusher.unsubscribe(channelName);
        }
      } catch {
        // swallow errors during cleanup
      }
    };
  }, [channelName, fallbackIntervalMs, fetchNow]);

  return data;
}
