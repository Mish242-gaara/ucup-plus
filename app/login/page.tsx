"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"password" | "code">("password");
  const [code, setCode] = useState("");

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Erreur de connexion");
      return;
    }

    if (data.requiresTwoFactor) {
      setStep("code");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Code invalide");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-ink">
      <main className="w-full max-w-sm px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
            <Trophy size={18} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">UCUP 2026</span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Connexion admin</h1>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-3">
            <input name="email" type="email" placeholder="Email" required className="input" />
            <input name="password" type="password" placeholder="Mot de passe" required className="input" />
            {error && <p className="text-sm text-brand-600">{error}</p>}
            <button type="submit" className="btn">
              Se connecter
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Entre le code à 6 chiffres de ton application d&apos;authentification (ou un code de
              récupération).
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code"
              required
              className="input"
            />
            {error && <p className="text-sm text-brand-600">{error}</p>}
            <button type="submit" className="btn">
              Valider
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
