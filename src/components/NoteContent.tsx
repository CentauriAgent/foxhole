import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';
import { hasMarkdown, renderMarkdown, sanitizeHtml } from '@/lib/markdown';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

/** Parses content of text note events so that URLs and hashtags are linkified. 
 *  Supports markdown rendering when content contains markdown formatting. */
export function NoteContent({
  event, 
  className, 
}: NoteContentProps) {
  const isMarkdown = useMemo(() => hasMarkdown(event.content), [event.content]);

  // Markdown rendering path
  const markdownHtml = useMemo(() => {
    if (!isMarkdown) return '';
    let html = renderMarkdown(event.content);

    // Post-process: convert bare image URLs (inside <a> tags) to inline <img> elements
    // Matches <a href="imageUrl">imageUrl</a> and replaces with <a><img></a>
    html = html.replace(
      /<a\s+href="(https?:\/\/[^"]+?\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^"]*)?)"[^>]*>\s*https?:\/\/[^<]+?\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^<]*)?\s*<\/a>/gi,
      (_, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block my-2"><img src="${url}" alt="" loading="lazy" class="max-w-full max-h-[500px] rounded-lg border border-border object-contain" /></a>`;
      }
    );

    // Also handle bare image URLs not yet wrapped in <a> tags (e.g. in <p> tags)
    html = html.replace(
      /(?<!href="|src=")(https?:\/\/[^\s"<]+?\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^\s"<]*)?)/gi,
      (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block my-2"><img src="${url}" alt="" loading="lazy" class="max-w-full max-h-[500px] rounded-lg border border-border object-contain" /></a>`;
      }
    );
    
    // Post-process: convert nostr: references to links
    html = html.replace(
      /nostr:(npub1|note1|nprofile1|nevent1|naddr1)([023456789acdefghjklmnpqrstuvwxyz]+)/g,
      (match, prefix, data) => {
        const id = `${prefix}${data}`;
        if (prefix === 'npub1' || prefix === 'nprofile1') {
          return `<a href="/${id}" class="text-brand font-medium hover:underline">@${id.slice(0, 12)}…</a>`;
        }
        return `<a href="/${id}" class="text-brand hover:underline break-all">${match}</a>`;
      }
    );

    // Post-process: convert hashtags to den links (but not inside HTML tags or code blocks)
    html = html.replace(
      /(?<![&\w/])#(\w+)/g,
      (match, tag) => {
        return `<a href="/d/${tag.toLowerCase()}" class="text-brand hover:underline">${match}</a>`;
      }
    );

    // Sanitize the final HTML (DOMPurify): strips script/event handlers and
    // blocks javascript:/data: URLs, and marks external links to open in a
    // new tab. This MUST be the last step before dangerouslySetInnerHTML.
    return sanitizeHtml(html);
  }, [event.content, isMarkdown]);
  
  // Plain text rendering path (original logic)
  const content = useMemo(() => {
    if (isMarkdown) return [];
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
        const isVideo = /\.(mp4|webm|mov|ogg|m4v|mkv)(\?.*)?$/.test(lower);

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
              className="text-brand hover:underline break-all"
            >
              {url}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
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
            parts.push(
              <Link 
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-brand hover:underline break-all"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        const tag = hashtag.slice(1).toLowerCase();
        parts.push(
          <Link 
            key={`hashtag-${keyCounter++}`}
            to={`/d/${tag}`}
            className="text-brand hover:underline"
          >
            {hashtag}
          </Link>
        );
      }
      
      lastIndex = index + fullMatch.length;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    if (parts.length === 0) {
      parts.push(text);
    }
    
    return parts;
  }, [event.content, isMarkdown]);

  if (isMarkdown) {
    return (
      <div 
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none wrap-break-word",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-a:text-brand prose-a:no-underline prose-a:hover:underline",
          "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm",
          "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
          "prose-blockquote:border-l-brand prose-blockquote:text-muted-foreground",
          "prose-img:rounded-lg prose-img:border prose-img:border-border",
          className
        )}
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />
    );
  }

  return (
    <div className={cn("whitespace-pre-wrap wrap-break-word", className)}>
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
          ? "text-brand" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      @{displayName}
    </Link>
  );
}
