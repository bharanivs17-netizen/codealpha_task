'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion, AnimatePresence } from 'framer-motion';
import { postsAPI } from '@/lib/api';
import PostCard from '@/components/post/PostCard';
import StoriesCarousel from '@/components/stories/StoriesCarousel';
import CreatePostModal from '@/components/post/CreatePostModal';
import { Loader2, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';

const PostSkeleton = () => (
  <div className="post-card p-4 space-y-4">
    <div className="flex items-center gap-3">
      <div className="skeleton w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-2 w-20 rounded" />
      </div>
    </div>
    <div className="skeleton h-4 w-full rounded" />
    <div className="skeleton h-4 w-3/4 rounded" />
    <div className="skeleton h-48 w-full rounded-xl" />
    <div className="flex gap-4">
      <div className="skeleton h-8 w-16 rounded-lg" />
      <div className="skeleton h-8 w-16 rounded-lg" />
      <div className="skeleton h-8 w-16 rounded-lg" />
    </div>
  </div>
);

export default function FeedPage() {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

  const fetchPosts = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const { data } = await postsAPI.getFeed(pageNum);
      if (reset) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => {
          const existing = new Set((prev as { _id: string }[]).map((p) => p._id));
          const newPosts = (data.posts as { _id: string }[]).filter((p) => !existing.has(p._id));
          return [...prev, ...newPosts];
        });
      }
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1, true);
  }, [fetchPosts]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  }, [inView, hasMore, loading, page, fetchPosts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1, true);
  };

  const handlePostCreated = (newPost: unknown) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => (prev as { _id: string }[]).filter((p) => p._id !== postId));
  };

  return (
    <div className="space-y-4">
      {/* Stories Carousel */}
      <StoriesCarousel />

      {/* Feed header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Home Feed</h1>
        <button
          onClick={handleRefresh}
          className="btn-ghost p-2"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Posts */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 glass-card"
          >
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-lg font-bold mb-2">Your feed is empty</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Follow people or explore trending posts to fill your feed
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {(posts as { _id: string }[]).map((post) => (
              <PostCard
                key={(post as { _id: string })._id}
                post={post as Parameters<typeof PostCard>[0]['post']}
                onDelete={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {hasMore && !loading && (
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You&apos;ve seen it all ✨</p>
        )}
      </div>

      {/* Create Post Modal (global) */}
      <CreatePostModal onPostCreated={handlePostCreated} />
    </div>
  );
}
