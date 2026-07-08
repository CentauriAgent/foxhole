import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Users, LogIn } from 'lucide-react';
import { SiteHeader, PopularPostCard } from '@/components/foxhole';
import { useFollowingFeed } from '@/hooks/useFollowingFeed';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

export default function Following() {
  const {
    data: posts,
    isLoading,
    isLoggedIn,
    hasFollows,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFollowingFeed({ limit: 50 });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useSeoMeta({
    title: 'Following — Foxhole',
    description: 'Posts from accounts you follow on Foxhole',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <header className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary">
                <Users className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Following</h1>
                <p className="text-muted-foreground">
                  Posts from people you follow
                </p>
              </div>
            </div>
          </header>

          {/* Auth guard */}
          {!isLoggedIn ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">
                Sign in to see posts from people you follow
              </p>
            </div>
          ) : !hasFollows && !isLoading ? (
            /* Empty follows state */
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">
                You're not following anyone yet.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Find users to follow on the{' '}
                <Link to="/popular" className="text-brand hover:underline">
                  Popular
                </Link>{' '}
                page or by{' '}
                <Link to="/search" className="text-brand hover:underline">
                  searching
                </Link>.
              </p>
            </div>
          ) : (
            /* Feed */
            <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))
              ) : posts.length > 0 ? (
                <>
                  {posts.map((post) => (
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
                          <div className="flex flex-col items-center gap-1">
                            <Skeleton className="h-5 w-5" />
                            <Skeleton className="h-4 w-6" />
                            <Skeleton className="h-5 w-5" />
                          </div>
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">No posts from your follows yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Posts from people you follow will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
