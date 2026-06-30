'use client';

import { motion } from 'framer-motion';
import { Compass, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-lg w-full p-10 text-center relative z-10"
      >
        <div className="text-[120px] font-black leading-none gradient-text-aurora mb-2">
          404
        </div>
        
        <h2 className="text-2xl font-bold mb-4">Lost in the void?</h2>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The page you're looking for doesn't exist, has been moved, or is currently unavailable. 
          Let's get you back on track.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/feed" className="btn-primary w-full justify-center py-3">
            <Home className="w-4 h-4" /> Go to Feed
          </Link>
          
          <Link href="/explore" className="btn-secondary w-full justify-center py-3">
            <Compass className="w-4 h-4" /> Explore
          </Link>
        </div>
        
        <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Error Code: PAGE_NOT_FOUND
          </p>
        </div>
      </motion.div>
    </div>
  );
}
