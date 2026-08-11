"use client";

import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

export default function PushNotificationToggle({ favoriteIds }: { favoriteIds: number[] }) {
  const { supported, permission, enabled, enable, disable } = usePushNotifications(favoriteIds);

  if (!supported || permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <p className="text-xs text-gray-400">
        Notifications bloquées par le navigateur — autorise-les dans les réglages du site pour les
        activer.
      </p>
    );
  }

  return (
    <button
      onClick={enabled ? disable : enable}
      className={
        enabled
          ? "inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-xs font-bold text-white"
          : "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-1.5 text-xs font-bold text-gray-500 hover:border-brand-300"
      }
    >
      {enabled ? <Bell size={14} /> : <BellOff size={14} />}
      {enabled ? "Notifications activées" : "Activer les notifications"}
    </button>
  );
}
