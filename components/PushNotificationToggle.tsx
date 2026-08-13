"use client";

import { Bell, BellOff, AlertCircle } from "lucide-react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export default function PushNotificationToggle({ favoriteIds }: { favoriteIds: number[] }) {
  const { supported, permission, enabled, busy, error, enable, disable } = usePushNotifications(favoriteIds);

  if (!supported || permission === "unsupported") {
    return <p className="text-xs text-gray-400">Notifications non supportées par ce navigateur.</p>;
  }

  if (permission === "denied") {
    return (
      <p className="text-xs text-gray-400">
        Notifications bloquées par le navigateur — autorise-les dans les réglages du site pour les
        activer.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={enabled ? disable : enable}
        disabled={busy}
        className={
          enabled
            ? "inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-500 hover:border-brand-300 disabled:opacity-60"
        }
      >
        {enabled ? <Bell size={14} /> : <BellOff size={14} />}
        {busy ? "Un instant…" : enabled ? "Notifications activées" : "Activer les notifications"}
      </button>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-brand-600">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
