import { cn } from '@/lib/utils';
import type { TimeRange } from '@/lib/hotScore';

interface TimeRangeTabsProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

const tabs: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: 'all', label: 'All' },
];

/**
 * Tab component for selecting time range filter.
 */
export function TimeRangeTabs({ value, onChange, className }: TimeRangeTabsProps) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-lg bg-muted p-1",
      className
    )}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
            value === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
