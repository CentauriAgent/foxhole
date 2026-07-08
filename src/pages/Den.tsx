import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader, Sidebar, PopularPostCard, SortTabs } from '@/components/foxhole';
import type { SortMode } from '@/components/foxhole';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { useDenPostsInfinite } from '@/hooks/useDenPostsInfinite';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommunitySubscriptions, useSubscribeToCommunity, useUnsubscribeFromCommunity } from '@/hooks/useCommunitySubscriptions';
import { useDenMetadata } from '@/hooks/useDenMetadata';
import { useDenPins } from '@/hooks/useDenPins';
import { usePinnedPosts } from '@/hooks/usePinnedPosts';
import { denToIdentifier } from '@/lib/foxhole';
import { calculateHotScore } from '@/lib/hotScore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenSquare, Pin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useMuteList } from '@/hooks/useMuteList';
import NotFound from './NotFound';

export default function Den() {
  const { den } = useParams<{ den: string }>();
  const denName = den;
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  
  const { 
    data: posts, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDenPostsInfinite(denName || '', { limit: 50 });

  const { ref, inView } = useInView();
  const { user } = useCurrentUser();
  const { data: mutedPubkeys } = useMuteList();
  const { data: denMetadata } = useDenMetadata(denName);
  const { pins, isPinned: isPinnedPost } = useDenPins(denName);
  const { data: pinnedPosts } = usePinnedPosts(pins, denName);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let result = posts;
    if (mutedPubkeys?.size) {
      result = result.filter(post => !mutedPubkeys.has(post.event.pubkey));
    }
    // Apply sort
    const sorted = [...result];
    switch (sortMode) {
      case 'hot':
        sorted.sort((a, b) => calculateHotScore(b.metrics) - calculateHotScore(a.metrics));
        break;
      case 'new':
        sorted.sort((a, b) => b.event.created_at - a.event.created_at);
        break;
      case 'top':
        sorted.sort((a, b) => {
          const scoreA = a.metrics.upvotes - a.metrics.downvotes + a.metrics.totalSats * 0.1 + a.metrics.replyCount * 2;
          const scoreB = b.metrics.upvotes - b.metrics.downvotes + b.metrics.totalSats * 0.1 + b.metrics.replyCount * 2;
          return scoreB - scoreA;
        });
        break;
    }
    // Filter out pinned posts from the regular feed (they appear at top separately)
    const pinnedIds = new Set(pins);
    return sorted.filter(post => !pinnedIds.has(post.event.id));
  }, [posts, mutedPubkeys, sortMode, pins]);
  const { data: subscriptions } = useCommunitySubscriptions();
  const { mutate: subscribe, isPending: isSubscribing } = useSubscribeToCommunity();
  const { mutate: unsubscribe, isPending: isUnsubscribing } = useUnsubscribeFromCommunity();
  
  const identifier = denName ? denToIdentifier(denName) : '';
  const isSubscribed = subscriptions?.includes(identifier) ?? false;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useSeoMeta({
    title: denName ? `d/${denName} — Foxhole` : 'Foxhole',
    description: denName 
      ? `Discussions about ${denName} on Foxhole` 
      : 'A community forum on Nostr',
  });

  if (!denName) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            <header className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] shrink-0">
                  <FoxIcon className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-[hsl(var(--brand))] truncate">d/{denName}</h1>
                  <p className="text-muted-foreground text-sm">
                    {denMetadata?.description || `Discussions about ${denName}`}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    {user && (
                      <Button
                        size="sm"
                        variant={isSubscribed ? 'outline-solid' : 'default'}
                        className={isSubscribed ? '' : 'bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]'}
                        disabled={isSubscribing || isUnsubscribing}
                        onClick={() => isSubscribed ? unsubscribe(identifier) : subscribe(identifier)}
                      >
                        {isSubscribed ? 'Leave Den' : 'Join Den'}
                      </Button>
                    )}
                    <Link to={`/create?den=${denName}`}>
                      <Button size="sm" className="gap-1.5 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
                        <PenSquare className="h-4 w-4" />
                        Post
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </header>

            <section>
              <div className="flex items-center justify-between mb-4">
                <SortTabs value={sortMode} onChange={setSortMode} />
              </div>
              
              <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
                {error ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Failed to load posts. Please try again.
                  </div>
                ) : isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <div className="flex flex-col items-center gap-1">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <>
                    {pinnedPosts && pinnedPosts.length > 0 && pinnedPosts.map((post) => (
                      <div key={`pinned-${post.event.id}`} className="relative">
                        <Badge variant="secondary" className="absolute top-2 right-2 z-10 gap-1 text-xs font-normal">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </Badge>
                        <PopularPostCard
                          post={post.event}
                          metrics={post.metrics}
                        />
                      </div>
                    ))}
                    {filteredPosts.map((post) => (
                      <PopularPostCard
                        key={post.event.id}
                        post={post.event}
                        metrics={post.metrics}
                      />
                    ))}
                    
                    {hasNextPage && (
                      <div ref={ref} className="p-3">
                        {isFetchingNextPage ? (
                          <div className="flex gap-3">
                            <Skeleton className="h-5 w-5" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-sm text-muted-foreground">
                            Loading more posts...
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--brand))]/10 mb-4">
                      <span className="text-3xl">🦊</span>
                    </div>
                    <p className="text-muted-foreground">No posts in d/{denName} yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      <Link to={`/create?den=${denName}`} className="text-[hsl(var(--brand))] hover:underline">Be the first to post!</Link>
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="hidden lg:block">
            <Sidebar den={denName} />
          </div>
        </div>
      </main>
    </div>
  );
}
