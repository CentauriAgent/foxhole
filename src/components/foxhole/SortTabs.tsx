import { cn } from '@/lib/utils';
import { Flame, Clock, TrendingUp } from 'lucide-react';

export type SortMode = 'hot' | 'new' | 'top';

interface SortTabsProps {
  value: SortMode;
  onChange: (value: SortMode) => void;
  className?: string;
}

const tabs: { value: SortMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Top', icon: TrendingUp },
];

/**
 * Reddit-style sort tabs for switching between Hot, New, and Top sort modes.
 */
export function SortTabs({ value, onChange, className }: SortTabsProps) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-lg bg-muted p-1",
      className
    )}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1.5",
              value === tab.value
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
