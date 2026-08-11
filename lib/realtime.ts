import PusherServer from "pusher";

let client: PusherServer | null | undefined;

function getPusher(): PusherServer | null {
  if (client !== undefined) return client;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    client = null; // real-time push disabled — callers fall back to their poll interval
    return client;
  }

  client = new PusherServer({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return client;
}

/** Fire-and-forget: tells subscribers "something changed, go re-fetch" — payloads stay tiny and the REST API remains the single source of truth. */
async function notify(channel: string) {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(channel, "update", {});
  } catch {
    // Never let a Pusher hiccup break the underlying admin action.
  }
}

export const notifyMatchUpdate = (matchId: number) =>
  Promise.all([notify(`match-${matchId}`), notify("matches")]);

export const notifyStandingsUpdate = () => notify("standings");

export const notifyPlayersUpdate = () => notify("players");
