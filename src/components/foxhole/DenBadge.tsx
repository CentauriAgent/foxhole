import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface DenBadgeProps {
  den: string;
  className?: string;
}

/**
 * Link badge to a den (/d/name).
 */
export function DenBadge({ den, className }: DenBadgeProps) {
  return (
    <Link 
      to={`/d/${den}`}
      className={cn(
        "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      d/{den}
    </Link>
  );
}
