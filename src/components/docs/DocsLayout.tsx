import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/foxhole';
import { BookOpen, Code, Info, ChevronRight } from 'lucide-react';

interface DocsLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    title: 'Overview',
    href: '/docs',
    icon: BookOpen,
    description: 'FAQ and core concepts',
  },
  {
    title: 'Technical Guide',
    href: '/docs/technical',
    icon: Code,
    description: 'Protocol implementation details',
  },
  {
    title: 'About',
    href: '/docs/about',
    icon: Info,
    description: 'Project information and links',
  },
];

export function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Documentation</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-1">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4 px-3">
                Documentation
              </h3>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-6">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors border",
                      isActive
                        ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] font-medium"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <main className="min-w-0">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
