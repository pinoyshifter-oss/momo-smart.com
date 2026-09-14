/** Client-side profile photo handling, shared by registration and settings. */

const PHOTO_SIZE = 320;

/** Largest file accepted before re-encoding. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Centre-crops the image to a square and re-encodes it as a small JPEG, so
 * the stored photo is a few dozen KB whatever the camera produced.
 */
export async function toPhotoDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    PHOTO_SIZE,
    PHOTO_SIZE,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
