'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Compass, Bell, MessageCircle, User, Search, PlusSquare,
  Film, BookMarked, BarChart2, Shield, LogOut, Settings, Sparkles, Moon, Sun, Menu, X,
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationStore } from '@/store';
import { cn, getAvatarUrl } from '@/lib/utils';

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/reels', icon: Film, label: 'Reels' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/saved', icon: BookMarked, label: 'Saved' },
  { href: '/dashboard', icon: BarChart2, label: 'Dashboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, setCreatePostOpen } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black gradient-text">NovaSphere</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const showBadge = item.href === '/notifications' && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-link', isActive && 'active')}
              onClick={() => setMobileOpen(false)}
            >
              <div className="relative">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {showBadge && (
                  <span className="badge absolute -top-2 -right-2 text-xs min-w-0 px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Create Post */}
        <button
          onClick={() => { setCreatePostOpen(true); setMobileOpen(false); }}
          className="sidebar-link w-full text-left"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-brand flex items-center justify-center flex-shrink-0">
            <PlusSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span>Create Post</span>
        </button>

        {/* Admin Panel (if admin/moderator) */}
        {(user.role === 'admin' || user.role === 'moderator') && (
          <Link href="/admin" className={cn('sidebar-link', pathname?.startsWith('/admin') && 'active')} onClick={() => setMobileOpen(false)}>
            <Shield className="w-5 h-5 flex-shrink-0" />
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 mt-4">
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="sidebar-link w-full text-left">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Profile */}
        <Link href={`/profile/${user.username}`} className="sidebar-link" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            <img
              src={getAvatarUrl(user)}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-400/30"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{user.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={() => { logout(); }}
          className="sidebar-link w-full text-left hover:text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[280px]"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Trigger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 glass rounded-xl p-2.5"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[280px] z-50 md:hidden flex flex-col"
              style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
