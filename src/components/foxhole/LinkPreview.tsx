import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LinkPreviewData } from '@/hooks/useLinkPreview';

interface LinkPreviewProps {
  data: LinkPreviewData;
  className?: string;
}

/**
 * Open Graph link preview card — shows title, description, image, and domain
 * for the first URL found in a post.
 */
export function LinkPreview({ data, className }: LinkPreviewProps) {
  const { title, description, image, url, domain } = data;

  // Don't render if there's nothing meaningful to show
  if (!title && !description && !image) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block mt-2 rounded-lg border border-border overflow-hidden",
        "bg-muted/30 hover:bg-muted/60 transition-colors",
        "no-underline",
        className
      )}
    >
      {image && (
        <div className="w-full max-h-[200px] overflow-hidden border-b border-border">
          <img
            src={image}
            alt={title || ''}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        {title && (
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-0.5">
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{domain}</span>
        </div>
      </div>
    </a>
  );
}
