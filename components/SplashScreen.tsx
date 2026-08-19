"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Temps d'affichage du splash screen (ex: 1.5 secondes)
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 500); // correspond à la durée de la transition CSS
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#090d16] py-12 transition-opacity duration-500 ease-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Element vide pour équilibrer le flexbox centré */}
      <div></div>

      {/* Logo centré avec animation pulsante discrète */}
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="relative w-28 h-28 flex items-center justify-center rounded-3xl bg-zinc-900/80 p-3 shadow-2xl border border-white/10">
          <Image
            src="/icons/icon-512x512.png"
            alt="UCUP 2026 Logo"
            width={96}
            height={96}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-xl font-black tracking-wider text-white uppercase mt-2">
          U-CUP <span className="text-red-500">2026</span>
        </h1>
      </div>

      {/* Signature en bas (style "from Meta") */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">
          Propulsé par
        </span>
        <span className="text-sm font-bold tracking-wide text-zinc-300">
          Elmish Segara TECH LAB
        </span>
      </div>
    </div>
  );
}