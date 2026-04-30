import { supabase } from '@/lib/supabase';
import type { Notification, NotificationType } from '@/lib/types';

/** Get all notifications for the current user */
export async function getNotifications(limit = 20) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Notification[];
}

/** Get unread count */
export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

/** Mark a notification as read */
export async function markRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/** Mark all notifications as read */
export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

/** Create a notification (called server-side or from teacher actions) */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: NotificationType,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type,
    metadata: metadata ?? null,
  });
  if (error) console.error('Failed to create notification:', error);
}

/** Subscribe to realtime notifications for current user */
export function subscribeToNotifications(userId: string, callback: (n: Notification) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload.new as Notification)
    )
    .subscribe();
}
