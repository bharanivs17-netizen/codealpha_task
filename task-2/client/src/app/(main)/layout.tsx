'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { useSocket } from '@/lib/socket';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import RightSidebar from '@/components/layout/RightSidebar';
import CreatePostModal from '@/components/post/CreatePostModal';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${pathname}`);
      return;
    }
    refreshUser();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  // Pages where right sidebar is hidden
  const noRightSidebar = ['/messages', '/reels', '/stories', '/admin'].some((p) =>
    pathname?.startsWith(p)
  );

  // Pages with full-width layout
  const fullWidth = pathname?.startsWith('/messages') || pathname?.startsWith('/reels');

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar - fixed left */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={`flex-1 min-h-screen transition-all duration-300`}
        style={{ marginLeft: '280px', marginRight: noRightSidebar ? '0' : '0' }}
      >
        <div className={`mx-auto ${fullWidth ? '' : 'max-w-2xl px-4 py-6 pb-24'}`}>
          {children}
        </div>
      </main>

      {/* Right Sidebar - fixed right (desktop only) */}
      {!noRightSidebar && (
        <aside
          className="hidden lg:block fixed right-0 top-0 h-screen overflow-y-auto"
          style={{
            width: '320px',
            borderLeft: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            paddingTop: '4px',
          }}
        >
          <RightSidebar />
        </aside>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Create Post Modal */}
      <CreatePostModal />
    </div>
  );
}
