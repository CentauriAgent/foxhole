import { memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFollowSuggestions, type FollowSuggestion } from '@/hooks/useFollowSuggestions';
import { useFollow } from '@/hooks/useFollows';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { identifierToDen } from '@/lib/foxhole';
import { useToast } from '@/hooks/useToast';

/**
 * "Who to Follow" sidebar widget.
 * Shows suggested users based on shared den membership and activity.
 * Only visible to logged-in users who have subscribed to at least one den.
 */
export function WhoToFollowCard({ className }: { className?: string }) {
  const { user } = useCurrentUser();
  const { data: suggestions, isLoading } = useFollowSuggestions({ limit: 5 });

  // Don't render for logged-out users or when no suggestions
  if (!user) return null;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Who to Follow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Who to Follow
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {suggestions.map((suggestion) => (
            <SuggestionRow key={suggestion.pubkey} suggestion={suggestion} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const SuggestionRow = memo(function SuggestionRow({ suggestion }: { suggestion: FollowSuggestion }) {
  const { pubkey, sharedDens, postCount } = suggestion;
  const author = useAuthor(pubkey);
  const follow = useFollow();
  const { toast } = useToast();
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const profileUrl = `/${npub}`;

  const handleFollow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await follow.mutateAsync(pubkey);
      toast({ title: `Followed ${displayName}` });
    } catch {
      toast({ title: 'Failed to follow', variant: 'destructive' });
    }
  }, [follow, pubkey, displayName, toast]);

  if (author.isLoading) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  // Build context string like "Active in 3 dens · 12 posts"
  const contextParts: string[] = [];
  if (sharedDens > 1) {
    contextParts.push(`${sharedDens} shared dens`);
  } else if (sharedDens === 1) {
    contextParts.push('1 shared den');
  }
  if (postCount > 0) {
    contextParts.push(`${postCount} ${postCount === 1 ? 'post' : 'posts'}`);
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        'hover:bg-muted/50',
      )}
    >
      <Link to={profileUrl} className="shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={metadata?.picture} alt={displayName} />
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={profileUrl} className="font-medium text-sm truncate block hover:underline">
          {displayName}
        </Link>
        {contextParts.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {contextParts.join(' · ')}
          </p>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0 h-7 text-xs gap-1"
        onClick={handleFollow}
        disabled={follow.isPending}
      >
        <UserPlus className="h-3 w-3" />
        Follow
      </Button>
    </div>
  );
});
