'use client';
import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Circle } from 'lucide-react';
import { notificationAPI } from '@/lib/api';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data || []);
      setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    const handler = () => loadNotifications();
    window.addEventListener('new_notification', handler);
    return () => window.removeEventListener('new_notification', handler);
  }, []);

  const markRead = async (id: string) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      loadNotifications();
    } catch {}
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-ink-100 transition-colors"
      >
        <Bell size={20} className="text-ink-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-ink-100 rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink-900">Notifications</h3>
              <button onClick={markAllRead} className="text-xs text-ink-500 hover:text-ink-900 transition-colors">
                Mark all as read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={24} className="mx-auto text-ink-200 mb-2" />
                  <p className="text-xs text-ink-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={clsx(
                      "p-4 border-b border-ink-50 flex gap-3 transition-colors hover:bg-ink-50",
                      !n.is_read && "bg-blue-50/30"
                    )}
                  >
                    <div className="shrink-0 mt-1">
                      {!n.is_read ? (
                        <Circle size={8} fill="currentColor" className="text-blue-500" />
                      ) : (
                        <CheckCircle2 size={12} className="text-ink-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => !n.is_read && markRead(n.id)}>
                      <p className="text-sm font-medium text-ink-900">{n.title}</p>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-ink-400 mt-1.5 uppercase tracking-wider font-semibold">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
