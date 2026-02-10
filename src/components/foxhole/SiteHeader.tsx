import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Flame, Home, BookOpen, Menu, Search, PenSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FoxIcon } from './FoxIcon';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/popular', label: 'Popular', icon: Flame },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/docs', label: 'Docs', icon: BookOpen },
];

/**
 * Main site header with Foxhole branding and navigation.
 */
export function SiteHeader() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="container flex h-14 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-4 group">
            <div className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg",
              "bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]"
            )}>
              <FoxIcon className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[hsl(var(--brand))]">
              Foxhole
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right side spacer */}
          <div className="flex-1" />
          
          {/* Create Post Button */}
          <Link to="/create">
            <Button size="sm" className="hidden sm:inline-flex gap-1.5 bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/90 text-[hsl(var(--brand-foreground))]">
              <PenSquare className="h-4 w-4" />
              <span>New Post</span>
            </Button>
          </Link>
          
          {/* Community badge - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
              <span>🦊</span>
              <span className="font-medium">Nostr Communities</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 w-9 p-0"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu - rendered via portal to escape stacking contexts */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-[280px] sm:w-[320px] p-6 shadow-2xl overflow-y-auto border-l border-border" style={{ background: 'hsl(var(--card))' }}>
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]">
                <FoxIcon className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold text-[hsl(var(--brand))]">Foxhole</span>
            </div>
            
            {/* Nav links */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    isActive(item.to)
                      ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <Link
                to="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]"
              >
                <PenSquare className="h-5 w-5" />
                <span>New Post</span>
              </Link>
            </nav>

            {/* Community badge */}
            <div className="mt-8 pt-8 border-t border-border">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] text-sm">
                <span>🦊</span>
                <span className="font-medium">Nostr Communities</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
