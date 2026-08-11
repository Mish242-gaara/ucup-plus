"use client";

import { useState } from "react";
import { startTwoFactorSetup, confirmTwoFactorSetup, disableTwoFactor } from "@/lib/actions/twofactor";

export default function TwoFactorSetup({ isEnabled }: { isEnabled: boolean }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(isEnabled);

  async function handleStart() {
    setError(null);
    const res = await startTwoFactorSetup();
    setQrCodeUrl(res.qrCodeUrl);
    setSecret(res.secret);
  }

  async function handleConfirm() {
    setError(null);
    try {
      const res = await confirmTwoFactorSetup(code);
      setRecoveryCodes(res.recoveryCodes);
      setQrCodeUrl(null);
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function handleDisable() {
    await disableTwoFactor();
    setEnabled(false);
    setRecoveryCodes(null);
    setQrCodeUrl(null);
  }

  if (recoveryCodes) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-700">
          2FA activée. Conserve ces codes de récupération dans un endroit sûr — chacun ne fonctionne
          qu&apos;une fois si tu perds l&apos;accès à ton application d&apos;authentification.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
          {recoveryCodes.map((c) => (
            <li key={c} className="rounded bg-zinc-800 px-2 py-1">
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (enabled) {
    return (
      <div>
        <p className="text-sm text-gray-600">La double authentification est activée sur ce compte.</p>
        <button onClick={handleDisable} className="mt-3 text-sm text-brand-600 hover:underline">
          Désactiver la 2FA
        </button>
      </div>
    );
  }

  if (!qrCodeUrl) {
    return (
      <button onClick={handleStart} className="btn">
        Activer la double authentification
      </button>
    );
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrCodeUrl} alt="QR code 2FA" width={220} height={220} className="rounded-lg border border-white/10 bg-white p-2" />
      <p className="mt-2 text-xs text-gray-400">
        Ou saisis la clé manuellement : <span className="font-mono">{secret}</span>
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code à 6 chiffres"
          className="input w-40"
        />
        <button onClick={handleConfirm} className="btn">
          Confirmer
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </div>
  );
}
