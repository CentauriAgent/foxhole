import { useState, useEffect, useCallback, useRef } from 'react';

export interface PostDraft {
  den: string;
  content: string;
  updatedAt: number;
}

const DRAFT_KEY = 'foxhole-post-draft';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

/**
 * Hook for autosaving post drafts to localStorage.
 * Debounces writes to avoid excessive storage operations.
 */
export function usePostDraft(defaultDen: string = '') {
  const [den, setDen] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: PostDraft = JSON.parse(saved);
        // Only restore if draft is less than 7 days old
        if (Date.now() - draft.updatedAt < 7 * 24 * 60 * 60 * 1000) {
          return draft.den || defaultDen;
        }
      }
    } catch { /* ignore */ }
    return defaultDen;
  });

  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: PostDraft = JSON.parse(saved);
        if (Date.now() - draft.updatedAt < 7 * 24 * 60 * 60 * 1000) {
          return draft.content || '';
        }
      }
    } catch { /* ignore */ }
    return '';
  });

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft: PostDraft = JSON.parse(saved);
        return !!(draft.content?.trim()) && Date.now() - draft.updatedAt < 7 * 24 * 60 * 60 * 1000;
      }
    } catch { /* ignore */ }
    return false;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave with debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const draft: PostDraft = {
          den,
          content,
          updatedAt: Date.now(),
        };
        if (content.trim() || den.trim()) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
          setHasDraft(!!content.trim());
        } else {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
        }
      } catch { /* ignore quota errors */ }
    }, AUTOSAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [den, content]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDen(defaultDen);
    setContent('');
    setHasDraft(false);
  }, [defaultDen]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDen(defaultDen);
    setContent('');
    setHasDraft(false);
  }, [defaultDen]);

  return {
    den,
    setDen,
    content,
    setContent,
    hasDraft,
    clearDraft,
    discardDraft,
  };
}
