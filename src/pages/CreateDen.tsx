import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '@/components/foxhole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCreateDenMetadata } from '@/hooks/useDenMetadata';
import { useSubscribeToCommunity } from '@/hooks/useCommunitySubscriptions';
import { MiniAccountSelector } from '@/components/auth/MiniAccountSelector';
import LoginDialog from '@/components/auth/LoginDialog';
import { createPostTags, denToIdentifier } from '@/lib/foxhole';
import { FoxIcon } from '@/components/foxhole/FoxIcon';
import { Plus, Tent, Send, BookOpen, ShieldCheck } from 'lucide-react';
import { usePopularDens } from '@/hooks/usePopularDens';

export default function CreateDen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [firstPost, setFirstPost] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'review'>('details');

  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: createMetadata, isPending: isCreatingMetadata } = useCreateDenMetadata();
  const { mutateAsync: subscribe } = useSubscribeToCommunity();
  const { data: existingDens } = usePopularDens({ limit: 500 });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isPending = isPublishing || isCreatingMetadata;

  const sanitizedName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const denExists = existingDens?.some(d => d.name === sanitizedName) ?? false;

  useSeoMeta({
    title: 'Create a Den — Foxhole',
    description: 'Start a new community den on Foxhole',
  });

  const handleNameChange = (value: string) => {
    setName(value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
    setError('');
  };

  const handleContinue = () => {
    if (!sanitizedName) {
      setError('Please enter a den name');
      return;
    }
    if (sanitizedName.length < 2) {
      setError('Den name must be at least 2 characters');
      return;
    }
    if (sanitizedName.length > 32) {
      setError('Den name must be 32 characters or fewer');
      return;
    }
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    setStep('review');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    try {
      // 1. Publish den metadata (kind 30078)
      if (description.trim() || rules.trim()) {
        await createMetadata({
          name: sanitizedName,
          description: description.trim(),
          rules: rules.trim(),
        });
      }

      // 2. Auto-subscribe the creator to the den
      const identifier = denToIdentifier(sanitizedName);
      await subscribe(identifier);

      // 3. If there's a first post, publish it
      if (firstPost.trim()) {
        const tags = createPostTags(sanitizedName);
        await publishEvent({
          kind: 1111,
          content: firstPost.trim(),
          tags,
        });
      }

      // 4. Invalidate queries and navigate
      queryClient.invalidateQueries({ queryKey: ['foxhole'] });
      navigate(`/d/${sanitizedName}`);
    } catch (err) {
      setError(`Failed to create den: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand/10 text-brand">
                <Tent className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Create a Den</h1>
                <p className="text-sm text-muted-foreground font-normal">Start a new community on Foxhole</p>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {!user ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10">
                  <FoxIcon className="h-8 w-8 text-brand" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-4">Sign in with your Nostr key to create a den</p>
                  <Button onClick={() => setShowLoginDialog(true)} className="bg-brand hover:bg-brand/90 text-brand-foreground">
                    Sign In
                  </Button>
                </div>
              </div>
            ) : step === 'details' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Creating as</span>
                  <MiniAccountSelector onAddAccountClick={() => setShowLoginDialog(true)} />
                </div>

                {/* Den Name */}
                <div className="space-y-2">
                  <label htmlFor="den-name" className="text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Den Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">d/</span>
                    <Input
                      id="den-name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="gaming, music, nostr..."
                      className="flex-1"
                      maxLength={32}
                      autoFocus
                    />
                  </div>
                  {sanitizedName && (
                    <div className="flex items-center gap-2 text-xs">
                      {denExists ? (
                        <span className="text-amber-500">⚠️ d/{sanitizedName} already has posts — you&apos;ll be adding metadata to an existing den</span>
                      ) : (
                        <span className="text-green-500">✓ d/{sanitizedName} is available</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="den-description" className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Description
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    id="den-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this den about? Help people understand what to post here."
                    className="min-h-[80px] resize-y"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
                </div>

                {/* Rules */}
                <div className="space-y-2">
                  <label htmlFor="den-rules" className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Rules
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    id="den-rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Community guidelines, one per line. e.g.&#10;1. Be respectful&#10;2. Stay on topic&#10;3. No spam"
                    className="min-h-[80px] resize-y"
                    maxLength={1000}
                  />
                </div>

                {/* First Post */}
                <div className="space-y-2">
                  <label htmlFor="first-post" className="text-sm font-medium flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    First Post
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <Textarea
                    id="first-post"
                    value={firstPost}
                    onChange={(e) => setFirstPost(e.target.value)}
                    placeholder="Welcome to d/your-den! Write an introduction for the community..."
                    className="min-h-[100px] resize-y"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => navigate('/dens')}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!sanitizedName}
                    className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
                  >
                    Review
                  </Button>
                </div>
              </div>
            ) : (
              /* Review Step */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand">
                      <FoxIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-brand">d/{sanitizedName}</h2>
                      {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                  </div>

                  {rules && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Rules</h3>
                      <p className="text-sm whitespace-pre-line">{rules}</p>
                    </div>
                  )}

                  {firstPost && (
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">First Post</h3>
                      <p className="text-sm whitespace-pre-line">{firstPost}</p>
                    </div>
                  )}

                  {!description && !rules && !firstPost && (
                    <p className="text-sm text-muted-foreground">
                      Den will be created with no description, rules, or initial post. You can always add these later.
                    </p>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Den metadata will be published to your relays</p>
                  <p>✓ You&apos;ll be auto-subscribed to d/{sanitizedName}</p>
                  {firstPost && <p>✓ Your first post will be published</p>}
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={isPending}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
                  >
                    <Tent className="h-4 w-4" />
                    {isPending ? 'Creating...' : 'Dig a New Den'}
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
