import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SubclawBadgeProps {
  subclaw: string;
  className?: string;
}

/**
 * Link badge to a den (/d/name).
 */
export function SubclawBadge({ subclaw, className }: SubclawBadgeProps) {
  return (
    <Link 
      to={`/d/${subclaw}`}
      className={cn(
        "text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      d/{subclaw}
    </Link>
  );
}
