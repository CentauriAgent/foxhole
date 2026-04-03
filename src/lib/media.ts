/**
 * Media URL detection utilities.
 * 
 * Matches common image and video file extensions
 * including Blossom/CDN URLs with hash filenames.
 */

// ── Image ──────────────────────────────────────────────────────────────

/** Regex pattern that matches image URLs (global flag). */
export const IMAGE_URL_PATTERN = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^\s]*)?/gi;

/** Get a fresh RegExp instance for image URL matching (global flag). */
export function getImageUrlRegex(): RegExp {
  return new RegExp(IMAGE_URL_PATTERN.source, IMAGE_URL_PATTERN.flags);
}

/** Non-global version for simple testing */
export const IMAGE_URL_REGEX = new RegExp(IMAGE_URL_PATTERN.source, 'i');

/** Check if a URL points to an image based on file extension. */
export function isImageUrl(url: string): boolean {
  return IMAGE_URL_REGEX.test(url);
}

/** Extract all image URLs from text content. */
export function extractImageUrls(text: string): string[] {
  return [...text.matchAll(getImageUrlRegex())].map(m => m[0]);
}

/** Remove image URLs from text content, collapsing extra whitespace/newlines. */
export function stripImageUrls(text: string): string {
  return text
    .replace(getImageUrlRegex(), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Video ──────────────────────────────────────────────────────────────

/** Regex pattern that matches video URLs (global flag). */
export const VIDEO_URL_PATTERN = /https?:\/\/[^\s]+?\.(mp4|mov|webm|ogg|m4v|mkv)(\?[^\s]*)?/gi;

/** Get a fresh RegExp instance for video URL matching (global flag). */
export function getVideoUrlRegex(): RegExp {
  return new RegExp(VIDEO_URL_PATTERN.source, VIDEO_URL_PATTERN.flags);
}

/** Non-global version for simple testing */
export const VIDEO_URL_REGEX = new RegExp(VIDEO_URL_PATTERN.source, 'i');

/** Check if a URL points to a video based on file extension. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_REGEX.test(url);
}

/** Extract all video URLs from text content. */
export function extractVideoUrls(text: string): string[] {
  return [...text.matchAll(getVideoUrlRegex())].map(m => m[0]);
}

/** Remove video URLs from text content, collapsing extra whitespace/newlines. */
export function stripVideoUrls(text: string): string {
  return text
    .replace(getVideoUrlRegex(), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Combined ───────────────────────────────────────────────────────────

/** Remove both image and video URLs from text content. */
export function stripMediaUrls(text: string): string {
  return text
    .replace(getImageUrlRegex(), '')
    .replace(getVideoUrlRegex(), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
