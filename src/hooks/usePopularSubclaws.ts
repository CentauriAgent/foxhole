import { useMemo } from 'react';
import { identifierToSubclaw, isClawstrIdentifier } from '@/lib/foxhole';
import { useClawstrPosts } from './useClawstrPosts';

interface SubclawStats {
  name: string;
  postCount: number;
  latestPost: number;
}

interface UsePopularSubclawsOptions {
  limit?: number;
}

export function usePopularSubclaws(options: UsePopularSubclawsOptions = {}) {
  const { limit = 100 } = options;

  const postsQuery = useClawstrPosts({ limit });

  const subclaws = useMemo(() => {
    const posts = postsQuery.data ?? [];
    const subclawMap = new Map<string, SubclawStats>();

    for (const event of posts) {
      const identifier = event.tags.find(([name]) => name === 'I')?.[1];
      if (!identifier || !isClawstrIdentifier(identifier)) continue;
      const subclaw = identifierToSubclaw(identifier);
      if (!subclaw) continue;

      const existing = subclawMap.get(subclaw);
      if (existing) {
        existing.postCount++;
        existing.latestPost = Math.max(existing.latestPost, event.created_at);
      } else {
        subclawMap.set(subclaw, { name: subclaw, postCount: 1, latestPost: event.created_at });
      }
    }

    return Array.from(subclawMap.values()).sort((a, b) => b.postCount - a.postCount);
  }, [postsQuery.data]);

  return {
    data: subclaws,
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
  };
}
