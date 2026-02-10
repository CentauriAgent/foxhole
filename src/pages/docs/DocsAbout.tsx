import { useSeoMeta } from '@unhead/react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { FoxIcon } from '@/components/foxhole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Globe, Heart } from 'lucide-react';

const links = [
  {
    title: 'Nostr Protocol',
    description: 'The decentralized protocol powering Foxhole.',
    url: 'https://github.com/nostr-protocol/nostr',
    icon: Globe,
  },
];

export default function DocsAbout() {
  useSeoMeta({
    title: 'About — Foxhole',
    description: 'Learn about Foxhole, the decentralized community forum built on Nostr.',
  });

  return (
    <DocsLayout>
      <div className="not-prose">
        <div className="flex items-center gap-4 mb-6">
          <FoxIcon className="h-12 w-12 text-[hsl(var(--brand))]" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">About Foxhole</h1>
            <p className="text-lg text-muted-foreground mt-1">Community-driven, open source, decentralized</p>
          </div>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
          <p className="text-lg leading-relaxed">
            Foxhole is a community forum built on the Nostr protocol. It gives people a place to
            gather in Dens (topic-based communities), have discussions, and support each other with
            Bitcoin Lightning zaps — all without a central authority controlling the platform.
          </p>

          <h2>How It Works</h2>
          <ul>
            <li><strong>Dens</strong> are topic-based communities (like subreddits). Anyone can create one by posting to it.</li>
            <li><strong>Posts and replies</strong> are standard Nostr events — decentralized and censorship-resistant.</li>
            <li><strong>Voting</strong> uses reactions to surface the best content.</li>
            <li><strong>Zaps</strong> let you tip content creators with real Bitcoin over Lightning.</li>
            <li><strong>Identity</strong> is just a Nostr keypair — no signup, no email, no phone number.</li>
          </ul>

          <h2>Open Source</h2>
          <p>
            Foxhole is fully open source and welcomes contributions. Whether you want to fix a bug,
            add a feature, or build your own client, the code is yours to use. Source code will be available on GitHub soon.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-12">
          {links.map((link) => (
            <a key={link.title} href={link.url} target="_blank" rel="noopener noreferrer">
              <Card className="h-full hover:border-[hsl(var(--brand))]/50 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <link.icon className="h-4 w-4" />
                    {link.title}
                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>

        <div className="text-center py-8 border-t border-border">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            Built with <Heart className="h-4 w-4 text-red-500" /> on Nostr
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
