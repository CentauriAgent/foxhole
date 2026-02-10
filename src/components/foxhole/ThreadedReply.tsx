import { useState } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { MessageSquare, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/foxhole';
import { VoteButtons } from './VoteButtons';
import { AuthorBadge } from './AuthorBadge';
import { NoteContent } from '@/components/NoteContent';
import { NostrCommentForm } from './NostrCommentForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface ThreadedReplyProps {
  reply: NostrEvent;
  score?: number;
  depth?: number;
  children?: React.ReactNode;
  className?: string;
  den?: string;
  hasMoreReplies?: boolean;
  rootEventId?: string;
}

const MAX_DEPTH = 6;

/**
 * A single reply in a threaded comment tree.
 */
export function ThreadedReply({
  reply,
  score = 0,
  depth = 0,
  children,
  className,
  den,
  hasMoreReplies = false,
  rootEventId,
}: ThreadedReplyProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { user } = useCurrentUser();
  const isDeep = depth >= MAX_DEPTH;
  const showViewMore = (isDeep && hasMoreReplies) || (depth === MAX_DEPTH - 1 && hasMoreReplies);

  return (
    <div className={cn("relative", className)}>
      {/* Thread line */}
      {depth > 0 && (
        <div 
          className={cn(
            "absolute left-3 top-0 bottom-0 w-px",
            false ? "bg-[hsl(var(--brand))]/20" : "bg-border"
          )}
        />
      )}

      <div className={cn(
        "flex gap-2",
        depth === 0 && "py-3",
        depth > 0 && "ml-6 pt-3"
      )}>
        {/* Vote buttons */}
        <div className="flex-shrink-0 pt-0.5">
          <VoteButtons eventId={reply.id} score={score} size="sm" />
        </div>

        {/* Reply content */}
        <div className="flex-1 min-w-0">
          {/* Meta line */}
          <div className="flex items-center gap-2 text-xs">
            <AuthorBadge pubkey={reply.pubkey} event={reply} showAvatar />
            <span className="text-muted-foreground/50">•</span>
            <time className="text-muted-foreground/70">
              {formatRelativeTime(reply.created_at)}
            </time>
          </div>

          {/* Content */}
          <div className={cn(
            "mt-1 text-sm",
            false ? "text-foreground" : "text-foreground/80"
          )}>
            <NoteContent event={reply} />
          </div>

          {/* Reply button */}
          {user && den && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[hsl(var(--brand))] transition-colors"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}

          {/* Inline reply form */}
          {showReplyForm && den && (
            <div className="mt-2">
              <NostrCommentForm
                den={den}
                postId={reply.id}
                rootPostId={rootEventId}
                onSuccess={() => setShowReplyForm(false)}
                placeholder="Write a reply..."
                compact
              />
            </div>
          )}

          {/* Nested replies */}
          {children && !isDeep && (
            <div className="mt-2">
              {children}
            </div>
          )}

          {/* "View full thread" link for deep threads */}
          {showViewMore && den && (
            <Link
              to={`/d/${den}/comment/${reply.id}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[hsl(var(--brand))] hover:underline"
            >
              <MessageSquare className="h-3 w-3" />
              View full thread
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

interface ThreadedRepliesProps {
  replies: NostrEvent[];
  getDirectReplies: (parentId: string) => NostrEvent[];
  votesMap?: Map<string, { score: number }>;
  depth?: number;
  den?: string;
  rootEventId?: string;
}

/**
 * Recursively render threaded replies.
 */
export function ThreadedReplies({
  replies,
  getDirectReplies,
  votesMap,
  depth = 0,
  den,
  rootEventId,
}: ThreadedRepliesProps) {
  if (depth > MAX_DEPTH || replies.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      depth === 0 ? "divide-y divide-border/50" : "space-y-0"
    )}>
      {replies.map((reply) => {
        const childReplies = getDirectReplies(reply.id);
        const hasMoreReplies = childReplies.length > 0;
        
        return (
          <ThreadedReply
            key={reply.id}
            reply={reply}
            score={votesMap?.get(reply.id)?.score ?? 0}
            depth={depth}
            den={den}
            hasMoreReplies={hasMoreReplies}
            rootEventId={rootEventId}
          >
            {childReplies.length > 0 && depth < MAX_DEPTH && (
              <ThreadedReplies
                replies={childReplies}
                getDirectReplies={getDirectReplies}
                votesMap={votesMap}
                depth={depth + 1}
                den={den}
                rootEventId={rootEventId}
              />
            )}
          </ThreadedReply>
        );
      })}
    </div>
  );
}
