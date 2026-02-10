import { cn } from '@/lib/utils';

interface FoxIconProps {
  className?: string;
}

/**
 * Fox mascot icon for Foxhole. 🦊
 */
export function FoxIcon({ className }: FoxIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={cn("h-6 w-6", className)}
    >
      {/* Ears */}
      <path d="M4 3 L7 10" />
      <path d="M20 3 L17 10" />
      <path d="M4 3 L8 8" />
      <path d="M20 3 L16 8" />
      
      {/* Head */}
      <path d="M7 10 Q7 14 12 17 Q17 14 17 10" />
      
      {/* Inner ears */}
      <path d="M6 5 L8 9" />
      <path d="M18 5 L16 9" />
      
      {/* Eyes */}
      <circle cx="9.5" cy="12" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" />
      
      {/* Nose */}
      <circle cx="12" cy="14.5" r="0.75" fill="currentColor" />
      
      {/* Muzzle / cheeks */}
      <path d="M10 14 L12 15.5 L14 14" />
      
      {/* Whiskers */}
      <path d="M7 14 L3 13" />
      <path d="M7 15 L3 16" />
      <path d="M17 14 L21 13" />
      <path d="M17 15 L21 16" />
    </svg>
  );
}

/**
 * Filled fox icon variant — uses emoji for simplicity.
 */
export function FoxIconFilled({ className }: FoxIconProps) {
  return (
    <span className={cn("text-lg leading-none", className)} role="img" aria-label="fox">
      🦊
    </span>
  );
}
