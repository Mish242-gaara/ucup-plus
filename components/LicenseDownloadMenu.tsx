"use client";

import { useState, useRef, useEffect } from "react";
import { IdCard } from "lucide-react";

const OPTIONS = [
  { label: "Recto — PNG", format: "png", side: "front" },
  { label: "Verso — PNG", format: "png", side: "back" },
  { label: "Recto — JPG", format: "jpg", side: "front" },
  { label: "Verso — JPG", format: "jpg", side: "back" },
  { label: "Recto + Verso — PDF", format: "pdf", side: "front" },
];

export default function LicenseDownloadMenu({ playerId }: { playerId: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-brand-500 hover:underline"
      >
        <IdCard size={14} /> Licence
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-lg">
          {OPTIONS.map((opt) => (
            <a
              key={opt.label}
              href={`/api/admin/players/${playerId}/license?format=${opt.format}&side=${opt.side}`}
              className="block px-4 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white"
              onClick={() => setOpen(false)}
            >
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
