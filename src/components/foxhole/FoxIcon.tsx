import { cn } from '@/lib/utils';

interface FoxIconProps {
  className?: string;
}

/**
 * Geometric low-poly fox head icon for Foxhole. 🦊
 * Front-facing, clean angular design.
 */
export function FoxIcon({ className }: FoxIconProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="currentColor"
      className={cn("h-6 w-6", className)}
    >
      {/* Left ear outer */}
      <polygon points="15,42 28,5 40,35" opacity="0.85" />
      {/* Right ear outer */}
      <polygon points="85,42 72,5 60,35" opacity="0.85" />
      {/* Left ear inner */}
      <polygon points="20,38 30,12 38,36" opacity="0.6" />
      {/* Right ear inner */}
      <polygon points="80,38 70,12 62,36" opacity="0.6" />
      
      {/* Upper head */}
      <polygon points="15,42 50,22 85,42 50,52" />
      {/* Mid face left */}
      <polygon points="15,42 12,58 35,65 50,52" opacity="0.9" />
      {/* Mid face right */}
      <polygon points="85,42 88,58 65,65 50,52" opacity="0.9" />
      
      {/* Muzzle - lighter */}
      <polygon points="35,65 50,48 65,65 50,82" fill="currentColor" opacity="0.3" />
      {/* Chin */}
      <polygon points="40,78 50,82 60,78 50,90" fill="currentColor" opacity="0.25" />
      
      {/* Left cheek tuft */}
      <polygon points="12,58 5,72 30,68" opacity="0.8" />
      {/* Right cheek tuft */}
      <polygon points="88,58 95,72 70,68" opacity="0.8" />
      
      {/* Left eye */}
      <polygon points="30,50 40,42 50,50 40,58" fill="black" />
      {/* Right eye */}
      <polygon points="70,50 60,42 50,50 60,58" fill="black" />
      
      {/* Nose */}
      <polygon points="44,68 50,63 56,68 50,74" fill="black" />
    </svg>
  );
}

/**
 * Filled fox icon variant — same geometric design.
 */
export function FoxIconFilled({ className }: FoxIconProps) {
  return <FoxIcon className={className} />;
}
