import { useMemo } from 'react';
import { useNotifications } from './useNotifications';
import { useCurrentUser } from './useCurrentUser';

const STORAGE_KEY = 'foxhole:lastSeenNotifications';

export function useUnreadNotificationCount() {
  const { user } = useCurrentUser();
  const { notifications } = useNotifications({ limit: 50 });

  const count = useMemo(() => {
    if (!user) return 0;

    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (!lastSeen) {
      // Never visited notifications — all are unread
      return notifications.length;
    }

    // lastSeen is stored as Date.now() (milliseconds), timestamps are Unix seconds
    const lastSeenSeconds = Math.floor(Number(lastSeen) / 1000);
    return notifications.filter((n) => n.timestamp > lastSeenSeconds).length;
  }, [user, notifications]);

  return { count: Math.min(count, 100) };
}

export function getUnreadDisplay(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}
