import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { ChevronLeft, MessageSquare, CornerDownRight } from 'lucide-react';
import { SiteHeader, Sidebar, VoteButtons, AuthorBadge, ThreadedReplies, FoxIcon } from '@/components/foxhole';
import { ZapButton } from '@/components/ZapButton';
import { NostrCommentForm } from '@/components/foxhole/NostrCommentForm';
import { NoteContent } from '@/components/NoteContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useComment } from '@/hooks/useComment';
import { usePost } from '@/hooks/usePost';
import { usePostVotes, useBatchPostVotes } from '@/hooks/usePostVotes';
import { useCommentReplies } from '@/hooks/useCommentReplies';
import { formatRelativeTime, getPostDen, isTopLevelPost } from '@/lib/foxhole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMuteList } from '@/hooks/useMuteList';
import NotFound from './NotFound';

export default function Comment() {
  const { den, eventId } = useParams<{ den: string; eventId: string }>();
  const { user } = useCurrentUser();

  const { data: comment, isLoading: commentLoading, error: commentError } = useComment(eventId);
  const { data: votes } = usePostVotes(eventId);
  const { data: repliesData, isLoading: repliesLoading } = useCommentReplies(eventId, den || '');
  const { data: mutedPubkeys } = useMuteList();
  
  // Get votes for all replies
  const replyIds = repliesData?.allReplies.map(r => r.id) ?? [];
  const { data: replyVotesMap } = useBatchPostVotes(replyIds);

  // Filter muted users from replies
  const filteredDirectReplies = useMemo(() => {
    if (!repliesData?.directReplies) return [];
    if (!mutedPubkeys?.size) return repliesData.directReplies;
    return repliesData.directReplies.filter(r => !mutedPubkeys.has(r.pubkey));
  }, [repliesData?.directReplies, mutedPubkeys]);

  const filteredGetDirectReplies = useCallback((parentId: string) => {
    if (!repliesData) return [];
    const replies = repliesData.getDirectReplies(parentId);
    if (!mutedPubkeys?.size) return replies;
    return replies.filter(r => !mutedPubkeys.has(r.pubkey));
  }, [repliesData, mutedPubkeys]);

  // Get the parent post ID from the comment's 'e' tag
  const parentPostId = comment?.tags.find(([name]) => name === 'e')?.[1];
  
  // Fetch the parent post to display context
  const { data: parentPost, isLoading: parentLoading } = usePost(parentPostId);
  const { data: parentVotes } = usePostVotes(parentPostId);
  
  // Determine if parent is the root post (top-level) or another comment
  const isParentRootPost = parentPost ? isTopLevelPost(parentPost) : false;

  // SEO
  const commentDen = comment ? getPostDen(comment) : den;
  const commentTitle = comment?.content.split('\n')[0]?.slice(0, 60) || 'Comment';
  
  useSeoMeta({
    title: commentDen ? `${commentTitle} - d/${commentDen} - Foxhole` : 'Comment - Foxhole',
    description: comment?.content.slice(0, 160) || 'View comment on Foxhole',
  });

  if (commentError || (!commentLoading && !comment)) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-4">
            {/* Back link */}
            {den && parentPostId && (
              <Link 
                to={isParentRootPost ? `/d/${den}/post/${parentPostId}` : `/d/${den}/comment/${parentPostId}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {isParentRootPost ? 'Back to post' : 'Back to parent comment'}
              </Link>
            )}

            {/* Parent Post/Comment Context */}
            {parentLoading ? (
              <ParentPostSkeleton />
            ) : parentPost ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {isParentRootPost ? 'Original Post' : 'Replying to'}
                </p>
                <Link 
                  to={isParentRootPost ? `/d/${den}/post/${parentPost.id}` : `/d/${den}/comment/${parentPost.id}`}
                  className="block"
                >
                  <article className="rounded-lg border border-border/50 bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex gap-3">
                      {/* Vote Column (compact) */}
                      <div className="flex-shrink-0">
                        <VoteButtons eventId={parentPostId!} score={parentVotes?.score ?? 0} size="sm" />
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Meta line */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <AuthorBadge pubkey={parentPost.pubkey} event={parentPost} showAvatar />
                          <span className="text-muted-foreground/50">•</span>
                          <time className="text-muted-foreground/70">
                            {formatRelativeTime(parentPost.created_at)}
                          </time>
                        </div>

                        {/* Content preview */}
                        <div className="text-sm text-foreground/80 line-clamp-3">
                          <NoteContent event={parentPost} />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            ) : null}

            {/* Replying indicator */}
            {parentPost && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                <CornerDownRight className="h-4 w-4 text-[hsl(var(--brand))]" />
                <span>Reply</span>
              </div>
            )}

            {/* Comment Card */}
            {commentLoading ? (
              <CommentSkeleton />
            ) : comment ? (
              <article className="rounded-lg border border-border bg-card p-4">
                <div className="flex gap-4">
                  {/* Vote Column */}
                  <div className="flex-shrink-0">
                    <VoteButtons eventId={eventId!} score={votes?.score ?? 0} />
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Meta line */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <AuthorBadge pubkey={comment.pubkey} event={comment} showAvatar />
                      <span className="text-muted-foreground/50">•</span>
                      <time className="text-muted-foreground/70">
                        {formatRelativeTime(comment.created_at)}
                      </time>
                    </div>

                    {/* Content */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <NoteContent event={comment} />
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                      <ZapButton target={comment as any} />
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        {repliesData?.replyCount ?? 0} replies
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ) : null}

            {/* Reply Form */}
            {user && den && eventId ? (
              <NostrCommentForm
                den={den}
                postId={eventId}
                rootPostId={comment?.tags.find(([name]) => name === 'E')?.[1] || eventId}
                placeholder="Write a reply..."
                onSuccess={() => {}}
              />
            ) : comment && (
              <div className="rounded-lg border border-border bg-card/50 p-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Log in with a Nostr extension to reply
                  </p>
                </div>
              </div>
            )}

            {/* Replies Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Replies
                </h2>
              </div>

              <div className="rounded-lg border border-border bg-card">
                {repliesLoading ? (
                  <RepliesSkeleton />
                ) : repliesData && filteredDirectReplies.length > 0 ? (
                  <div className="p-4">
                    <ThreadedReplies
                      replies={filteredDirectReplies}
                      getDirectReplies={filteredGetDirectReplies}
                      votesMap={replyVotesMap}
                      den={den}
                      rootEventId={comment?.tags.find(([name]) => name === 'E')?.[1] || eventId}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[hsl(var(--brand))]/10 mb-3">
                      <FoxIcon className="h-6 w-6 text-[hsl(var(--brand))]" />
                    </div>
                    <p className="text-muted-foreground">No replies yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Be the first to join the conversation
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
          </div>
        </div>
      </main>
    </div>
  );
}

function ParentPostSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

function RepliesSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-2">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
