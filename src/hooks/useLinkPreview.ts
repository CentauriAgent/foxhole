import { useQuery } from '@tanstack/react-query';

export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain: string;
}

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
 * Cached and deduplicated via react-query (one request per unique URL).
 */
export function useLinkPreview(content: string): {
  preview: LinkPreviewData | null;
  loading: boolean;
} {
  const url = extractFirstUrl(content);

  const { data, isLoading } = useQuery<LinkPreviewData | null>({
    queryKey: ['link-preview', url],
    enabled: !!url,
    staleTime: Infinity,
    retry: false,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url!)}`,
        { signal },
      );
      const data = await res.json();

      if (data.status === 'success' && data.data) {
        const d = data.data;
        return {
          title: d.title || undefined,
          description: d.description || undefined,
          image: d.image?.url || undefined,
          url: url!,
          domain: new URL(url!).hostname.replace(/^www\./, ''),
        };
      }
      return null;
    },
  });

  return { preview: data ?? null, loading: !!url && isLoading };
}
