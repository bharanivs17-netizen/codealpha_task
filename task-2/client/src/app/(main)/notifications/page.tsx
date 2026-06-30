'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsAPI } from '@/lib/api';
import { useNotificationStore } from '@/store';
import { getAvatarUrl, formatDate } from '@/lib/utils';
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Notification {
  _id: string;
  sender: { _id: string; username: string; name: string; avatar: string };
  type: string;
  post?: { _id: string; content: string; media?: { url: string }[] };
  read: boolean;
  createdAt: string;
}

const NotificationIcon = ({ type }: { type: string }) => {
  const icons: Record<string, { icon: typeof Heart; bg: string; color: string }> = {
    like: { icon: Heart, bg: 'bg-red-500/20', color: 'text-red-500' },
    comment: { icon: MessageCircle, bg: 'bg-blue-500/20', color: 'text-blue-500' },
    follow: { icon: UserPlus, bg: 'bg-green-500/20', color: 'text-green-500' },
    repost: { icon: Repeat2, bg: 'bg-brand-400/20', color: 'text-brand-400' },
  };
  const config = icons[type] || { icon: Bell, bg: 'bg-gray-500/20', color: 'text-gray-400' };
  return (
    <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <config.icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
};

const getMessage = (n: Notification) => {
  const messages: Record<string, string> = {
    like: 'liked your post',
    comment: 'commented on your post',
    follow: 'started following you',
    repost: 'reposted your post',
    mention: 'mentioned you in a post',
  };
  return messages[n.type] || 'interacted with you';
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await notificationsAPI.get();
        setNotifications(data.notifications);
        setUnreadCount(0);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [setUnreadCount]);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed');
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      toast.error('Failed');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-xs flex items-center gap-1.5 text-brand-400">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="btn-ghost text-xs flex items-center gap-1.5 text-red-400">
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>When someone interacts with you, it'll show here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card p-4 flex items-start gap-4 ${!notif.read ? 'border-l-2 border-brand-400' : ''}`}
              >
                <Link href={`/profile/${notif.sender.username}`} className="flex-shrink-0">
                  <img src={getAvatarUrl(notif.sender)} alt={notif.sender.name} className="w-10 h-10 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <NotificationIcon type={notif.type} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <Link href={`/profile/${notif.sender.username}`} className="font-semibold hover:text-brand-400">
                          {notif.sender.name}
                        </Link>{' '}
                        {getMessage(notif)}
                        {notif.post && (
                          <span className="ml-1 text-xs italic" style={{ color: 'var(--text-muted)' }}>
                            &quot;{notif.post.content?.slice(0, 40)}...&quot;
                          </span>
                        )}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 mt-2" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
