import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search as SearchIcon, Sparkles, X } from 'lucide-react';
import { SiteHeader } from '@/components/foxhole';
import { SearchResultCard } from '@/components/foxhole/SearchResultCard';
import { useSearchPosts } from '@/hooks/useSearchPosts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const denParam = searchParams.get('den') || '';
  const [query, setQuery] = useState(queryParam);
  const [den, setDen] = useState(denParam);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setDen(denParam);
  }, [denParam]);

  const { data: results, isLoading } = useSearchPosts({
    query: queryParam,
    den: denParam || undefined,
    limit: 50,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params: Record<string, string> = { q: query.trim() };
      if (den.trim()) params.den = den.trim();
      setSearchParams(params);
    }
  };

  const clearDen = () => {
    setDen('');
    if (queryParam) {
      setSearchParams({ q: queryParam });
    }
  };

  useSeoMeta({
    title: queryParam ? `Search: ${queryParam} — Foxhole` : 'Search — Foxhole',
    description: 'Search through posts and comments on Foxhole',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))]">
                <SearchIcon className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Search</h1>
                <p className="text-muted-foreground">
                  Find posts and comments across all Dens
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for posts and comments..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Den:</label>
                <Input
                  type="text"
                  placeholder="e.g. gaming (leave empty for all)"
                  value={den}
                  onChange={(e) => setDen(e.target.value)}
                  className="h-9 text-sm max-w-xs"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {denParam && (
                    <Badge variant="secondary" className="gap-1">
                      /d/{denParam}
                      <button type="button" onClick={clearDen} className="ml-1 hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
                {queryParam && (
                  <p className="text-sm text-muted-foreground">
                    Searching for: <span className="font-medium text-foreground">"{queryParam}"</span>
                    {denParam && <> in <span className="font-medium text-foreground">/d/{denParam}</span></>}
                  </p>
                )}
              </div>
            </form>
          </header>

          {queryParam ? (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Results
                </h2>
              </div>

              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 space-y-3">
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))
                ) : results && results.length > 0 ? (
                  results.map((event) => (
                    <SearchResultCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <SearchIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Try different keywords or check your spelling.
                    </p>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 px-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[hsl(var(--brand))]/10 mb-2">
                    <SearchIcon className="h-10 w-10 text-[hsl(var(--brand))]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Start searching</h3>
                    <p className="text-muted-foreground">
                      Enter keywords to search through posts and comments across all Dens.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
