import type { UploadedImage } from '@/components/foxhole/ImageUpload';

/** Build imeta tags for uploaded images (NIP-92) */
export function buildImetaTags(images: UploadedImage[]): string[][] {
  // If Blossom returned tags directly, use those
  const result: string[][] = [];
  for (const img of images) {
    if (img.tags) {
      result.push(...img.tags);
    } else {
      // Fallback: build imeta manually
      const tag = ['imeta', `url ${img.url}`];
      if (img.mimeType) tag.push(`m ${img.mimeType}`);
      if (img.dimensions?.width) tag.push(`dim ${img.dimensions.width}x${img.dimensions.height}`);
      result.push(tag);
    }
  }
  return result;
}

/** Append image URLs to content text */
export function appendImageUrls(content: string, images: UploadedImage[]): string {
  if (!images.length) return content;
  const urls = images.map((img) => img.url).join('\n');
  return content.trim() + '\n\n' + urls;
}
