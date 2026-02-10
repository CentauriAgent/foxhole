import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader, Sidebar, PopularPostCard } from '@/components/foxhole';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { useDenPostsInfinite } from '@/hooks/useDenPostsInfinite';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import NotFound from './NotFound';

export default function Den() {
  const { den } = useParams<{ den: string }>();
  const denName = den;
  
  const { 
    data: posts, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useDenPostsInfinite(denName || '', { limit: 50 });

  const { ref, inView } = useInView();

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
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
                  <FoxIcon className="h-10 w-10" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[hsl(var(--brand))]">d/{denName}</h1>
                  <p className="text-muted-foreground">
                    Discussions about {denName}
                  </p>
                </div>
                <Link to={`/create?den=${denName}`}>
                  <Button size="sm" className="gap-1.5 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
                    <PenSquare className="h-4 w-4" />
                    Post
                  </Button>
                </Link>
              </div>
            </header>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Posts
                </h2>
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
                ) : posts && posts.length > 0 ? (
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
