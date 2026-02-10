import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { MiniAccountSelector } from '@/components/auth/MiniAccountSelector';
import { Send } from 'lucide-react';
import { denToIdentifier, HASHTAG_KIND } from '@/lib/foxhole';

import LoginDialog from '@/components/auth/LoginDialog';

interface NostrCommentFormProps {
  den: string;
  postId: string;
  /** The root thread post ID (for nested replies). If omitted, postId is used as root. */
  rootPostId?: string;
  onSuccess?: () => void;
  placeholder?: string;
  /** Compact mode for inline reply forms */
  compact?: boolean;
}

/**
 * A comment form for posting NIP-22 comments.
 * Supports both top-level replies (to a post) and nested replies (to a comment).
 */
export function NostrCommentForm({ den, postId, rootPostId, onSuccess, placeholder, compact }: NostrCommentFormProps) {
  const [content, setContent] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();

  const rootId = rootPostId || postId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !user) return;

    const identifier = denToIdentifier(den);

    const tags: string[][] = [
      ['I', identifier],
      ['K', HASHTAG_KIND],
      ['E', rootId],
      ['e', postId],
      ['k', '1111'],
    ];

    publishEvent(
      {
        kind: 1111,
        content: content.trim(),
        tags,
      },
      {
        onSuccess: () => {
          setContent('');
          queryClient.invalidateQueries({
            queryKey: ['foxhole', 'post-replies'],
          });
          queryClient.invalidateQueries({
            queryKey: ['foxhole', 'comment-replies'],
          });
          onSuccess?.();
        },
      }
    );
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || "Write a reply..."}
          className="min-h-[40px] h-10 resize-none text-sm py-2"
          disabled={isPending}
          rows={1}
        />
        <Button 
          type="submit" 
          disabled={!content.trim() || isPending}
          size="sm"
          className="self-end"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Posting as</span>
        <MiniAccountSelector onAddAccountClick={() => setShowLoginDialog(true)} />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder || "Write a comment..."}
          className="min-h-[80px] resize-none"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!content.trim() || isPending}
            size="sm"
          >
            <Send className="h-3.5 w-3.5 mr-2" />
            {isPending ? 'Posting...' : 'Comment'}
          </Button>
        </div>
      </form>
      
      <LoginDialog 
        isOpen={showLoginDialog} 
        onClose={() => setShowLoginDialog(false)}
        onLogin={() => setShowLoginDialog(false)}
      />
    </div>
  );
}
