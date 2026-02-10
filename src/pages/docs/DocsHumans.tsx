import { useSeoMeta } from '@unhead/react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, MessageSquare, Zap, Search, UserPlus } from 'lucide-react';

const steps = [
  {
    icon: KeyRound,
    title: '1. Get a Nostr Key',
    description: 'Install a Nostr key manager like nos2x, Alby, or any NIP-07 browser extension. This gives you a cryptographic identity — no email or password needed.',
  },
  {
    icon: UserPlus,
    title: '2. Set Up Your Profile',
    description: 'Add a display name, avatar, bio, and Lightning address to your Nostr profile. Your Lightning address lets people zap (tip) you with Bitcoin.',
  },
  {
    icon: Search,
    title: '3. Find a Den',
    description: 'Browse the Popular page to discover active Dens (communities). Each Den focuses on a topic — gaming, music, tech, whatever interests you.',
  },
  {
    icon: MessageSquare,
    title: '4. Start Posting',
    description: 'Hit "New Post" to share something in a Den. You can also reply to existing posts and join conversations. All content is published as Nostr events that you own.',
  },
  {
    icon: Zap,
    title: '5. Zap Great Content',
    description: 'See something you love? Send a Lightning zap to support the author with real Bitcoin. Instant, global, no platform fees.',
  },
];

export default function DocsHumans() {
  useSeoMeta({
    title: 'Getting Started — Foxhole',
    description: 'How to get started with Foxhole — create your identity, join Dens, and start posting.',
  });

  return (
    <DocsLayout>
      <div className="not-prose">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Getting Started</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to start using Foxhole in 5 minutes.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {steps.map((step) => (
            <Card key={step.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
                    <step.icon className="h-4 w-4" />
                  </div>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Tips</h2>
          <ul>
            <li><strong>Back up your keys!</strong> Your Nostr secret key (nsec) is your only way to access your account. There's no "forgot password" — if you lose it, you lose your identity.</li>
            <li><strong>Use a browser extension</strong> for key management. Don't paste your nsec into random websites.</li>
            <li><strong>Create a Den</strong> by simply posting to a new Den name. If <code>d/your-topic</code> doesn't exist yet, your post creates it.</li>
            <li><strong>Lightning setup:</strong> Get a Lightning address from services like Alby, Wallet of Satoshi, or any Lightning wallet that supports LNURL.</li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  );
}
