'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { postsAPI, usersAPI } from '@/lib/api';
import PostCard from '@/components/post/PostCard';
import { Search, TrendingUp, Hash, User, Loader2, X } from 'lucide-react';
import { debounce, getAvatarUrl } from '@/lib/utils';
import Link from 'next/link';

const trendingTags = ['novasphere', 'ai', 'photography', 'travel', 'design', 'coding', 'food', 'music', 'art', 'fitness'];

type Tab = 'trending' | 'posts' | 'users' | 'tags';

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('trending');
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<unknown[]>([]);
  const [users, setUsers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'trending') {
      loadTrending();
    }
  }, [tab]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const { data } = await postsAPI.getTrending();
      setPosts(data.posts);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const doSearch = debounce(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      if (tab === 'posts') {
        const { data } = await postsAPI.search(q);
        setPosts(data.posts);
      } else if (tab === 'users') {
        const { data } = await usersAPI.search(q);
        setUsers(data.users);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, 400);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (tab !== 'trending' && tab !== 'tags') {
      doSearch(e.target.value);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'posts', label: 'Posts', icon: Search },
    { id: 'users', label: 'People', icon: User },
    { id: 'tags', label: 'Hashtags', icon: Hash },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Explore</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5" style={{ color: 'var(--text-muted)' }} />
        <input
          value={query}
          onChange={handleSearchChange}
          placeholder="Search posts, people, hashtags..."
          className="input-field pl-11 pr-10"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-gradient-brand text-white shadow-brand-sm' : ''
            }`}
            style={{ color: tab === t.id ? undefined : 'var(--text-secondary)' }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <>
          {(tab === 'trending' || tab === 'posts') && (
            <div className="space-y-4">
              {(posts as { _id: string }[]).map((post, i) => (
                <motion.div key={(post as { _id: string })._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PostCard post={post as Parameters<typeof PostCard>[0]['post']} />
                </motion.div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{query ? 'No posts found' : 'No trending posts yet'}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-3">
              {(users as { _id: string; username: string; name: string; avatar: string; bio?: string; isVerified?: boolean }[]).map((u, i) => (
                <motion.div key={u._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/profile/${u.username}`} className="glass-card p-4 flex items-center gap-4">
                    <img src={getAvatarUrl(u)} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                      {u.bio && <p className="text-sm mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{u.bio}</p>}
                    </div>
                  </Link>
                </motion.div>
              ))}
              {users.length === 0 && query && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No users found</p>
                </div>
              )}
              {!query && (
                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">Start typing to search for people</p>
                </div>
              )}
            </div>
          )}

          {tab === 'tags' && (
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Trending Hashtags</h3>
              <div className="grid grid-cols-2 gap-3">
                {trendingTags.map((tag, i) => (
                  <motion.div key={tag} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/hashtag/${tag}`} className="glass-card p-4 flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
                        <Hash className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-brand-400 transition-colors">#{tag}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trending</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
