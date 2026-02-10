import { useNostr } from '@nostrify/react';
import { useAppContext } from './useAppContext';
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';

/**
 * Default application relays that should always be included when reading/writing
 * sensitive replaceable events (kind 0, 3, 10000, etc.) to prevent data loss.
 */
const APP_DEFAULT_RELAYS = [
  'wss://relay.ditto.pub',
  'wss://relay.primal.net',
  'wss://relay.damus.io',
  'wss://nos.lol',
];

/**
 * Returns a merged, deduplicated set of relay URLs from both the user's
 * NIP-65 relay list and the app's hardcoded defaults. Use this for
 * sensitive replaceable event operations (kind 0, 3, 10000) to ensure
 * we never miss existing data or fail to broadcast to important relays.
 */
export function useBroadcastRelays() {
  const { config } = useAppContext();

  const userRelays = config.relayMetadata.relays.map(r => r.url);
  const allRelays = [...new Set([...userRelays, ...APP_DEFAULT_RELAYS])];

  return allRelays;
}

/**
 * Hook providing broadQuery and broadPublish functions that operate across
 * both the user's NIP-65 relays and the app defaults.
 *
 * Use for replaceable events where data loss is unacceptable:
 * - kind 3 (contact list)
 * - kind 10000 (mute list)
 * - kind 0 (profile metadata)
 */
export function useBroadcastNostr() {
  const { nostr } = useNostr();
  const relays = useBroadcastRelays();

  /**
   * Query all broadcast relays in parallel and return the newest event found.
   * For replaceable events, this ensures we find the latest version even if
   * it only exists on some relays.
   */
  async function broadQuery(filters: NostrFilter[], timeoutMs = 5000): Promise<NostrEvent[]> {
    const results = await Promise.allSettled(
      relays.map(url =>
        nostr.relay(url).query(filters, { signal: AbortSignal.timeout(timeoutMs) })
      ),
    );

    // Merge and deduplicate by event ID, keeping all unique events
    const eventMap = new Map<string, NostrEvent>();
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const event of result.value) {
          const existing = eventMap.get(event.id);
          if (!existing) {
            eventMap.set(event.id, event);
          }
        }
      }
    }

    return Array.from(eventMap.values());
  }

  /**
   * Publish an event to all broadcast relays in parallel.
   * Doesn't throw if some relays fail - as long as at least one succeeds.
   */
  async function broadPublish(event: NostrEvent, timeoutMs = 5000): Promise<void> {
    const results = await Promise.allSettled(
      relays.map(url =>
        nostr.relay(url).event(event, { signal: AbortSignal.timeout(timeoutMs) })
      ),
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    if (successes === 0) {
      throw new Error('Failed to publish event to any relay');
    }
  }

  return { broadQuery, broadPublish, relays };
}
