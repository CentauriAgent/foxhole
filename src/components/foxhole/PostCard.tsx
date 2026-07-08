import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Bookmark } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import { cn } from '@/lib/utils';
import { formatRelativeTime, getPostDen, formatCount } from '@/lib/foxhole';
import { VoteButtons } from './VoteButtons';
import { ZapButton } from '@/components/ZapButton';
import { AuthorBadge } from './AuthorBadge';
import { DenBadge } from './DenBadge';
import { NoteContent } from '@/components/NoteContent';
import { PostOverflowMenu } from './PostOverflowMenu';
import { LinkPreview } from './LinkPreview';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLinkPreview } from '@/hooks/useLinkPreview';
import { stripMediaUrls, isImageUrl, isVideoUrl } from '@/lib/media';

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
 * Memoized: feed-level state changes only re-render cards whose props changed.
 */
export const PostCard = memo(function PostCard({ 
  post, 
  score = 0,
  replyCount = 0,
  totalSats = 0,
  showDen = false,
  compact = false,
  className,
}: PostCardProps) {
  const { user } = useCurrentUser();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { preview } = useLinkPreview(post.content);
  const den = getPostDen(post);
  const postUrl = den ? `/d/${den}/post/${post.id}` : '#';

  // Extract title from first line if it looks like a title (short, no punctuation at end)
  // Don't treat bare image URLs as titles
  const lines = post.content.split('\n').filter(l => l.trim());
  const firstLine = lines[0] || '';
  const hasTitle = firstLine.length <= 120 && !firstLine.match(/[.!?]$/) && !isImageUrl(firstLine.trim()) && !isVideoUrl(firstLine.trim()) && !firstLine.trim().match(/^https?:\/\//);
  const rawTitle = hasTitle ? firstLine : null;
  // Strip image URLs from the title so rendered images aren't duplicated as text
  const title = rawTitle ? stripMediaUrls(rawTitle) || null : null;
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
      <div className="shrink-0 pt-0.5">
        <VoteButtons eventId={post.id} authorPubkey={post.pubkey} score={score} size={compact ? 'sm' : 'md'} />
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
                "font-semibold text-foreground group-hover:text-brand transition-colors wrap-break-word",
                compact ? "text-sm" : "text-base"
              )}>
                {title}
              </h3>
              {!compact && bodyContent && (
                <div className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  <NoteContent event={{ ...post, content: bodyContent }} disableLinks />
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "text-foreground",
              compact ? "text-sm line-clamp-2" : "text-sm line-clamp-4"
            )}>
              <NoteContent event={post} disableLinks />
            </div>
          )}
        </Link>

        {/* Link Preview */}
        {!compact && preview && (
          <LinkPreview data={preview} />
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-4 pt-1">
          <ZapButton target={post} zapData={{ count: 0, totalSats }} />
          <Link 
            to={postUrl}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{formatCount(replyCount)} {replyCount === 1 ? 'comment' : 'comments'}</span>
          </Link>
          {user && (
            <button
              onClick={() => toggleBookmark(post.id)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              title={isBookmarked(post.id) ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isBookmarked(post.id) && "fill-brand text-brand"
                )}
              />
            </button>
          )}
          <PostOverflowMenu post={post} />
        </div>
      </div>
    </article>
  );
});
