/**
 * Hot Score Algorithm for Foxhole Popular Page
 * 
 * Reddit-style ranking with zap weighting and time decay.
 * Zaps are weighted to reward economic activity on the platform.
 */

export type TimeRange = '24h' | '7d' | 'all';

export interface PostMetrics {
  totalSats: number;
  zapCount: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: number;
}

/**
 * Calculate hot score for a post.
 * 
 * Scoring weights:
 * - Zaps: 1 sat = 0.1 points (10 sats = 1 upvote equivalent)
 * - Upvotes: +1 point each
 * - Downvotes: -1 point each
 * - Replies: +2 points each (engagement signal)
 * 
 * Time decay uses Reddit-style formula: engagement / (age_hours + 2)^1.5
 * The +2 prevents division issues for very new posts.
 */
export function calculateHotScore(metrics: PostMetrics): number {
  // Calculate engagement score
  const zapScore = metrics.totalSats * 0.1;
  const reactionScore = metrics.upvotes - metrics.downvotes;
  const replyScore = metrics.replyCount * 2;
  
  const engagement = zapScore + reactionScore + replyScore;
  
  // Apply time decay
  const nowSeconds = Math.floor(Date.now() / 1000);
  const ageHours = (nowSeconds - metrics.createdAt) / 3600;
  const decay = Math.pow(ageHours + 2, 1.5);
  
  return engagement / decay;
}

/**
 * Get the unix timestamp cutoff for a time range filter.
 * 
 * @param range - Time range: '24h', '7d', or 'all' (capped at 30 days)
 * @returns Unix timestamp to use as `since` filter
 */
export function getTimeRangeSince(range: TimeRange): number {
  const now = Math.floor(Date.now() / 1000);
  
  switch (range) {
    case '24h':
      return now - 86400; // 24 hours
    case '7d':
      return now - 604800; // 7 days
    case 'all':
      return now - 2592000; // 30 days (capped)
    default:
      return now - 86400;
  }
}

/**
 * Get human-readable label for time range.
 */
export function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case '24h':
      return 'Today';
    case '7d':
      return 'This Week';
    case 'all':
      return 'This Month';
    default:
      return 'Today';
  }
}

/**
 * Format sats amount with K/M suffix for display.
 */
export function formatSats(sats: number): string {
  if (sats < 1000) return sats.toLocaleString();
  if (sats < 1000000) return `${(sats / 1000).toFixed(1)}k`;
  return `${(sats / 1000000).toFixed(1)}M`;
}
