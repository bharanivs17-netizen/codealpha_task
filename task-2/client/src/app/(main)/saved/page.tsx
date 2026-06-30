'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usersAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import PostCard from '@/components/post/PostCard';
import { Bookmark, Loader2 } from 'lucide-react';

export default function SavedPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const { data } = await usersAPI.getSavedPosts(user.username);
        setPosts(data.savedPosts);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-brand-400" /> Saved Posts
      </h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h3 className="font-semibold mb-2">No saved posts</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Posts you save will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as { _id: string }[]).map((post, i) => (
            <motion.div key={(post as { _id: string })._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <PostCard post={post as Parameters<typeof PostCard>[0]['post']} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
