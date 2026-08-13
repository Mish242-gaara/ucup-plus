"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const trimmed = base64String.trim();
  const padding = "=".repeat((4 - (trimmed.length % 4)) % 4);
  const base64 = (trimmed + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(favoriteIds: number[]) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const supported =
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      setEnabled(Boolean(sub));
    });
  }, [supported]);

  const syncSubscription = useCallback(
    async (teamIds: number[]) => {
      if (!supported) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!sub) return;

        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, teamIds }),
        });
      } catch (err) {
        console.error("[push] échec de la synchronisation des favoris :", err);
      }
    },
    [supported]
  );

  useEffect(() => {
    if (enabled) syncSubscription(favoriteIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteIds.join(","), enabled]);

  const enable = useCallback(async () => {
    setError(null);

    if (!supported) {
      setError("Ton navigateur ne supporte pas les notifications push.");
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError(
        "Les notifications ne sont pas configurées côté serveur (clé VAPID absente). " +
          "Vérifie NEXT_PUBLIC_VAPID_PUBLIC_KEY dans .env, puis redémarre le serveur " +
          "(cette variable est figée au build, un simple enregistrement du fichier ne suffit pas)."
      );
      return;
    }

    setBusy(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setError(
          permissionResult === "denied"
            ? "Permission refusée. Autorise les notifications dans les réglages du navigateur pour ce site."
            : "Permission non accordée."
        );
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, teamIds: favoriteIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Le serveur a refusé l'abonnement (${res.status}).`);
      }

      setEnabled(true);
    } catch (err) {
      console.error("[push] échec de l'activation :", err);
      setError(err instanceof Error ? err.message : "Impossible d'activer les notifications.");
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }, [supported, favoriteIds]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch (err) {
      console.error("[push] échec de la désactivation :", err);
      setError(err instanceof Error ? err.message : "Impossible de désactiver les notifications.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, permission, enabled, busy, error, enable, disable };
}
