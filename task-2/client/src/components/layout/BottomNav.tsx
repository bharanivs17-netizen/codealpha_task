'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusSquare, Bell, User } from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationStore } from '@/store';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { setCreatePostOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();

  if (!user) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t md:hidden"
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        <Link href="/feed" className="flex flex-col items-center gap-1 p-2 rounded-xl"
          style={{ color: pathname === '/feed' ? '#7c3aed' : 'var(--text-muted)' }}>
          <Home className="w-6 h-6" strokeWidth={pathname === '/feed' ? 2.5 : 1.75} />
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link href="/explore" className="flex flex-col items-center gap-1 p-2 rounded-xl"
          style={{ color: pathname === '/explore' ? '#7c3aed' : 'var(--text-muted)' }}>
          <Compass className="w-6 h-6" strokeWidth={pathname === '/explore' ? 2.5 : 1.75} />
          <span className="text-xs font-medium">Explore</span>
        </Link>

        <button onClick={() => setCreatePostOpen(true)} className="flex flex-col items-center gap-1 p-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <PlusSquare className="w-5 h-5 text-white" />
          </div>
        </button>

        <Link href="/notifications" className="flex flex-col items-center gap-1 p-2 rounded-xl relative"
          style={{ color: pathname === '/notifications' ? '#7c3aed' : 'var(--text-muted)' }}>
          <Bell className="w-6 h-6" strokeWidth={pathname === '/notifications' ? 2.5 : 1.75} />
          {unreadCount > 0 && (
            <span className="badge absolute top-0.5 right-0.5" style={{ minWidth: '16px', height: '16px', fontSize: '10px', padding: '0 3px' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="text-xs font-medium">Alerts</span>
        </Link>

        <Link href={`/profile/${user.username}`} className="flex flex-col items-center gap-1 p-2 rounded-xl"
          style={{ color: pathname?.startsWith('/profile') ? '#7c3aed' : 'var(--text-muted)' }}>
          <User className="w-6 h-6" strokeWidth={pathname?.startsWith('/profile') ? 2.5 : 1.75} />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
