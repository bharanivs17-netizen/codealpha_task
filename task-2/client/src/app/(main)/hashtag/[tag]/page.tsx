'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { postsAPI } from '@/lib/api';
import PostCard from '@/components/post/PostCard';
import { Hash, Loader2 } from 'lucide-react';

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await postsAPI.getByHashtag(tag);
        setPosts(data.posts);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tag]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-3">
          <Hash className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black gradient-text">#{tag}</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{posts.length} posts</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p>No posts with #{tag} yet</p>
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
