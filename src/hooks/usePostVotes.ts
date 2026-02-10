import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { hashStringArray } from '@/lib/utils';

interface VoteData {
  upvotes: number;
  downvotes: number;
  score: number;
  reactions: NostrEvent[];
}

/**
 * Deduplicate reactions so each pubkey only has one vote per target.
 * Keeps the latest reaction (by created_at) for each pubkey.
 */
function deduplicateReactions(reactions: NostrEvent[]): NostrEvent[] {
  const latestByPubkey = new Map<string, NostrEvent>();
  for (const reaction of reactions) {
    const existing = latestByPubkey.get(reaction.pubkey);
    if (!existing || reaction.created_at > existing.created_at) {
      latestByPubkey.set(reaction.pubkey, reaction);
    }
  }
  return Array.from(latestByPubkey.values());
}

/**
 * Count upvotes and downvotes from a list of (deduplicated) reactions.
 */
export function countVotes(reactions: NostrEvent[]): { upvotes: number; downvotes: number; score: number } {
  let upvotes = 0;
  let downvotes = 0;
  for (const reaction of reactions) {
    const content = reaction.content.trim();
    if (content === '+' || content === '') {
      upvotes++;
    } else if (content === '-') {
      downvotes++;
    }
  }
  return { upvotes, downvotes, score: upvotes - downvotes };
}

/**
 * Fetch and calculate votes (NIP-25 reactions) for a post.
 * 
 * Upvotes: content is "+" or empty string
 * Downvotes: content is "-"
 * 
 * Only the latest reaction per pubkey is counted.
 */
export function usePostVotes(eventId: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<VoteData>({
    queryKey: ['foxhole', 'votes', eventId],
    queryFn: async ({ signal }) => {
      if (!eventId) {
        return { upvotes: 0, downvotes: 0, score: 0, reactions: [] };
      }

      const rawReactions = await nostr.query(
        [{ kinds: [7], '#e': [eventId], limit: 500 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      const reactions = deduplicateReactions(rawReactions);
      const { upvotes, downvotes, score } = countVotes(reactions);

      return { upvotes, downvotes, score, reactions };
    },
    enabled: !!eventId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Batch fetch votes for multiple posts.
 * More efficient than individual queries.
 * Only the latest reaction per pubkey per target is counted.
 */
export function useBatchPostVotes(eventIds: string[]) {
  const { nostr } = useNostr();
  
  // Create compact stable query key via hash
  const queryKeyHash = hashStringArray(eventIds);

  return useQuery({
    queryKey: ['foxhole', 'batch-votes', queryKeyHash],
    queryFn: async ({ signal }) => {
      if (eventIds.length === 0) {
        return new Map<string, VoteData>();
      }

      const reactions = await nostr.query(
        [{ kinds: [7], '#e': eventIds, limit: 500 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      // Group reactions by event ID
      const rawByEvent = new Map<string, NostrEvent[]>();
      for (const id of eventIds) {
        rawByEvent.set(id, []);
      }

      for (const reaction of reactions) {
        const eTag = reaction.tags.find(([name]) => name === 'e');
        const targetId = eTag?.[1];
        if (targetId && rawByEvent.has(targetId)) {
          rawByEvent.get(targetId)!.push(reaction);
        }
      }

      // Deduplicate per target and count
      const votesByEvent = new Map<string, VoteData>();
      for (const [id, rawReactions] of rawByEvent) {
        const dedupedReactions = deduplicateReactions(rawReactions);
        const { upvotes, downvotes, score } = countVotes(dedupedReactions);
        votesByEvent.set(id, { upvotes, downvotes, score, reactions: dedupedReactions });
      }

      return votesByEvent;
    },
    enabled: eventIds.length > 0,
    staleTime: 60 * 1000,
  });
}

/**
 * Deduplicate a flat list of reactions grouped by target event, for use in
 * consolidated hooks like usePopularPageData that process reactions inline.
 * Returns a Map of targetId -> { upvotes, downvotes, score }.
 */
export function deduplicateAndCountReactions(
  reactions: NostrEvent[],
  validTargetIds: Set<string>,
): Map<string, { upvotes: number; downvotes: number; score: number }> {
  // Group by target, then deduplicate per pubkey within each target
  const rawByTarget = new Map<string, NostrEvent[]>();
  for (const reaction of reactions) {
    const tid = reaction.tags.find(([t]) => t === 'e')?.[1];
    if (!tid || !validTargetIds.has(tid)) continue;
    if (!rawByTarget.has(tid)) rawByTarget.set(tid, []);
    rawByTarget.get(tid)!.push(reaction);
  }

  const result = new Map<string, { upvotes: number; downvotes: number; score: number }>();
  for (const [tid, rawReactions] of rawByTarget) {
    const deduped = deduplicateReactions(rawReactions);
    result.set(tid, countVotes(deduped));
  }
  return result;
}
