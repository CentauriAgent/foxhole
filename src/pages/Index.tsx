import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader, Sidebar, PopularPostCard } from '@/components/foxhole';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { useRecentPostsInfinite } from '@/hooks/useRecentPostsInfinite';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCommunitySubscriptions } from '@/hooks/useCommunitySubscriptions';
import { getPostIdentifier } from '@/lib/foxhole';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

const Index = () => {
  const [feedTab, setFeedTab] = useState<'all' | 'yours'>('all');
  const { user } = useCurrentUser();
  const { data: subscriptions } = useCommunitySubscriptions();

  const { 
    data: posts, 
    isLoading: postsLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useRecentPostsInfinite({ limit: 50 });

  const { ref, inView } = useInView();

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (feedTab !== 'yours' || !subscriptions?.length) return posts;
    return posts.filter(post => {
      const id = getPostIdentifier(post.event);
      return id ? subscriptions.includes(id) : false;
    });
  }, [posts, feedTab, subscriptions]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useSeoMeta({
    title: 'Foxhole — Community Forum on Nostr',
    description: 'A community forum built on the Nostr protocol. Join Dens to discuss topics, share ideas, and connect with people.',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="relative border-b border-border bg-gradient-to-b from-background via-background to-card/30">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }} />
        </div>
        
        <div className="pointer-events-none absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="pointer-events-none absolute -top-12 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        
        <div className="container py-16 md:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
                <FoxIcon className="relative h-16 w-16 md:h-20 md:w-20 text-primary drop-shadow-lg" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                  Your Community,
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
                  Your Voice
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A decentralized community forum on Nostr. Join Dens, discuss what matters, and own your content.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-4">
              <Link to="/create">
                <Button size="lg" className="gap-2 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
                  <PenSquare className="h-5 w-5" />
                  Create a Post
                </Button>
              </Link>
              <Link to="/popular">
                <Button size="lg" variant="outline">
                  Browse Dens
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setFeedTab('all')}
                    className={`text-lg font-semibold transition-colors ${feedTab === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    All Posts
                  </button>
                  {user && (
                    <button
                      onClick={() => setFeedTab('yours')}
                      className={`text-lg font-semibold transition-colors ${feedTab === 'yours' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Your Feed
                    </button>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border border-border bg-card divide-y divide-border/50">
                {postsLoading ? (
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
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <>
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
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--brand))]/10 mb-4">
                      <span className="text-3xl">🦊</span>
                    </div>
                    <p className="text-muted-foreground">No posts yet — be the first!</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      <Link to="/create" className="text-[hsl(var(--brand))] hover:underline">Create a post</Link> to get the conversation started.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
