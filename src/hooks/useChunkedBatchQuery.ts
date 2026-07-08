import { useQueries } from '@tanstack/react-query';
import { hashStringArray } from '@/lib/utils';

/**
 * How many ids go into one relay query. Matches the typical feed page size,
 * so scrolling one more page fetches metrics for one new chunk only.
 */
const CHUNK_SIZE = 25;

export interface ChunkedBatchResult<V> {
  data: Map<string, V> | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Run a batched relay query over `ids`, split into stable chunks in the
 * given order. Each chunk is its own react-query entry, so when an infinite
 * feed appends a page, only the new chunk is fetched — previously loaded
 * chunks stay cached. This replaces the old single-query-per-id-set pattern
 * that refetched metrics for the ENTIRE accumulated feed on every scroll
 * (O(pages²) relay load) and silently truncated results at one global limit.
 *
 * IMPORTANT: `ids` must be in a stable order (e.g. feed load order) — do not
 * sort before calling, or chunk membership shifts as new ids arrive.
 */
export function useChunkedBatchQuery<V>(
  keyPrefix: readonly unknown[],
  ids: string[],
  fetchChunk: (chunk: string[], signal: AbortSignal) => Promise<Map<string, V>>,
  options?: { staleTime?: number },
): ChunkedBatchResult<V> {
  const staleTime = options?.staleTime ?? 60 * 1000;

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + CHUNK_SIZE));
  }

  return useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: [...keyPrefix, hashStringArray(chunk)],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        return fetchChunk(chunk, AbortSignal.any([signal, AbortSignal.timeout(8000)]));
      },
      staleTime,
    })),
    combine: (results) => {
      const merged = new Map<string, V>();
      for (const result of results) {
        if (result.data) {
          for (const [k, v] of result.data) merged.set(k, v);
        }
      }
      return {
        data: chunks.length > 0 ? merged : undefined,
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
        error: results.find((r) => r.error)?.error ?? null,
      };
    },
  });
}
