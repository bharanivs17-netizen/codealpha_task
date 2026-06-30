'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-md w-full p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">Something went wrong!</h2>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          We encountered an unexpected error. Don't worry, our team has been notified.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => reset()} 
            className="btn-primary w-full justify-center py-3"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          
          <Link href="/feed" className="btn-secondary w-full justify-center py-3">
            <Home className="w-4 h-4" /> Go to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
