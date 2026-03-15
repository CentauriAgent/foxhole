import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

/**
 * Kind 30078 — Application-specific data (NIP-78).
 * We store den metadata with d-tag = `foxhole:den:<name>`.
 */
const DEN_METADATA_KIND = 30078;

export interface DenMetadata {
  name: string;
  description: string;
  rules: string;
  createdAt: number;
  creatorPubkey: string;
}

function denMetadataTag(denName: string): string {
  return `foxhole:den:${denName.toLowerCase()}`;
}

/** Parse a kind 30078 event into DenMetadata. */
function parseDenMetadata(event: { content: string; created_at: number; pubkey: string }, denName: string): DenMetadata | null {
  try {
    const data = JSON.parse(event.content);
    return {
      name: denName,
      description: data.description ?? '',
      rules: data.rules ?? '',
      createdAt: event.created_at,
      creatorPubkey: event.pubkey,
    };
  } catch {
    return null;
  }
}

/** Fetch den metadata from any author (takes the most recent). */
export function useDenMetadata(denName: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['foxhole', 'den-metadata', denName],
    queryFn: async ({ signal }) => {
      if (!denName) return null;

      const dTag = denMetadataTag(denName);
      const events = await nostr.query(
        [{ kinds: [DEN_METADATA_KIND], '#d': [dTag], limit: 10 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
      );

      if (events.length === 0) return null;

      // Take the earliest (creator's) metadata
      const sorted = events.sort((a, b) => a.created_at - b.created_at);
      return parseDenMetadata(sorted[0], denName);
    },
    enabled: !!denName,
    staleTime: 60_000,
  });
}

/** Publish den metadata (kind 30078). */
export function useCreateDenMetadata() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, rules }: { name: string; description: string; rules: string }) => {
      if (!user) throw new Error('Not logged in');

      const dTag = denMetadataTag(name);
      const content = JSON.stringify({ description, rules });

      await publishEvent({
        kind: DEN_METADATA_KIND,
        content,
        tags: [['d', dTag]],
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['foxhole', 'den-metadata', variables.name] });
    },
  });
}
