import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { NostrEvent } from '@nostrify/nostrify';

interface AuthorBadgeProps {
  pubkey: string;
  event?: NostrEvent;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Display author name with avatar.
 */
export function AuthorBadge({ 
  pubkey, 
  event: _event,
  showAvatar = false,
  className,
}: AuthorBadgeProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const profileUrl = `/${npub}`;
  
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <Link 
      to={profileUrl}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium hover:underline transition-colors",
        "text-foreground/80 hover:text-foreground",
        className
      )}
    >
      {showAvatar ? (
        <Avatar className="h-5 w-5">
          <AvatarImage src={metadata?.picture} alt={displayName} />
          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
            {firstLetter}
          </AvatarFallback>
        </Avatar>
      ) : (
        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
          {firstLetter}
        </span>
      )}
      <span className="truncate max-w-[150px]">{displayName}</span>
    </Link>
  );
}
