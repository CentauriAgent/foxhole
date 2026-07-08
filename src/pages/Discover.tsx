import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Compass, MessageSquare } from 'lucide-react';
import { SiteHeader } from '@/components/foxhole';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDiscoverDens, type DiscoverDen } from '@/hooks/useDiscoverDens';
import { useSubscribeToCommunity } from '@/hooks/useCommunitySubscriptions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { denToIdentifier, formatCount, formatRelativeTime } from '@/lib/foxhole';

const Discover = () => {
  const { data: dens, isLoading } = useDiscoverDens();
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Discover Dens — Foxhole',
    description: 'Discover new dens (communities) to join on Foxhole. Find active discussions and expand your horizons.',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-8 max-w-4xl">
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Compass className="h-8 w-8 text-brand" />
            Discover Dens
          </h1>
          <p className="text-muted-foreground">
            {user
              ? 'Dens you haven\'t joined yet — sorted by activity in the last 7 days.'
              : 'The most active dens in the last 7 days. Sign in to subscribe!'}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[180px] rounded-lg" />
            ))}
          </div>
        ) : !dens || dens.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 mb-4">
              <span className="text-3xl">🦊</span>
            </div>
            <p className="text-muted-foreground">
              {user
                ? 'You\'ve already joined all the active dens! Check back later.'
                : 'No active dens found. Be the first to create one!'}
            </p>
            <Link to="/create-den" className="mt-4 inline-block">
              <Button variant="outline">Create a Den</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {dens.map((den) => (
              <DiscoverDenCard key={den.name} den={den} loggedIn={!!user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function DiscoverDenCard({ den, loggedIn }: { den: DiscoverDen; loggedIn: boolean }) {
  const subscribeMutation = useSubscribeToCommunity();
  const { toast } = useToast();

  const handleSubscribe = useCallback(async () => {
    try {
      await subscribeMutation.mutateAsync(denToIdentifier(den.name));
      toast({ title: `Joined d/${den.name}` });
    } catch {
      toast({ title: 'Failed to join', variant: 'destructive' });
    }
  }, [subscribeMutation, den.name, toast]);

  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 space-y-3',
      'hover:border-brand/50 transition-colors',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to={`/d/${den.name}`} className="flex items-center gap-3 group">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-brand/10 text-brand',
            'transition-transform group-hover:scale-105',
          )}>
            <FoxIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors">
              d/{den.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {formatCount(den.postCount)} {den.postCount === 1 ? 'post' : 'posts'} this week
            </div>
          </div>
        </Link>

        {loggedIn && (
          <Button
            onClick={handleSubscribe}
            disabled={subscribeMutation.isPending}
            size="sm"
            className="bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {subscribeMutation.isPending ? 'Joining...' : 'Join'}
          </Button>
        )}
      </div>

      {/* Recent post previews */}
      {den.recentPosts.length > 0 && (
        <div className="space-y-1 pl-1">
          {den.recentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/d/${den.name}/post/${post.id}`}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors truncate py-0.5"
            >
              <span className="text-foreground/50 mr-1">·</span>
              {post.content.length > 80 ? post.content.slice(0, 80).trimEnd() + '…' : post.content}
              <span className="text-xs text-muted-foreground/70 ml-2">
                {formatRelativeTime(post.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discover;
