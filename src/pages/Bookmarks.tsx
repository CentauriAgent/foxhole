import { Bookmark, Loader2, LogIn } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { SiteHeader, PostList } from '@/components/foxhole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useBookmarks } from '@/hooks/useBookmarks';

export default function Bookmarks() {
  const { user } = useCurrentUser();
  const { bookmarkedIds, isLoading: bookmarksLoading } = useBookmarks();
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'Bookmarks — Foxhole',
    description: 'Your saved posts on Foxhole',
  });

  const ids = Array.from(bookmarkedIds);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['bookmark-posts', ...ids],
    queryFn: async ({ signal }) => {
      if (ids.length === 0) return [] as NostrEvent[];

      const timeout = AbortSignal.timeout(8000);
      const combinedSignal = AbortSignal.any([signal, timeout]);

      const events = await nostr.query(
        [{ ids, limit: ids.length }],
        { signal: combinedSignal },
      ).catch(() => [] as NostrEvent[]);

      // Sort by created_at descending
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: ids.length > 0,
    staleTime: 30_000,
  });

  const isLoading = bookmarksLoading || (ids.length > 0 && postsLoading);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-6 max-w-2xl">
        {/* Header */}
        <header className="rounded-lg border border-border bg-card p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-brand/10 text-brand">
              <Bookmark className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Bookmarks</h1>
              <p className="text-muted-foreground">
                Your saved posts
              </p>
            </div>
          </div>
        </header>

        {/* Auth guard */}
        {!user ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Sign in to save bookmarks</h2>
            <p className="text-muted-foreground text-sm">
              Log in with your Nostr key to save and view your bookmarked posts.
            </p>
          </div>
        ) : isLoading ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Loading bookmarks…</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <PostList
              posts={posts ?? []}
              isLoading={false}
              showDen
              emptyMessage="No bookmarks yet. Save posts with the bookmark button."
            />
          </div>
        )}
      </main>
    </div>
  );
}
