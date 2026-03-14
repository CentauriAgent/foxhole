import { useState, useEffect } from 'react';

export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain: string;
}

const cache = new Map<string, LinkPreviewData | null>();

/**
 * Extract the first non-media URL from text content.
 */
export function extractFirstUrl(text: string): string | null {
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const mediaExts = /\.(jpg|jpeg|png|gif|webp|svg|avif|mp4|webm|mov|ogg)(\?.*)?$/i;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0].replace(/[).,;:!?]+$/, '');
    if (!mediaExts.test(url)) {
      return url;
    }
  }
  return null;
}

/**
 * Hook to fetch Open Graph metadata for the first URL found in content.
 */
export function useLinkPreview(content: string): {
  preview: LinkPreviewData | null;
  loading: boolean;
} {
  const url = extractFirstUrl(content);
  const [preview, setPreview] = useState<LinkPreviewData | null>(
    url && cache.has(url) ? cache.get(url)! : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;

    if (cache.has(url)) {
      setPreview(cache.get(url)!);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const encoded = encodeURIComponent(url);
    fetch(`https://api.microlink.io/?url=${encoded}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        if (data.status === 'success' && data.data) {
          const d = data.data;
          const result: LinkPreviewData = {
            title: d.title || undefined,
            description: d.description || undefined,
            image: d.image?.url || undefined,
            url,
            domain: new URL(url).hostname.replace(/^www\./, ''),
          };
          cache.set(url, result);
          setPreview(result);
        } else {
          cache.set(url, null);
          setPreview(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          cache.set(url, null);
          setPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { preview, loading };
}
