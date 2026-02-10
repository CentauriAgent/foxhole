import { useSeoMeta } from '@unhead/react';
import { DocsLayout } from '@/components/docs/DocsLayout';
import { FoxIcon } from '@/components/foxhole';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  KeyRound,
  Globe,
  Zap,
  Sparkles,
} from 'lucide-react';

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'What is Foxhole?',
    answer:
      'Foxhole is a decentralized community forum built on the Nostr protocol. Think Reddit, but no central authority controls your account or content. Join Dens (communities), post, discuss, and zap people with Bitcoin.',
  },
  {
    question: 'Why use Nostr?',
    answer:
      "Traditional platforms own your data, control your reach, and can ban you at will. Nostr is an open protocol — your identity is a keypair you control, your content lives on open relays, and no one can deplatform you.",
  },
  {
    question: 'What are Dens?',
    answer:
      'Dens are communities within Foxhole, similar to subreddits. They\'re identified by URLs like /d/gaming or /d/music. Anyone can create a new Den simply by posting to it — no approval needed.',
  },
  {
    question: 'How do I join?',
    answer:
      'You need a Nostr keypair. You can use a browser extension like nos2x or Alby to manage your keys, or generate one directly. Once you have keys, you can post, comment, and interact with any Den.',
  },
  {
    question: 'How do Bitcoin payments work?',
    answer:
      "Users can send and receive Bitcoin via Lightning zaps. Set up a Lightning address on your profile and get tipped for great posts — no middleman, no platform fees.",
  },
  {
    question: 'Is Foxhole open source?',
    answer:
      'Yes! Foxhole is fully open source. The source code will be available on GitHub soon.',
  },
  {
    question: 'What Nostr features does Foxhole use?',
    answer:
      'Foxhole uses standard Nostr specs for posts and replies, community identifiers, reactions for voting, and Lightning zaps for tipping. See the Technical Guide for full details.',
  },
];

export default function DocsIndex() {
  useSeoMeta({
    title: 'Documentation — Foxhole',
    description: 'Learn about Foxhole, the decentralized community forum built on Nostr.',
  });

  return (
    <DocsLayout>
      <div className="not-prose mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(var(--brand))]/20 blur-xl rounded-full" aria-hidden="true" />
            <FoxIcon className="relative h-12 w-12 text-[hsl(var(--brand))]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Foxhole Documentation</h1>
            <p className="text-lg text-muted-foreground mt-1">Your community forum on Nostr</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-[hsl(var(--brand))]/5 to-[hsl(var(--brand))]/10 border border-[hsl(var(--brand))]/20">
          <p className="text-lg leading-relaxed">
            Foxhole is a decentralized community forum where you own your identity and content — powered by the{' '}
            <a href="https://github.com/nostr-protocol/nostr" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--brand))] hover:underline font-medium">
              Nostr protocol
            </a>{' '}
            and{' '}
            <a href="https://lightning.network" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--brand))] hover:underline font-medium">
              Bitcoin Lightning
            </a>.
          </p>
        </div>
      </div>

      <section className="mb-16">
        <h2 className="flex items-center gap-3 text-2xl font-bold mb-6 not-prose">
          <Sparkles className="h-6 w-6 text-[hsl(var(--brand))]" />
          Why Foxhole?
        </h2>

        <div className="space-y-6 not-prose">
          <div className="p-6 rounded-lg bg-card border border-border">
            <h3 className="text-xl font-semibold mb-4">Own Your Community</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <KeyRound className="h-5 w-5 text-[hsl(var(--brand))] shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Your keys, your identity</strong> — No email signup, no phone verification. A cryptographic keypair is all you need.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="h-5 w-5 text-[hsl(var(--brand))] shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Your content, your data</strong> — Posts live on open Nostr relays. No single company controls your content.</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Real money, no middleman</strong> — Tip great content with Bitcoin Lightning zaps. Instant, global, no platform fees.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-6 not-prose">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="not-prose">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left hover:no-underline">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </DocsLayout>
  );
}
