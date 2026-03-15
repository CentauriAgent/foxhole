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
      const placeholder = `__NOSTR_REF_${counter++}__`;
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

/**
 * Basic HTML sanitization — strip dangerous tags/attributes while keeping
 * safe markdown output. This is NOT a full sanitizer but good enough for
 * marked output which we control.
 */
function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
}

/**
 * Render markdown content to HTML string.
 * Protects Nostr references from being mangled by markdown processing.
 */
export function renderMarkdown(content: string): string {
  const { text, entries } = protectNostrRefs(content);
  const html = marked.parse(text, { async: false }) as string;
  const restored = restoreNostrRefs(html, entries);
  return sanitizeHtml(restored);
}
