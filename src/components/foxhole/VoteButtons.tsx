import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/foxhole';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserVote } from '@/hooks/useUserVote';
import { useQueryClient } from '@tanstack/react-query';

interface VoteButtonsProps {
  eventId: string;
  score: number;
  upvotes?: number;
  downvotes?: number;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Interactive Reddit-style vote buttons with dig (upvote) and bury (downvote).
 * Publishes NIP-25 reactions (kind 7): "+" for dig, "-" for bury.
 * 
 * Fetches the user's existing vote so the UI reflects their prior vote on load.
 * Only one vote per user is counted (the latest reaction per pubkey).
 */
export function VoteButtons({ 
  eventId,
  score, 
  className,
  size = 'md',
}: VoteButtonsProps) {
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { data: existingVote, isLoading: voteLoading } = useUserVote(eventId);

  // Local vote state: tracks optimistic UI. null = no override, synced from server.
  const [localVote, setLocalVote] = useState<'up' | 'down' | null | undefined>(undefined);

  // Sync local vote from server data once loaded
  useEffect(() => {
    if (!voteLoading && existingVote !== undefined && localVote === undefined) {
      setLocalVote(existingVote);
    }
  }, [existingVote, voteLoading, localVote]);

  // The effective vote is local override if set, otherwise server data
  const effectiveVote = localVote !== undefined ? localVote : (existingVote ?? null);

  // The server score already includes the user's existing vote.
  // We need to adjust optimistically only for the *difference* between
  // the existing server vote and the new local vote.
  const serverVoteValue = existingVote === 'up' ? 1 : existingVote === 'down' ? -1 : 0;
  const localVoteValue = effectiveVote === 'up' ? 1 : effectiveVote === 'down' ? -1 : 0;
  const optimisticAdjustment = localVoteValue - serverVoteValue;

  const displayScore = score + optimisticAdjustment;
  const isPositive = displayScore > 0;
  const isNegative = displayScore < 0;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const handleVote = (direction: 'up' | 'down') => {
    if (!user) return;

    // If already voted this direction, do nothing (no toggle off)
    if (effectiveVote === direction) return;

    setLocalVote(direction);

    publishEvent({
      kind: 7,
      content: direction === 'up' ? '+' : '-',
      tags: [
        ['e', eventId],
      ],
      created_at: Math.floor(Date.now() / 1000),
    } as any, {
      onSuccess: () => {
        // Invalidate caches so scores refresh
        queryClient.invalidateQueries({ queryKey: ['foxhole', 'user-vote', eventId] });
        queryClient.invalidateQueries({ queryKey: ['foxhole', 'votes', eventId] });
        queryClient.invalidateQueries({ queryKey: ['foxhole', 'batch-votes'] });
      },
    });
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5",
      className
    )}>
      <button
        onClick={() => handleVote('up')}
        disabled={!user}
        title={user ? "Dig" : "Sign in to vote"}
        className={cn(
          "p-0.5 rounded transition-colors",
          user && "hover:bg-[hsl(var(--upvote))]/10 cursor-pointer",
          !user && "cursor-default",
          effectiveVote === 'up' ? "text-[hsl(var(--upvote))] bg-[hsl(var(--upvote))]/10" :
          isPositive ? "text-[hsl(var(--upvote))]" : "text-muted-foreground/60"
        )}
      >
        <ChevronUp className={iconSize} strokeWidth={2.5} />
      </button>
      
      <span className={cn(
        "font-semibold tabular-nums",
        textSize,
        (isPositive || effectiveVote === 'up') && "text-[hsl(var(--upvote))]",
        (isNegative || effectiveVote === 'down') && "text-[hsl(var(--downvote))]",
        !isPositive && !isNegative && !effectiveVote && "text-muted-foreground"
      )}>
        {formatCount(displayScore)}
      </span>
      
      <button
        onClick={() => handleVote('down')}
        disabled={!user}
        title={user ? "Bury" : "Sign in to vote"}
        className={cn(
          "p-0.5 rounded transition-colors",
          user && "hover:bg-[hsl(var(--downvote))]/10 cursor-pointer",
          !user && "cursor-default",
          effectiveVote === 'down' ? "text-[hsl(var(--downvote))] bg-[hsl(var(--downvote))]/10" :
          isNegative ? "text-[hsl(var(--downvote))]" : "text-muted-foreground/60"
        )}
      >
        <ChevronDown className={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
}
