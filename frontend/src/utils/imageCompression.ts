/**
 * Helper to compress and resize images on the client side (especially for mobile camera photos)
 * Uses lightweight createImageBitmap with fallback to avoid memory bottlenecks on mobile devices.
 */
export async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.85
): Promise<File> {
  // If file is not an image (or is SVG / GIF), don't process via canvas
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // If already small (< 500KB), return as is
  if (file.size < 500 * 1024) {
    return file;
  }

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return file;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      return await new Promise<File>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              }));
            } else {
              resolve(file);
            }
          },
          outputType,
          quality
        );
      });
    }
  } catch {
    // If bitmap fails, fallback to original file safely
    return file;
  }

  return file;
}
