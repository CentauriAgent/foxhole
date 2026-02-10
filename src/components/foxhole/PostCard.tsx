import { Link } from 'react-router-dom';
import { MessageSquare, Zap } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';
import { formatRelativeTime, getPostDen, formatCount } from '@/lib/foxhole';
import { formatSats } from '@/lib/hotScore';
import { VoteButtons } from './VoteButtons';
import { AuthorBadge } from './AuthorBadge';
import { DenBadge } from './DenBadge';
import { NoteContent } from '@/components/NoteContent';

interface PostCardProps {
  post: NostrEvent;
  score?: number;
  replyCount?: number;
  /** Total sats zapped to this post */
  totalSats?: number;
  /** Show the den badge (for homepage/mixed feeds) */
  showDen?: boolean;
  /** Compact mode for feed lists */
  compact?: boolean;
  className?: string;
}

/**
 * Reddit-style post card with vote buttons, content, and metadata.
 */
export function PostCard({ 
  post, 
  score = 0,
  replyCount = 0,
  totalSats = 0,
  showDen = false,
  compact = false,
  className,
}: PostCardProps) {
  const den = getPostDen(post);
  const postUrl = den ? `/d/${den}/post/${post.id}` : '#';

  // Extract title from first line if it looks like a title (short, no punctuation at end)
  const lines = post.content.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  const hasTitle = firstLine.length <= 120 && !firstLine.match(/[.!?]$/);
  const title = hasTitle ? firstLine : null;
  const bodyContent = hasTitle && lines.length > 1 
    ? lines.slice(1).join('\n').trim() 
    : post.content;

  return (
    <article className={cn(
      "group flex gap-3 p-3 transition-colors",
      "hover:bg-muted/50",
      className
    )}>
      {/* Vote Column */}
      <div className="flex-shrink-0 pt-0.5">
        <VoteButtons eventId={post.id} score={score} size={compact ? 'sm' : 'md'} />
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Meta line: den, author, time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          {showDen && den && (
            <>
              <DenBadge den={den} className="font-semibold text-foreground/70" />
              <span className="text-muted-foreground/50">•</span>
            </>
          )}
          <AuthorBadge pubkey={post.pubkey} event={post} showAvatar />
          <span className="text-muted-foreground/50">•</span>
          <time className="text-muted-foreground/70">
            {formatRelativeTime(post.created_at)}
          </time>
        </div>

        {/* Title / Content */}
        <Link to={postUrl} className="block">
          {title ? (
            <>
              <h3 className={cn(
                "font-semibold text-foreground group-hover:text-[hsl(var(--brand))] transition-colors",
                compact ? "text-sm" : "text-base"
              )}>
                {title}
              </h3>
              {!compact && bodyContent && (
                <div className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  <NoteContent event={{ ...post, content: bodyContent }} />
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "text-foreground",
              compact ? "text-sm line-clamp-2" : "text-sm line-clamp-4"
            )}>
              <NoteContent event={post} />
            </div>
          )}
        </Link>

        {/* Actions bar */}
        <div className="flex items-center gap-4 pt-1">
          {totalSats > 0 && (
            <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
              <Zap className="h-3.5 w-3.5 fill-amber-500" />
              <span>{formatSats(totalSats)} {totalSats === 1 ? 'sat' : 'sats'}</span>
            </div>
          )}
          <Link 
            to={postUrl}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{formatCount(replyCount)} {replyCount === 1 ? 'comment' : 'comments'}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
