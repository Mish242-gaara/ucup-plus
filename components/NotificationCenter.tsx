"use client";

import { useState, useEffect } from "react";
import { saveSubscription } from "@/app/actions/push";

type Props = {
  teams: { id: string; name: string }[];
};

export default function NotificationCenter({ teams }: Props) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [teamId, setTeamId] = useState<string>("");
  const [notifyGoals, setNotifyGoals] = useState(true);
  const [notifyCards, setNotifyCards] = useState(true);
  const [notifyFinal, setNotifyFinal] = useState(true);
  const [notifyNews, setNotifyNews] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      navigator.serviceWorker.register("/sw.js");
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setSubscription(sub);
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      const jsonSub = sub.toJSON();
      await saveSubscription(
        {
          endpoint: jsonSub.endpoint!,
          keys: {
            p256dh: jsonSub.keys!.p256dh!,
            auth: jsonSub.keys!.auth!,
          },
        },
        { teamId: teamId || null, notifyGoals, notifyCards, notifyFinal, notifyNews }
      );

      setStatusMsg("Préférences de notification enregistrées !");
    } catch (err) {
      console.error(err);
      setStatusMsg("Erreur lors de l'activation des notifications.");
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl bg-zinc-900 p-4 text-xs text-gray-400 border border-white/10">
        Les notifications push ne sont pas supportées sur ce navigateur.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900 p-6 text-white border border-white/10 space-y-5">
      <h3 className="text-lg font-bold flex items-center gap-2">
        🔔 Centre de Notifications PWA
      </h3>

      <div className="space-y-4 text-sm">
        {/* Choix Équipe Favorite */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">
            Équipe favorite :
          </label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-lg bg-zinc-800 border border-white/10 p-2 text-white"
          >
            <option value="">Toutes les équipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Préférences Toggles */}
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span>⚽ Buts</span>
            <input
              type="checkbox"
              checked={notifyGoals}
              onChange={(e) => setNotifyGoals(e.target.checked)}
              className="accent-red-500 h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>🔴 Cartons Rouges</span>
            <input
              type="checkbox"
              checked={notifyCards}
              onChange={(e) => setNotifyCards(e.target.checked)}
              className="accent-red-500 h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>🏁 Sifflet Final / Résultats</span>
            <input
              type="checkbox"
              checked={notifyFinal}
              onChange={(e) => setNotifyFinal(e.target.checked)}
              className="accent-red-500 h-4 w-4"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>📰 Grandes Actualités</span>
            <input
              type="checkbox"
              checked={notifyNews}
              onChange={(e) => setNotifyNews(e.target.checked)}
              className="accent-red-500 h-4 w-4"
            />
          </label>
        </div>

        <button
          onClick={handleSubscribe}
          className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 font-bold text-white transition"
        >
          {subscription ? "Mettre à jour mes alertes" : "Activer les notifications"}
        </button>

        {statusMsg && (
          <p className="text-xs text-center text-green-400 font-medium">{statusMsg}</p>
        )}
      </div>
    </div>
  );
}