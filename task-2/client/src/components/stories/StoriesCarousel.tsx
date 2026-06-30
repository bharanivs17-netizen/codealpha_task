'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storiesAPI } from '@/lib/api';
import { getAvatarUrl } from '@/lib/utils';
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import StoryViewer from './StoryViewer';

interface StoryGroup {
  author: { _id: string; username: string; name: string; avatar: string; isVerified: boolean };
  stories: unknown[];
  hasUnviewed: boolean;
}

export default function StoriesCarousel() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const { user } = useAuthStore();
  const { setCreatePostOpen } = useUIStore();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data } = await storiesAPI.getFeed();
        setStoryGroups(data.stories);
      } catch {
        // Stories unavailable - non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const openStoryGroup = (group: StoryGroup, index: number) => {
    setViewingGroup(group);
    setViewingIndex(index);
  };

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="skeleton w-16 h-16 rounded-full" />
              <div className="skeleton h-2 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-4">
        <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* Add Story Button */}
          {user && (
            <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
              onClick={() => setCreatePostOpen(true)}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full ring-2 ring-dashed ring-brand-400/50 flex items-center justify-center transition-all group-hover:ring-brand-400"
                  style={{ background: 'var(--bg-tertiary)' }}>
                  <Plus className="w-6 h-6 text-brand-400" />
                </div>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Your Story</span>
            </div>
          )}

          {/* Story bubbles */}
          {storyGroups.map((group, i) => (
            <motion.div
              key={group.author._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
              onClick={() => openStoryGroup(group, 0)}
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full ring-2 p-0.5 transition-all group-hover:scale-105 ${
                  group.hasUnviewed
                    ? 'ring-brand-400 bg-gradient-brand'
                    : 'ring-gray-400/30'
                }`}>
                  <img
                    src={getAvatarUrl(group.author)}
                    alt={group.author.name}
                    className="w-full h-full rounded-full object-cover ring-2"
                    style={{ '--tw-ring-color': 'var(--bg-secondary)' } as React.CSSProperties}
                  />
                </div>
              </div>
              <span className="text-xs font-medium max-w-[64px] text-center truncate"
                style={{ color: 'var(--text-secondary)' }}>
                {group.author.username}
              </span>
            </motion.div>
          ))}

          {storyGroups.length === 0 && !loading && (
            <div className="flex items-center py-2" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No stories yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewingGroup && (
          <StoryViewer
            group={viewingGroup}
            initialIndex={viewingIndex}
            onClose={() => setViewingGroup(null)}
            onNext={() => {
              const nextGroupIdx = storyGroups.findIndex((g) => g.author._id === viewingGroup.author._id) + 1;
              if (nextGroupIdx < storyGroups.length) {
                setViewingGroup(storyGroups[nextGroupIdx]);
              } else {
                setViewingGroup(null);
              }
            }}
            onPrev={() => {
              const prevGroupIdx = storyGroups.findIndex((g) => g.author._id === viewingGroup.author._id) - 1;
              if (prevGroupIdx >= 0) {
                setViewingGroup(storyGroups[prevGroupIdx]);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
