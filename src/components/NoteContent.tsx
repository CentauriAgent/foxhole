import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified. */
export function NoteContent({
  event, 
  className, 
}: NoteContentProps) {  
  // Process the content to render mentions, links, etc.
  const content = useMemo(() => {
    const text = event.content;
    
    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;
      
      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      if (url) {
        const cleanUrl = url.replace(/[).,;:!?]+$/, ''); // strip trailing punctuation
        const lower = cleanUrl.toLowerCase();
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/.test(lower) ||
          lower.includes('nostr.build') && /\.(jpg|jpeg|png|gif|webp)/.test(lower);
        const isVideo = /\.(mp4|webm|mov|ogg)(\?.*)?$/.test(lower);

        if (isImage) {
          parts.push(
            <a key={`img-${keyCounter++}`} href={cleanUrl} target="_blank" rel="noopener noreferrer" className="block my-2">
              <img
                src={cleanUrl}
                alt=""
                loading="lazy"
                className="max-w-full max-h-[500px] rounded-lg border border-border object-contain"
              />
            </a>
          );
          // Add any stripped trailing chars back as text
          if (cleanUrl.length < url.length) {
            parts.push(url.slice(cleanUrl.length));
          }
        } else if (isVideo) {
          parts.push(
            <video
              key={`vid-${keyCounter++}`}
              src={cleanUrl}
              controls
              preload="metadata"
              className="max-w-full max-h-[500px] rounded-lg border border-border my-2"
            />
          );
          if (cleanUrl.length < url.length) {
            parts.push(url.slice(cleanUrl.length));
          }
        } else {
          parts.push(
            <a 
              key={`url-${keyCounter++}`}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--brand))] hover:underline break-all"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);
          
          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else if (decoded.type === 'nprofile') {
            const pubkey = decoded.data.pubkey;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else {
            // For other types, just show as a link
            parts.push(
              <Link 
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-[hsl(var(--brand))] hover:underline break-all"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags - link to den
        const tag = hashtag.slice(1).toLowerCase(); // Remove the # and lowercase
        parts.push(
          <Link 
            key={`hashtag-${keyCounter++}`}
            to={`/d/${tag}`}
            className="text-[hsl(var(--brand))] hover:underline"
          >
            {hashtag}
          </Link>
        );
      }
      
      lastIndex = index + fullMatch.length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      parts.push(text);
    }
    
    return parts;
  }, [event.content]);

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {content.length > 0 ? content : event.content}
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link 
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName 
          ? "text-[hsl(var(--brand))]" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      @{displayName}
    </Link>
  );
}