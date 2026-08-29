const lowDataImageThresholdBytes = 256 * 1024;
const lowDataMaximumImageEdge = 2048;

export function shouldPrepareLowDataImage(input: {
  readonly mimeType: string;
  readonly byteSize: number;
  readonly lowDataMode: boolean;
}): boolean {
  return input.lowDataMode
    && (input.mimeType === "image/jpeg" || input.mimeType === "image/png")
    && input.byteSize >= lowDataImageThresholdBytes;
}

/** Re-encodes a customer-selected image only when low-data mode is active and
 * keeps the result only when it is smaller. The server still validates magic
 * bytes, final byte size and a checksum after preparation; this helper is a
 * bandwidth optimization, never a trust boundary. */
export async function prepareLowDataEvidenceFile(
  file: File,
  lowDataMode: boolean
): Promise<{ readonly file: File; readonly savedBytes: number }> {
  if (!shouldPrepareLowDataImage({ mimeType: file.type, byteSize: file.size, lowDataMode })) {
    return { file, savedBytes: 0 };
  }
  try {
    const image = await createImageBitmap(file);
    const scale = Math.min(1, lowDataMaximumImageEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: file.type === "image/png" });
    if (!context) return { file, savedBytes: 0 };
    context.drawImage(image, 0, 0, width, height);
    image.close();
    const candidate = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type, file.type === "image/jpeg" ? 0.82 : undefined);
    });
    if (!candidate || candidate.size >= file.size) return { file, savedBytes: 0 };
    return {
      file: new File([candidate], file.name, { type: file.type, lastModified: file.lastModified }),
      savedBytes: file.size - candidate.size
    };
  } catch {
    return { file, savedBytes: 0 };
  }
}
