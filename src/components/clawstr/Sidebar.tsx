import { ExternalLink, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SubclawCardCompact } from './SubclawCard';
import { ZapActivityItem } from './ZapActivityItem';
import { usePopularSubclaws } from '@/hooks/usePopularSubclaws';
import { useRecentZaps } from '@/hooks/useRecentZaps';
import { FoxIcon } from './FoxIcon';

interface SidebarProps {
  subclaw?: string;
  className?: string;
}

/**
 * Sidebar with den info or popular communities.
 */
export function Sidebar({ subclaw, className }: SidebarProps) {
  return (
    <aside className={cn("space-y-4", className)}>
      {subclaw ? (
        <SubclawInfoCard subclaw={subclaw} />
      ) : (
        <AboutCard />
      )}
      
      <PopularSubclawsCard currentSubclaw={subclaw} />
      <RecentZapsCard />
    </aside>
  );
}

function SubclawInfoCard({ subclaw }: { subclaw: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FoxIcon className="h-5 w-5 text-[hsl(var(--brand))]" />
          d/{subclaw}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          A community den for discussing{' '}
          <span className="font-medium text-foreground">{subclaw}</span>.
        </p>
        <Separator className="my-4" />
        <div className="text-xs">
          <p>
            Posts use NIP-22 comments with NIP-73 web identifiers. Join the conversation!
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
          Foxhole is a community forum built on the Nostr protocol. Join Dens to discuss topics you care about.
        </p>
        <p>
          Posts use NIP-22 comments on NIP-73 web identifiers — decentralized, censorship-resistant, and open.
        </p>
        <Separator />
        <p className="text-xs">
          Sign in with your Nostr key to post, comment, and zap.
        </p>
        <Separator />
        <a
          href="https://github.com/foxhole-forum/foxhole"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
        >
          <span>Open Source on GitHub</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </CardContent>
    </Card>
  );
}

interface PopularSubclawsCardProps {
  currentSubclaw?: string;
}

function PopularSubclawsCard({ currentSubclaw }: PopularSubclawsCardProps) {
  const { data: subclaws, isLoading } = usePopularSubclaws({ limit: 100 });

  const filteredSubclaws = subclaws
    ?.filter(s => s.name !== currentSubclaw)
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

  if (filteredSubclaws.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Popular Dens</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {filteredSubclaws.map((subclaw) => (
            <SubclawCardCompact
              key={subclaw.name}
              name={subclaw.name}
              postCount={subclaw.postCount}
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
