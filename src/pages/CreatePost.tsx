import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '@/components/foxhole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { MiniAccountSelector } from '@/components/auth/MiniAccountSelector';
import LoginDialog from '@/components/auth/LoginDialog';
import { createPostTags } from '@/lib/foxhole';
import { PenSquare, Send } from 'lucide-react';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { ImageUpload, buildImetaTags, appendImageUrls } from '@/components/foxhole/ImageUpload';
import type { UploadedImage } from '@/components/foxhole/ImageUpload';

export default function CreatePost() {
  const [searchParams] = useSearchParams();
  const defaultDen = searchParams.get('den') || '';
  
  const [den, setDen] = useState(defaultDen);
  const [content, setContent] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [error, setError] = useState('');
  const [attachedImages, setAttachedImages] = useState<UploadedImage[]>([]);

  const { user } = useCurrentUser();
  const { mutate: publishEvent, isPending } = useNostrPublish();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useSeoMeta({
    title: 'Create Post — Foxhole',
    description: 'Share something with the community',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedDen = den.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const trimmedContent = content.trim();

    if (!trimmedDen) {
      setError('Please enter a Den name');
      return;
    }
    if (!trimmedContent) {
      setError('Please enter some content');
      return;
    }
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    const tags = createPostTags(trimmedDen);
    const imetaTags = buildImetaTags(attachedImages);
    tags.push(...imetaTags);

    const finalContent = appendImageUrls(trimmedContent, attachedImages);

    publishEvent(
      {
        kind: 1111,
        content: finalContent,
        tags,
      },
      {
        onSuccess: (event) => {
          queryClient.invalidateQueries({ queryKey: ['foxhole'] });
          navigate(`/d/${trimmedDen}/post/${event.id}`);
        },
        onError: (err) => {
          setError(`Failed to publish: ${err.message}`);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
                <PenSquare className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Create a Post</h1>
                <p className="text-sm text-muted-foreground font-normal">Share something with the community</p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!user ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--brand))]/10">
                  <FoxIcon className="h-8 w-8 text-[hsl(var(--brand))]" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-4">Sign in with your Nostr key to create a post</p>
                  <Button onClick={() => setShowLoginDialog(true)} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
                    Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Posting as</span>
                  <MiniAccountSelector onAddAccountClick={() => setShowLoginDialog(true)} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="den" className="text-sm font-medium">
                    Den
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">d/</span>
                    <Input
                      id="den"
                      value={den}
                      onChange={(e) => setDen(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="gaming, music, nostr..."
                      className="flex-1"
                      disabled={isPending}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose an existing Den or create a new one by typing its name
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="text-sm font-medium">
                    Content
                  </label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="min-h-[200px] resize-y"
                    disabled={isPending}
                  />
                  <ImageUpload
                    images={attachedImages}
                    onImagesChange={setAttachedImages}
                    disabled={isPending}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !den.trim() || !content.trim()}
                    className="gap-2 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]"
                  >
                    <Send className="h-4 w-4" />
                    {isPending ? 'Publishing...' : 'Dig a New Post'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        onLogin={() => setShowLoginDialog(false)}
      />
    </div>
  );
}
