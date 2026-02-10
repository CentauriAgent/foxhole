import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/foxhole';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
 */
export function VoteButtons({ 
  eventId,
  score, 
  className,
  size = 'md',
}: VoteButtonsProps) {
  const { user } = useCurrentUser();
  const { mutate: publishEvent } = useNostrPublish();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const displayScore = score + (userVote === 'up' ? 1 : userVote === 'down' ? -1 : 0);
  const isPositive = displayScore > 0;
  const isNegative = displayScore < 0;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const handleVote = (direction: 'up' | 'down') => {
    if (!user) return;

    // Toggle off if already voted this way
    if (userVote === direction) {
      setUserVote(null);
      return;
    }

    setUserVote(direction);

    publishEvent({
      kind: 7,
      content: direction === 'up' ? '+' : '-',
      tags: [
        ['e', eventId],
      ],
      created_at: Math.floor(Date.now() / 1000),
    } as any);
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
          userVote === 'up' ? "text-[hsl(var(--upvote))] bg-[hsl(var(--upvote))]/10" :
          isPositive ? "text-[hsl(var(--upvote))]" : "text-muted-foreground/60"
        )}
      >
        <ChevronUp className={iconSize} strokeWidth={2.5} />
      </button>
      
      <span className={cn(
        "font-semibold tabular-nums",
        textSize,
        (isPositive || userVote === 'up') && "text-[hsl(var(--upvote))]",
        (isNegative || userVote === 'down') && "text-[hsl(var(--downvote))]",
        !isPositive && !isNegative && !userVote && "text-muted-foreground"
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
          userVote === 'down' ? "text-[hsl(var(--downvote))] bg-[hsl(var(--downvote))]/10" :
          isNegative ? "text-[hsl(var(--downvote))]" : "text-muted-foreground/60"
        )}
      >
        <ChevronDown className={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
}
