import { type NostrEvent, type NostrMetadata, NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useChunkedBatchQuery } from '@/hooks/useChunkedBatchQuery';

export interface AuthorData {
  event?: NostrEvent;
  metadata?: NostrMetadata;
}

/**
 * Batch fetch author profiles (kind 0) for multiple pubkeys, in stable
 * chunks (see useChunkedBatchQuery). Seeds the individual
 * `['nostr', 'author', pubkey]` query cache so that `useAuthor(pubkey)`
 * calls in feed cards hit the cache instead of firing one relay request
 * per author.
 *
 * Call this from feed hooks/components with the post authors' pubkeys.
 */
export function useBatchAuthors(pubkeys: string[]) {
  const { nostr } = useNostr();
  const queryClient = useQueryClient();

  // Dedupe while preserving first-seen order so chunk membership is stable
  // as the feed grows.
  const unique = [...new Set(pubkeys.filter(Boolean))];

  return useChunkedBatchQuery<AuthorData>(
    ['nostr', 'batch-authors'],
    unique,
    async (chunk, signal) => {
      const events = await nostr.query(
        [{ kinds: [0], authors: chunk, limit: chunk.length }],
        { signal },
      );

      const byPubkey = new Map<string, AuthorData>();
      for (const pubkey of chunk) {
        byPubkey.set(pubkey, {});
      }

      for (const event of events) {
        // Keep only the newest kind-0 per pubkey
        const existing = byPubkey.get(event.pubkey);
        if (existing?.event && existing.event.created_at >= event.created_at) {
          continue;
        }
        try {
          const metadata = n.json().pipe(n.metadata()).parse(event.content);
          byPubkey.set(event.pubkey, { metadata, event });
        } catch {
          byPubkey.set(event.pubkey, { event });
        }
      }

      // Seed the per-author cache used by useAuthor() — including empty
      // results, so profile-less authors don't trigger follow-up requests.
      for (const [pubkey, data] of byPubkey) {
        if (queryClient.getQueryData(['nostr', 'author', pubkey]) === undefined) {
          queryClient.setQueryData(['nostr', 'author', pubkey], data);
        }
      }

      return byPubkey;
    },
    { staleTime: 5 * 60 * 1000 },
  );
}
