import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['j'], description: 'Next post' },
      { keys: ['k'], description: 'Previous post' },
      { keys: ['o'], description: 'Open selected post' },
      { keys: ['Enter'], description: 'Open selected post' },
      { keys: ['Esc'], description: 'Clear selection' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['n'], description: 'New post' },
      { keys: ['/'], description: 'Search' },
      { keys: ['?'], description: 'Show shortcuts' },
    ],
  },
  {
    category: 'Go to',
    items: [
      { keys: ['g', 'h'], description: 'Home' },
      { keys: ['g', 'p'], description: 'Popular' },
      { keys: ['g', 'f'], description: 'Following' },
      { keys: ['g', 'd'], description: 'Dens' },
      { keys: ['g', 's'], description: 'Search' },
      { keys: ['g', 'b'], description: 'Bookmarks' },
      { keys: ['g', 'n'], description: 'Notifications' },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-mono font-medium rounded border border-border bg-muted text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground">then</span>
                          )}
                          <KeyBadge>{key}</KeyBadge>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Shortcuts are disabled when typing in inputs
        </p>
      </DialogContent>
    </Dialog>
  );
}
