"use client";

import { useState } from "react";
import PhotoUploadField from "@/components/PhotoUploadField";
import { createGalleryItem } from "@/lib/actions/gallery";

export default function GalleryUploadForm() {
  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  return (
    <form action={createGalleryItem} className="grid max-w-xl grid-cols-2 gap-3">
      <select
        name="mediaType"
        value={mediaType}
        onChange={(e) => setMediaType(e.target.value as "image" | "video")}
        className="input col-span-2"
      >
        <option value="image">Photo</option>
        <option value="video">Vidéo (lien externe)</option>
      </select>

      {mediaType === "image" ? (
        <PhotoUploadField name="filePath" label="Photo" />
      ) : (
        <input
          name="filePath"
          placeholder="URL de la vidéo (YouTube, etc.)"
          className="input col-span-2"
        />
      )}

      <input name="title" placeholder="Titre (optionnel)" className="input col-span-2" />
      <textarea name="description" placeholder="Description (optionnelle)" rows={2} className="input col-span-2" />

      <button type="submit" className="btn col-span-2">
        Ajouter à la galerie
      </button>
    </form>
  );
}
