import { describe, it, expect } from 'vitest';

import { hasMarkdown, renderMarkdown, sanitizeHtml } from './markdown';

/** Render + sanitize, mirroring the NoteContent pipeline's final step. */
function renderSafe(content: string): string {
  return sanitizeHtml(renderMarkdown(content));
}

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).not.toContain('script');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeHtml('<img src="https://example.com/a.png" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('img');
  });

  it('blocks javascript: URLs in links', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  it('blocks data: URLs in links and images', () => {
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')).not.toContain('data:');
    expect(sanitizeHtml('<img src="data:image/svg+xml,<svg onload=alert(1)>">')).not.toContain('data:');
  });

  it('blocks protocol-relative URLs', () => {
    expect(sanitizeHtml('<a href="//evil.example/x">x</a>')).not.toContain('href');
  });

  it('allows https links and adds safe target/rel', () => {
    const out = sanitizeHtml('<a href="https://example.com/page">x</a>');
    expect(out).toContain('href="https://example.com/page"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('allows app-internal relative links without forcing new tab', () => {
    const out = sanitizeHtml('<a href="/d/foxes">#foxes</a>');
    expect(out).toContain('href="/d/foxes"');
    expect(out).not.toContain('target="_blank"');
  });

  it('strips iframe/object/embed/style/form elements', () => {
    for (const html of [
      '<iframe src="https://evil.example"></iframe>',
      '<object data="https://evil.example"></object>',
      '<embed src="https://evil.example">',
      '<style>body{display:none}</style>',
      '<form action="https://evil.example"><input name="a"></form>',
    ]) {
      const out = sanitizeHtml(html);
      expect(out).not.toMatch(/<(iframe|object|embed|style|form|input)\b/i);
    }
  });

  it('survives nested-tag script smuggling', () => {
    const out = sanitizeHtml('<scr<script>ipt>alert(1)</scr</script>ipt>');
    expect(out).not.toContain('<script');
  });
});

describe('renderMarkdown + sanitizeHtml pipeline', () => {
  it('renders markdown links but defuses javascript: hrefs', () => {
    const out = renderSafe('[click me](javascript:alert(1))');
    expect(out).not.toContain('javascript:');
  });

  it('keeps normal markdown formatting', () => {
    const out = renderSafe('**bold** and [link](https://example.com)');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('href="https://example.com"');
  });

  it('preserves nostr references through markdown processing', () => {
    const npub = 'nostr:npub1zg69v7ys40x77y352eufp27daufrg4ncjnfvvxrpm9r743cvnvdsyqqjxr';
    const out = renderMarkdown(`hello ${npub}`);
    expect(out).toContain(npub);
  });

  it('strips raw HTML injection in markdown content', () => {
    const out = renderSafe('hello <img src=x onerror=alert(1)> world');
    expect(out).not.toContain('onerror');
  });
});

describe('hasMarkdown', () => {
  it('detects markdown content', () => {
    expect(hasMarkdown('# Heading')).toBe(true);
    expect(hasMarkdown('**bold**')).toBe(true);
    expect(hasMarkdown('[x](https://example.com)')).toBe(true);
  });

  it('does not flag plain text', () => {
    expect(hasMarkdown('just a plain note')).toBe(false);
  });
});
