import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrendingPosts, type TrendingPost } from '@/hooks/useTrendingPosts';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { formatCount } from '@/lib/foxhole';

interface TrendingPostsCardProps {
  /** If provided, show trending within this den only */
  denName?: string;
  className?: string;
}

/**
 * Sidebar widget showing top 5 trending posts from the last 24 hours.
 */
export function TrendingPostsCard({ denName, className }: TrendingPostsCardProps) {
  const { data: trending, isLoading } = useTrendingPosts({ denName, limit: 5 });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
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

  if (!trending || trending.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Trending
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-0.5">
          {trending.map((post) => (
            <TrendingPostRow key={post.event.id} post={post} showDen={!denName} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const TrendingPostRow = memo(function TrendingPostRow({
  post,
  showDen,
}: {
  post: TrendingPost;
  showDen: boolean;
}) {
  const { event, metrics, den } = post;
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(event.pubkey);

  // Truncate content to ~50 chars
  const content = event.content.length > 50
    ? event.content.slice(0, 50).trimEnd() + '…'
    : event.content;

  // Build link to the post
  const postUrl = den ? `/d/${den}/post/${event.id}` : `/d/unknown/post/${event.id}`;

  // Engagement score for badge
  const engagementScore = metrics.upvotes + metrics.zapCount + metrics.replyCount;

  return (
    <Link
      to={postUrl}
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg transition-colors',
        'hover:bg-muted/50',
      )}
    >
      <Avatar className="h-6 w-6 shrink-0 mt-0.5">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback className="text-[10px]">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug line-clamp-2">{content}</p>
        <div className="flex items-center gap-2 mt-1">
          {showDen && den && (
            <span className="text-[10px] text-muted-foreground font-medium">d/{den}</span>
          )}
          {engagementScore > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] font-normal">
              {formatCount(engagementScore)}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
});
