import { describe, it, expect } from 'vitest';
import type { NostrEvent } from '@nostrify/nostrify';

import { getNextUntil } from './pagination';

function event(created_at: number): NostrEvent {
  return {
    id: `id-${created_at}-${Math.random().toString(36).slice(2)}`,
    kind: 1111,
    pubkey: 'a'.repeat(64),
    created_at,
    content: '',
    tags: [],
    sig: '',
  };
}

describe('getNextUntil', () => {
  it('returns undefined for an empty page (no more results)', () => {
    expect(getNextUntil([], undefined)).toBeUndefined();
  });

  it('uses the last timestamp as-is so boundary events are not dropped', () => {
    const page = [event(300), event(200), event(100)];
    expect(getNextUntil(page, undefined)).toBe(100);
  });

  it('does not skip events sharing the boundary timestamp', () => {
    // Two events at t=100; page cut between them. With `until: 100` the next
    // page re-includes the seen one (deduped downstream) plus the missing one.
    // The old `- 1` behavior would have skipped the second t=100 event.
    const page = [event(200), event(100)];
    expect(getNextUntil(page, undefined)).toBe(100);
  });

  it('stops when a full page shares one timestamp (no progress possible)', () => {
    const page = [event(100), event(100), event(100)];
    expect(getNextUntil(page, 100)).toBeUndefined();
  });

  it('continues while progress is being made', () => {
    const page = [event(100), event(90)];
    expect(getNextUntil(page, 100)).toBe(90);
  });
});
