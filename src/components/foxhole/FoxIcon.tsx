import { cn } from '@/lib/utils';

interface FoxIconProps {
  className?: string;
}

/**
 * Fox mascot icon for Foxhole — clean geometric fox head. 🦊
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
      {/* Left ear */}
      <path d="M3 2 L6.5 9 L10 7.5 Z" />
      {/* Right ear */}
      <path d="M21 2 L17.5 9 L14 7.5 Z" />
      {/* Head outline */}
      <path d="M6.5 9 C6.5 9 5 13 5.5 15.5 C6 18 8.5 21 12 22 C15.5 21 18 18 18.5 15.5 C19 13 17.5 9 17.5 9" />
      {/* Connect ears to head */}
      <path d="M10 7.5 C11 7 13 7 14 7.5" />
      {/* Left eye */}
      <circle cx="9" cy="13" r="1" />
      {/* Right eye */}
      <circle cx="15" cy="13" r="1" />
      {/* Nose */}
      <path d="M11 16.5 L12 17.5 L13 16.5" />
      {/* Nose dot */}
      <circle cx="12" cy="16" r="0.5" />
    </svg>
  );
}

/**
 * Filled fox icon variant — solid geometric fox head.
 */
export function FoxIconFilled({ className }: FoxIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={cn("h-6 w-6", className)}
    >
      {/* Left ear */}
      <path d="M3 2 L6.5 9 L10 7.5 Z" />
      {/* Right ear */}
      <path d="M21 2 L17.5 9 L14 7.5 Z" />
      {/* Head */}
      <path d="M10 7.5 C11 7 13 7 14 7.5 L17.5 9 C17.5 9 19 13 18.5 15.5 C18 18 15.5 21 12 22 C8.5 21 6 18 5.5 15.5 C5 13 6.5 9 6.5 9 Z" />
      {/* Eyes (cut out) */}
      <circle cx="9" cy="13" r="1" fill="var(--background, white)" />
      <circle cx="15" cy="13" r="1" fill="var(--background, white)" />
      {/* Muzzle area */}
      <path d="M8.5 15 C8.5 15 10 18 12 18 C14 18 15.5 15 15.5 15 L12 20 Z" fill="var(--background, white)" opacity="0.3" />
      {/* Nose */}
      <circle cx="12" cy="16" r="0.7" fill="var(--background, white)" />
    </svg>
  );
}
