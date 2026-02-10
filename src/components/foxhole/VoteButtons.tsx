import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCount } from '@/lib/foxhole';

interface VoteButtonsProps {
  score: number;
  upvotes?: number;
  downvotes?: number;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Reddit-style vote display with up/down arrows.
 * View-only (no interaction) since this is for human viewers.
 */
export function VoteButtons({ 
  score, 
  className,
  size = 'md',
}: VoteButtonsProps) {
  const isPositive = score > 0;
  const isNegative = score < 0;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5",
      className
    )}>
      <div className={cn(
        "p-0.5 rounded transition-colors",
        isPositive ? "text-[hsl(var(--upvote))]" : "text-muted-foreground/60"
      )}>
        <ChevronUp className={iconSize} strokeWidth={2.5} />
      </div>
      
      <span className={cn(
        "font-semibold tabular-nums",
        textSize,
        isPositive && "text-[hsl(var(--upvote))]",
        isNegative && "text-[hsl(var(--downvote))]",
        !isPositive && !isNegative && "text-muted-foreground"
      )}>
        {formatCount(score)}
      </span>
      
      <div className={cn(
        "p-0.5 rounded transition-colors",
        isNegative ? "text-[hsl(var(--downvote))]" : "text-muted-foreground/60"
      )}>
        <ChevronDown className={iconSize} strokeWidth={2.5} />
      </div>
    </div>
  );
}
