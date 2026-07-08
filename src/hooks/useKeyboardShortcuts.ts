import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Callback when '?' is pressed (show help) */
  onShowHelp?: () => void;
}

/**
 * Global keyboard shortcuts for Foxhole.
 * 
 * Navigation:
 *   j/k     — Move selection down/up through posts
 *   o/Enter — Open the selected post
 *   Escape  — Clear selection / close dialogs
 * 
 * Actions:
 *   n       — New post (go to /create)
 *   /       — Focus search bar
 *   ?       — Show keyboard shortcuts help
 * 
 * Go-to (press g then a letter):
 *   g h     — Go home
 *   g d     — Go to dens
 *   g p     — Go to popular
 *   g f     — Go to following
 *   g s     — Go to search
 *   g b     — Go to bookmarks
 *   g n     — Go to notifications
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onShowHelp } = options;
  const navigate = useNavigate();
  const pendingGoTo = useRef(false);
  const goToTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    // Check if inside a dialog
    if (el.closest('[role="dialog"]')) return true;
    return false;
  }, []);

  const getPostElements = useCallback(() => {
    return Array.from(document.querySelectorAll('article')) as HTMLElement[];
  }, []);

  const getSelectedIndex = useCallback(() => {
    const articles = getPostElements();
    const selected = document.querySelector('article[data-kb-selected="true"]') as HTMLElement;
    if (!selected) return -1;
    return articles.indexOf(selected);
  }, [getPostElements]);

  const selectPost = useCallback((index: number) => {
    const articles = getPostElements();
    // Clear all selections
    articles.forEach(el => {
      el.removeAttribute('data-kb-selected');
      el.classList.remove('ring-2', 'ring-brand', 'ring-inset', 'bg-muted/80');
    });
    
    if (index >= 0 && index < articles.length) {
      const target = articles[index];
      target.setAttribute('data-kb-selected', 'true');
      target.classList.add('ring-2', 'ring-brand', 'ring-inset', 'bg-muted/80');
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [getPostElements]);

  const clearSelection = useCallback(() => {
    const articles = getPostElements();
    articles.forEach(el => {
      el.removeAttribute('data-kb-selected');
      el.classList.remove('ring-2', 'ring-brand', 'ring-inset', 'bg-muted/80');
    });
  }, [getPostElements]);

  const openSelectedPost = useCallback(() => {
    const selected = document.querySelector('article[data-kb-selected="true"]') as HTMLElement;
    if (!selected) return;
    // Find the first link to a post within the article
    const link = selected.querySelector('a[href*="/post/"], a[href*="/d/"]') as HTMLAnchorElement;
    if (link) {
      const href = link.getAttribute('href');
      if (href) navigate(href);
    }
  }, [navigate]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const key = e.key;

      // Handle "go to" mode (g + letter)
      if (pendingGoTo.current) {
        pendingGoTo.current = false;
        if (goToTimer.current) clearTimeout(goToTimer.current);
        
        switch (key) {
          case 'h': navigate('/'); break;
          case 'd': navigate('/dens'); break;
          case 'p': navigate('/popular'); break;
          case 'f': navigate('/following'); break;
          case 's': navigate('/search'); break;
          case 'b': navigate('/bookmarks'); break;
          case 'n': navigate('/notifications'); break;
        }
        e.preventDefault();
        return;
      }

      switch (key) {
        case 'j': {
          // Move down
          e.preventDefault();
          const articles = getPostElements();
          if (articles.length === 0) return;
          const currentIdx = getSelectedIndex();
          const nextIdx = currentIdx < articles.length - 1 ? currentIdx + 1 : currentIdx;
          selectPost(nextIdx);
          break;
        }

        case 'k': {
          // Move up
          e.preventDefault();
          const currentIdx = getSelectedIndex();
          if (currentIdx <= 0) {
            selectPost(0);
          } else {
            selectPost(currentIdx - 1);
          }
          break;
        }

        case 'o':
        case 'Enter': {
          if (getSelectedIndex() >= 0) {
            e.preventDefault();
            openSelectedPost();
          }
          break;
        }

        case 'Escape': {
          clearSelection();
          break;
        }

        case 'n': {
          e.preventDefault();
          navigate('/create');
          break;
        }

        case '/': {
          e.preventDefault();
          // Focus the search input in the header, or navigate to search
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          } else {
            navigate('/search');
          }
          break;
        }

        case '?': {
          e.preventDefault();
          onShowHelp?.();
          break;
        }

        case 'g': {
          e.preventDefault();
          pendingGoTo.current = true;
          // Clear after 1.5s if no second key pressed
          goToTimer.current = setTimeout(() => {
            pendingGoTo.current = false;
          }, 1500);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (goToTimer.current) clearTimeout(goToTimer.current);
    };
  }, [enabled, navigate, isInputFocused, getPostElements, getSelectedIndex, selectPost, clearSelection, openSelectedPost, onShowHelp]);

  return { clearSelection, selectPost };
}
