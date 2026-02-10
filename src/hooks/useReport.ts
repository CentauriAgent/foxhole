import { useMutation } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useNostrPublish } from './useNostrPublish';

type ReportType = 'nudity' | 'malware' | 'profanity' | 'illegal' | 'spam' | 'impersonation' | 'other';

interface ReportParams {
  /** The event ID being reported */
  eventId: string;
  /** The pubkey of the event author */
  pubkey: string;
  /** The report type */
  reportType: ReportType;
  /** Optional reason/description */
  reason?: string;
}

/**
 * Report an event (kind 1984, NIP-56).
 */
export function useReport() {
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();

  return useMutation({
    mutationFn: async ({ eventId, pubkey, reportType, reason }: ReportParams) => {
      if (!user) throw new Error('Not logged in');

      const tags: string[][] = [
        ['e', eventId, reportType],
        ['p', pubkey],
      ];

      await publishEvent({
        kind: 1984,
        content: reason ?? '',
        tags,
      });
    },
  });
}
