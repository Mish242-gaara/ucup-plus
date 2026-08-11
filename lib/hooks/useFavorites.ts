"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ucup2026:favoriteTeams";

function readStorage(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(readStorage());
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setIds(readStorage());
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggle = useCallback((teamId: number) => {
    setIds((prev) => {
      const next = prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((teamId: number) => ids.includes(teamId), [ids]);

  return { favoriteIds: ids, isFavorite, toggle };
}
