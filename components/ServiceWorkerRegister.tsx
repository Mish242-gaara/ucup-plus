"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker enregistré :", reg.scope))
        .catch((err) => console.error("Erreur enregistrement Service Worker :", err));
    }
  }, []);

  return null;
}