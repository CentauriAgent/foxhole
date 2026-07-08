import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MessageSquare, Zap, Heart, Loader2, LogIn } from 'lucide-react';
import { useSeoMeta } from '@unhead/react';
import { SiteHeader } from '@/components/foxhole';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications';
import { useAuthor } from '@/hooks/useAuthor';
import { formatRelativeTime } from '@/lib/foxhole';
import { formatSats } from '@/lib/hotScore';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { nip19 } from 'nostr-tools';

type TabValue = 'all' | 'replies' | 'zaps' | 'reactions';

export default function Notifications() {
  const { user } = useCurrentUser();
  const { notifications, replies, zaps, reactions, isLoading } = useNotifications({ limit: 50 });
  const [tab, setTab] = useState<TabValue>('all');

  // Mark notifications as seen when the page is visited
  useEffect(() => {
    if (user) {
      localStorage.setItem('foxhole:lastSeenNotifications', Date.now().toString());
    }
  }, [user]);

  useSeoMeta({
    title: 'Notifications — Foxhole',
    description: 'Your notifications on Foxhole',
  });

  const getItems = (): NotificationItem[] => {
    switch (tab) {
      case 'replies': return replies;
      case 'zaps': return zaps;
      case 'reactions': return reactions;
      default: return notifications;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-6 max-w-2xl">
        {/* Header */}
        <header className="rounded-lg border border-border bg-card p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-brand/10 text-brand">
              <Bell className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Replies, zaps, and reactions
              </p>
            </div>
          </div>
        </header>

        {/* Auth guard */}
        {!user ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Sign in to see notifications</h2>
            <p className="text-muted-foreground text-sm">
              Log in with your Nostr key to view your replies, zaps, and reactions.
            </p>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="all" className="flex-1 gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                All
              </TabsTrigger>
              <TabsTrigger value="replies" className="flex-1 gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Replies
              </TabsTrigger>
              <TabsTrigger value="zaps" className="flex-1 gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Zaps
              </TabsTrigger>
              <TabsTrigger value="reactions" className="flex-1 gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Reactions
              </TabsTrigger>
            </TabsList>

            {/* All tabs share the same rendering */}
            {(['all', 'replies', 'zaps', 'reactions'] as const).map((tabKey) => (
              <TabsContent key={tabKey} value={tabKey}>
                <NotificationList items={getItems()} isLoading={isLoading} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  );
}

function NotificationList({ items, isLoading }: { items: NotificationItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">Loading notifications…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">No notifications yet</p>
        <p className="text-muted-foreground/70 text-sm mt-1">
          When people reply, zap, or react to your posts, you'll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  switch (item.type) {
    case 'reply':
      return <ReplyNotification item={item} />;
    case 'zap':
      return <ZapNotification item={item} />;
    case 'reaction':
      return <ReactionNotification item={item} />;
  }
}

function ReplyNotification({ item }: { item: NotificationItem }) {
  const author = useAuthor(item.event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(item.event.pubkey);
  const npub = nip19.npubEncode(item.event.pubkey);
  const preview = item.replyContent
    ? item.replyContent.length > 120
      ? item.replyContent.slice(0, 120) + '…'
      : item.replyContent
    : '';

  return (
    <div className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
      <Link to={`/${npub}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={metadata?.picture} alt={displayName} />
          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link to={`/${npub}`} className="font-medium text-foreground hover:underline">
            {displayName}
          </Link>
          <span className="text-muted-foreground"> replied to your post</span>
        </p>
        {preview && (
          <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
            {preview}
          </p>
        )}
        <time className="text-xs text-muted-foreground/60 mt-1 block">
          {formatRelativeTime(item.timestamp)}
        </time>
      </div>
      <MessageSquare className="h-4 w-4 text-brand shrink-0 mt-1" />
    </div>
  );
}

function ZapNotification({ item }: { item: NotificationItem }) {
  const senderPubkey = item.senderPubkey;
  const author = useAuthor(senderPubkey);
  const metadata = author.data?.metadata;
  const displayName = senderPubkey
    ? metadata?.name || metadata?.display_name || genUserName(senderPubkey)
    : 'Someone';

  return (
    <div className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/10">
        <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium text-foreground">{displayName}</span>
          <span className="text-muted-foreground"> zapped you </span>
          <span className="font-semibold text-amber-500">{formatSats(item.zapAmount ?? 0)} sats</span>
        </p>
        {item.zapComment && (
          <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
            "{item.zapComment}"
          </p>
        )}
        <time className="text-xs text-muted-foreground/60 mt-1 block">
          {formatRelativeTime(item.timestamp)}
        </time>
      </div>
    </div>
  );
}

function ReactionNotification({ item }: { item: NotificationItem }) {
  const author = useAuthor(item.event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(item.event.pubkey);
  const npub = nip19.npubEncode(item.event.pubkey);

  const reactionEmoji = item.reactionContent === '+' ? '❤️' : item.reactionContent ?? '❤️';

  return (
    <div className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
      <Link to={`/${npub}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={metadata?.picture} alt={displayName} />
          <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link to={`/${npub}`} className="font-medium text-foreground hover:underline">
            {displayName}
          </Link>
          <span className="text-muted-foreground"> reacted to your post</span>
        </p>
        <time className="text-xs text-muted-foreground/60 mt-1 block">
          {formatRelativeTime(item.timestamp)}
        </time>
      </div>
      <span className="text-lg shrink-0 mt-0.5">{reactionEmoji}</span>
    </div>
  );
}
