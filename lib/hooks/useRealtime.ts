"use client";

import { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

let sharedPusher: Pusher | null | undefined;

function getPusherClient(): Pusher | null {
  if (sharedPusher !== undefined) return sharedPusher;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    sharedPusher = null;
    return sharedPusher;
  }

  sharedPusher = new Pusher(key, { cluster });
  return sharedPusher;
}

/**
 * Fetches `url` once for the initial paint, then stays in sync via a Pusher
 * channel event named "update" — falling back to a slow poll
 * (`fallbackIntervalMs`, default 45s) so the page still self-heals if a
 * push is ever missed or Pusher isn't configured at all.
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

  useEffect(() => {
    let cancelled = false;

    async function fetchNow() {
      try {
        const res = await fetch(urlRef.current, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // transient network error — next tick/event will retry
      }
    }

    const pusher = getPusherClient();
    const channel = pusher?.subscribe(channelName);
    channel?.bind("update", fetchNow);

    const interval = setInterval(fetchNow, fallbackIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (pusher && channel) {
        channel.unbind("update", fetchNow);
        pusher.unsubscribe(channelName);
      }
    };
  }, [channelName, fallbackIntervalMs]);

  return data;
}
