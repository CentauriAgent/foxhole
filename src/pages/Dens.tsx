import { useState, useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Search } from 'lucide-react';
import { SiteHeader } from '@/components/foxhole';
import { DenCard } from '@/components/foxhole/DenCard';
import { usePopularDens } from '@/hooks/usePopularDens';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const Dens = () => {
  const [search, setSearch] = useState('');
  const { data: dens, isLoading } = usePopularDens({ limit: 500 });

  const filtered = useMemo(() => {
    if (!search.trim()) return dens;
    const q = search.toLowerCase();
    return dens.filter((d) => d.name.toLowerCase().includes(q));
  }, [dens, search]);

  useSeoMeta({
    title: 'Browse Dens — Foxhole',
    description: 'Explore all dens (communities) on Foxhole. Find topics that interest you and join the conversation.',
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-8 max-w-4xl">
        <div className="space-y-1 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Browse Dens</h1>
          <p className="text-muted-foreground">
            Explore communities and find your people.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            {search ? 'No dens match your search.' : 'No dens found yet.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((den) => (
              <DenCard
                key={den.name}
                name={den.name}
                postCount={den.postCount}
                latestPost={den.latestPost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dens;
