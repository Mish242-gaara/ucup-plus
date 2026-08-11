import { put, del } from "@vercel/blob";

/**
 * Uploads an image File to Vercel Blob and returns its public URL.
 * Returns null if no file was provided (e.g. field left empty on an edit form).
 */
export async function uploadImage(file: File | null, prefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = file.type === "image/png" ? "png" : "jpg";
  const blob = await put(`${prefix}/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob.url;
}

/** Best-effort delete of a previously uploaded blob when replacing/removing a photo. */
export async function deleteImage(url: string | null | undefined) {
  if (!url || !url.includes("blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch {
    // non-fatal — an orphaned blob is not worth failing the request over
  }
}
