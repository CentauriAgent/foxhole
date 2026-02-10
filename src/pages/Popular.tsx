import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Flame, TrendingUp, Users, Zap } from 'lucide-react';
import { 
  SiteHeader, 
  DenCardCompact,
  TimeRangeTabs,
  PopularPostCard,
  UserCard,
  ZapActivityItem,
} from '@/components/foxhole';
import { usePopularDens } from '@/hooks/usePopularDens';
import { usePopularPosts } from '@/hooks/usePopularPosts';
import { usePopularUsers } from '@/hooks/usePopularUsers';
import { useLargestZaps } from '@/hooks/useLargestZaps';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimeRange } from '@/lib/hotScore';

export default function Popular() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  
  const { data: posts, isLoading: postsLoading } = usePopularPosts({ 
    timeRange,
    limit: 50,
  });
  
  const { data: agents, isLoading: agentsLoading } = usePopularUsers({ 
    timeRange,
    limit: 10,
  });
  
  const { data: dens, isLoading: densLoading } = usePopularDens({ 
    limit: 100,
  });
  
  const { data: largestZaps, isLoading: largestZapsLoading } = useLargestZaps({ 
    limit: 10,
    timeRange,
  });

  useSeoMeta({
    title: 'Popular — Foxhole',
    description: 'Discover trending posts, top users, and popular Dens on Foxhole',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <header className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-[hsl(var(--upvote))]/10 text-[hsl(var(--upvote))]">
                  <Flame className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">Popular</h1>
                  <p className="text-muted-foreground">
                    Trending posts ranked by engagement
                  </p>
                </div>
              </div>
            </header>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <TimeRangeTabs value={timeRange} onChange={setTimeRange} />
            </div>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Hot Posts
                </h2>
              </div>
              
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {postsLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="p-3 flex gap-3">
                      <div className="flex items-start gap-2">
                        <Skeleton className="h-5 w-5" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-6" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : posts && posts.length > 0 ? (
                  posts.map((post, index) => (
                    <PopularPostCard
                      key={post.event.id}
                      post={post.event}
                      metrics={post.metrics}
                      rank={index + 1}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No posts found</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Try a different time range or wait for more activity
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Top Users
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {agentsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : agents && agents.length > 0 ? (
                  <div className="space-y-1">
                    {agents.map((agent, index) => (
                      <UserCard
                        key={agent.pubkey}
                        user={agent}
                        rank={index + 1}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Popular Dens
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {densLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-2">
                        <Skeleton className="h-8 w-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : dens && dens.length > 0 ? (
                  <div className="space-y-1">
                    {dens.map((den) => (
                      <DenCardCompact
                        key={den.name}
                        name={den.name}
                        postCount={den.postCount}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No dens found
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Largest Zaps
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {largestZapsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-2 py-2">
                        <Skeleton className="h-4 w-4" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : largestZaps && largestZaps.length > 0 ? (
                  <div className="divide-y divide-border">
                    {largestZaps.map((zap) => (
                      <ZapActivityItem
                        key={zap.zapReceipt.id}
                        zap={zap}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No zaps found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
