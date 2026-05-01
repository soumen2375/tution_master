import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCheckDouble, faCircleDot,
  faMoneyBill, faCalendarCheck, faFileLines,
  faBullhorn, faUserPlus, faBell,
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/lib/types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

const typeIcon = (type: string | null) => {
  switch (type) {
    case 'FEE_REMINDER': return { icon: faMoneyBill, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
    case 'ATTENDANCE_ALERT': return { icon: faCalendarCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
    case 'CLASS_UPDATE': return { icon: faFileLines, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' };
    case 'ANNOUNCEMENT': return { icon: faBullhorn, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' };
    case 'SYSTEM': return { icon: faUserPlus, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' };
    default: return { icon: faBell, color: 'text-slate-500 bg-slate-100 dark:bg-slate-700' };
  }
};

function groupByDate(notifications: Notification[]) {
  const today = new Date().toDateString();
  const groups: { label: string; items: Notification[] }[] = [];
  const todayItems = notifications.filter(n => new Date(n.created_at).toDateString() === today);
  const earlierItems = notifications.filter(n => new Date(n.created_at).toDateString() !== today);
  if (todayItems.length) groups.push({ label: 'Today', items: todayItems });
  if (earlierItems.length) groups.push({ label: 'Earlier', items: earlierItems });
  return groups;
}

export default function NotificationDrawer({ open, onClose, onUnreadChange }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          onUnreadChange(notifications.filter(n => !n.is_read).length + 1);
        })
        .subscribe();
    });
    return () => { channel?.unsubscribe(); };
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    const unread = (data || []).filter(n => !n.is_read).length;
    onUnreadChange(unread);
    setLoading(false);
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadChange(0);
  }

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const unread = notifications.filter(n => !n.is_read && n.id !== id).length;
    onUnreadChange(unread);
  }

  const groups = groupByDate(notifications);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 h-full flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} />
                    Mark all read
                  </button>
                )}
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                  <FontAwesomeIcon icon={faBell} className="text-4xl text-slate-200 dark:text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label}>
                    <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{group.label}</span>
                    </div>
                    {group.items.map(n => {
                      const { icon, color } = typeIcon(n.type);
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markOneRead(n.id)}
                          className={`flex gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                            <FontAwesomeIcon icon={icon} className="text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium leading-tight ${!n.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <FontAwesomeIcon icon={faCircleDot} className="text-indigo-500 text-xs shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
