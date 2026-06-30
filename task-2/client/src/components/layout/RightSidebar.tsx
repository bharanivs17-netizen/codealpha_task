'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { getAvatarUrl } from '@/lib/utils';
import { UserPlus, CheckCircle, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface SuggestedUser {
  _id: string;
  username: string;
  name: string;
  avatar: string;
  isVerified: boolean;
  bio?: string;
}

export default function RightSidebar() {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await usersAPI.getSuggestions();
        setSuggestions(data.suggestions);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleFollow = async (userId: string) => {
    const wasFollowing = following.has(userId);
    setFollowing((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(userId);
      else next.add(userId);
      return next;
    });
    try {
      await usersAPI.follow(userId);
    } catch {
      setFollowing((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(userId);
        else next.delete(userId);
        return next;
      });
      toast.error('Failed');
    }
  };

  const trendingTags = ['#novasphere', '#ai', '#photography', '#design', '#travel', '#coding'];

  return (
    <div className="py-4 space-y-6">
      {/* Who to follow */}
      <div className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-brand-400" /> Who to Follow
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-24 rounded" />
                  <div className="skeleton h-2 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: 'var(--text-muted)' }}>No suggestions</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3">
                <Link href={`/profile/${u.username}`} className="flex-shrink-0">
                  <img src={getAvatarUrl(u)} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-1 hover:text-brand-400 transition-colors">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    {u.isVerified && <CheckCircle className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0" />}
                  </Link>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                </div>
                <button
                  onClick={() => handleFollow(u._id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                    following.has(u._id)
                      ? 'bg-brand-400/10 text-brand-400 border border-brand-400/30'
                      : 'bg-gradient-brand text-white'
                  }`}
                >
                  {following.has(u._id) ? 'Following' : 'Follow'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trending Tags */}
      <div className="glass-card p-4">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Trending Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag, i) => (
            <motion.div key={tag} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
              <Link href={`/hashtag/${tag.slice(1)}`} className="hashtag-tag">
                {tag}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Logged in user mini card */}
      {user && (
        <div className="glass-card p-4">
          <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
            <img src={getAvatarUrl(user)} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-400/20" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm group-hover:text-brand-400 transition-colors truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
            </div>
          </Link>
        </div>
      )}

      {/* Footer links */}
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {['About', 'Privacy', 'Terms', 'Help'].map((l) => (
            <Link key={l} href="#" className="hover:text-brand-400 transition-colors">{l}</Link>
          ))}
        </div>
        <p className="mt-2">© 2024 NovaSphere</p>
      </div>
    </div>
  );
}
