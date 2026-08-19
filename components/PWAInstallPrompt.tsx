"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Détecter si l'application est déjà installée
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) return;

    // 2. Détecter iOS (Safari ne supporte pas `beforeinstallprompt`)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Si sur iOS et pas encore rejeté par l'utilisateur
    if (isIosDevice && !localStorage.getItem("pwa_prompt_dismissed")) {
      setShowPrompt(true);
    }

    // 3. Écouter l'événement standard PWA (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (!localStorage.getItem("pwa_prompt_dismissed")) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Masque la pop-up pour les prochaines sessions de l'utilisateur
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl bg-zinc-900/95 p-4 text-white shadow-2xl border border-white/10 backdrop-blur-md animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <Image
          src="/icons/icon-192x192.png"
          alt="UCUP Logo"
          width={48}
          height={48}
          className="rounded-xl bg-white p-1 object-contain"
        />
        <div className="flex-1">
          <h4 className="text-sm font-extrabold">Installer l'application UCUP</h4>
          <p className="text-xs text-gray-400">
            Accédez aux scores et résultats directement depuis votre écran d'accueil.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white text-lg p-1"
          aria-label="Fermer"
        >
          ✕
        </button>
      </div>

      {isIOS ? (
        <div className="mt-3 rounded-lg bg-white/5 p-2 text-[11px] text-gray-300 border border-white/5">
          Pour installer sur iOS : appuyez sur le bouton de partage{" "}
          <span className="font-bold text-red-400">⎋</span> puis sur{" "}
          <span className="font-bold text-white">« Sur l'écran d'accueil » ➕</span>.
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstallClick}
            className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition shadow-lg shadow-red-600/30"
          >
            Installer
          </button>
        </div>
      )}
    </div>
  );
}