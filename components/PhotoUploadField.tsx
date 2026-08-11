"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.82;

async function resizeToFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Échec de compression"))), "image/jpeg", JPEG_QUALITY)
  );

  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

/**
 * Resizes the chosen image client-side, then swaps it into the actual
 * <input type="file"> (via DataTransfer) so the form still submits it as a
 * normal multipart file upload — the server action uploads it to Vercel
 * Blob and stores the resulting URL, never the raw bytes.
 */
export default function PhotoUploadField({
  name,
  initialValue,
  label = "Photo",
}: {
  name: string;
  initialValue?: string | null;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(initialValue ?? null);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Merci de choisir une image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image trop lourde (max 8 Mo).");
      return;
    }

    try {
      const resized = await resizeToFile(file);
      setPreview(URL.createObjectURL(resized));
      setRemoved(false);

      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(resized);
        inputRef.current.files = dt.files;
      }
    } catch {
      setError("Impossible de traiter cette image.");
    }
  }

  return (
    <div className="col-span-2 flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-800">
        {preview && !removed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-gray-400">{label}</span>
        )}
      </div>
      <div className="flex-1">
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="text-sm"
        />
        {error && <p className="mt-1 text-xs text-brand-600">{error}</p>}
        {preview && !removed && (
          <button
            type="button"
            onClick={() => {
              setRemoved(true);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="mt-1 block text-xs text-gray-400 hover:text-brand-600"
          >
            Retirer la photo
          </button>
        )}
        {/* Tells the server action the existing photo should be cleared, since
            an empty file input alone is indistinguishable from "no change". */}
        {removed && <input type="hidden" name={`${name}-removed`} value="1" />}
      </div>
    </div>
  );
}
