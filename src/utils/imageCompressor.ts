/**
 * High-quality client-side image compression & optimizer
 * Ensures photographic & vector art clarity while maintaining lightweight payload sizes for instant cloud synchronization.
 */
export async function optimizeImageFile(file: File, maxDimension = 1440, quality = 0.80): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as text or data URI
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first for maximum compression & quality, fallback to jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData && webpData.startsWith('data:image/webp') && webpData.length < (e.target?.result as string).length) {
            resolve(webpData);
            return;
          }
        } catch {
          // Fallback
        }

        try {
          const jpegData = canvas.toDataURL('image/jpeg', quality);
          if (jpegData && jpegData.startsWith('data:image/jpeg')) {
            resolve(jpegData);
            return;
          }
        } catch {
          // Fallback
        }

        resolve(e.target?.result as string);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

