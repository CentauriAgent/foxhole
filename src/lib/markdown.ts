import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Check if content contains markdown formatting.
 * This helps us decide whether to render as markdown or plain text.
 */
export function hasMarkdown(text: string): boolean {
  // Check for common markdown patterns
  const patterns = [
    /^#{1,6}\s/m,          // Headers
    /\*\*.+?\*\*/,          // Bold
    /\*.+?\*/,              // Italic (but not URLs with *)
    /~~.+?~~/,              // Strikethrough
    /```[\s\S]*?```/,       // Code blocks
    /`[^`]+`/,              // Inline code
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Ordered lists
    /^\s*>/m,               // Blockquotes
    /\[.+?\]\(.+?\)/,       // Links
    /^\|.*\|/m,             // Tables
    /^---$/m,               // Horizontal rules
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Placeholder map to protect Nostr references from markdown processing.
 */
interface PlaceholderEntry {
  placeholder: string;
  original: string;
}

/**
 * Replace Nostr references (nostr:npub1..., nostr:note1..., etc.) with placeholders
 * so markdown processing doesn't mangle them.
 */
function protectNostrRefs(text: string): { text: string; entries: PlaceholderEntry[] } {
  const entries: PlaceholderEntry[] = [];
  let counter = 0;
  
  const processed = text.replace(
    /nostr:(npub1|note1|nprofile1|nevent1|naddr1)([023456789acdefghjklmnpqrstuvwxyz]+)/g,
    (match) => {
      // No underscores/asterisks in the placeholder — markdown would
      // otherwise reformat it (e.g. __X__ becomes <strong>X</strong>).
      const placeholder = `%%NOSTRREF${counter++}%%`;
      entries.push({ placeholder, original: match });
      return placeholder;
    }
  );
  
  return { text: processed, entries };
}

/**
 * Restore Nostr references from placeholders.
 */
function restoreNostrRefs(html: string, entries: PlaceholderEntry[]): string {
  let result = html;
  for (const { placeholder, original } of entries) {
    result = result.replace(placeholder, original);
  }
  return result;
}

// Runs on every sanitizeHtml() call via DOMPurify's hook system:
// - force external links to open safely in a new tab
// - require http(s) for media sources (DOMPurify's DATA_URI_TAGS default
//   would otherwise let data: URIs through on img/video/source)
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? '';
    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  }

  if (['IMG', 'VIDEO', 'AUDIO', 'SOURCE'].includes(node.tagName)) {
    const src = node.getAttribute('src') ?? '';
    if (src && !/^https?:/i.test(src)) {
      node.removeAttribute('src');
    }
  }
});

/**
 * Sanitize untrusted HTML with DOMPurify before it reaches
 * dangerouslySetInnerHTML. Only http(s)/mailto and app-internal
 * (single-slash relative) URLs are allowed in href/src, which blocks
 * javascript:, data:, and protocol-relative (//host) URIs.
 *
 * Call this on the FINAL HTML string, after all post-processing —
 * sanitizing earlier would leave later string transforms unprotected.
 */
export function sanitizeHtml(html: string, opts?: { stripLinks?: boolean }): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // stripLinks: drop <a> elements (keeping their text) for content rendered
    // inside another link, where nested anchors are invalid HTML.
    FORBID_TAGS: [
      'style', 'form', 'input', 'button', 'textarea', 'select',
      ...(opts?.stripLinks ? ['a'] : []),
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/(?!\/))/i,
  });
}

/**
 * Render markdown content to an HTML string.
 * Protects Nostr references from being mangled by markdown processing.
 *
 * NOTE: the returned HTML is NOT yet sanitized. Callers must run the final
 * HTML (after any additional post-processing) through sanitizeHtml() before
 * rendering it with dangerouslySetInnerHTML.
 */
export function renderMarkdown(content: string): string {
  const { text, entries } = protectNostrRefs(content);
  const html = marked.parse(text, { async: false }) as string;
  return restoreNostrRefs(html, entries);
}
