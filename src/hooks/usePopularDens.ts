import { useMemo } from 'react';
import { identifierToDen } from '@/lib/foxhole';
import { useFoxholePosts } from './useFoxholePosts';

interface DenStats {
  name: string;
  postCount: number;
  latestPost: number;
}

interface UsePopularDensOptions {
  limit?: number;
}

export function usePopularDens(options: UsePopularDensOptions = {}) {
  const { limit = 100 } = options;

  const postsQuery = useFoxholePosts({ limit });

  const dens = useMemo(() => {
    const posts = postsQuery.data ?? [];
    const denMap = new Map<string, DenStats>();

    for (const event of posts) {
      const identifier = event.tags.find(([name]) => name === 'I')?.[1];
      if (!identifier) continue;
      const den = identifierToDen(identifier);
      if (!den) continue;

      const existing = denMap.get(den);
      if (existing) {
        existing.postCount++;
        existing.latestPost = Math.max(existing.latestPost, event.created_at);
      } else {
        denMap.set(den, { name: den, postCount: 1, latestPost: event.created_at });
      }
    }

    return Array.from(denMap.values()).sort((a, b) => b.postCount - a.postCount);
  }, [postsQuery.data]);

  return {
    data: dens,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
