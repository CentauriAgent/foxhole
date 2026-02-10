import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DenCardCompact } from './DenCard';
import { ZapActivityItem } from './ZapActivityItem';
import { usePopularDens } from '@/hooks/usePopularDens';
import { useRecentZaps } from '@/hooks/useRecentZaps';

interface SidebarProps {
  den?: string;
  className?: string;
}

/**
 * Sidebar with den info or popular communities.
 */
export function Sidebar({ den, className }: SidebarProps) {
  return (
    <aside className={cn("space-y-4", className)}>
      {den ? (
        <DenInfoCard den={den} />
      ) : (
        <AboutCard />
      )}
      
      <PopularDensCard currentDen={den} />
      <RecentZapsCard />
    </aside>
  );
}

function DenInfoCard({ den }: { den: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">🦊</span>
          d/{den}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          A community den for discussing{' '}
          <span className="font-medium text-foreground">{den}</span>.
        </p>
        <Separator className="my-4" />
        <div className="text-xs">
          <p>
            Join the conversation — post, reply, and zap your favorite content!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">🦊</span>
          About Foxhole
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-3">
        <p>
          A community forum where you own your content. Built on Nostr.
        </p>
        <p>
          Join Dens to discuss topics you care about, support great content with Bitcoin zaps, and connect with people — no central authority in control.
        </p>
        <Separator />
        <p className="text-xs">
          Sign in with your Nostr key to post, comment, and zap.
        </p>
      </CardContent>
    </Card>
  );
}

interface PopularDensCardProps {
  currentDen?: string;
}

function PopularDensCard({ currentDen }: PopularDensCardProps) {
  const { data: dens, isLoading } = usePopularDens({ limit: 100 });

  const filteredDens = dens
    ?.filter(s => s.name !== currentDen)
    .slice(0, 10) ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Popular Dens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredDens.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Popular Dens</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {filteredDens.map((den) => (
            <DenCardCompact
              key={den.name}
              name={den.name}
              postCount={den.postCount}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentZapsCard() {
  const { data: recentZaps, isLoading } = useRecentZaps({ limit: 10 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Recent Zaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-2 py-2">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Recent Zaps
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recentZaps && recentZaps.length > 0 ? (
          <div className="divide-y divide-border">
            {recentZaps.map((zap) => (
              <ZapActivityItem
                key={zap.zapReceipt.id}
                zap={zap}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent zaps
          </p>
        )}
      </CardContent>
    </Card>
  );
}
