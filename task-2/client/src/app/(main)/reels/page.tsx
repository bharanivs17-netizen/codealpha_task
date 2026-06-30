'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsAPI } from '@/lib/api';
import { useInView } from 'react-intersection-observer';
import { Play, Heart, MessageCircle, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getAvatarUrl, formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface Reel {
  _id: string;
  author: { _id: string; username: string; name: string; avatar: string; isVerified: boolean };
  content: string;
  media: { url: string; type: string; thumbnail?: string }[];
  likes: string[];
  comments: unknown[];
  createdAt: string;
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const { ref: loadMoreRef, inView } = useInView();

  const fetchReels = useCallback(async (pageNum: number) => {
    try {
      const { data } = await postsAPI.getReels(pageNum);
      if (pageNum === 1) {
        setReels(data.reels);
      } else {
        setReels((prev) => [...prev, ...data.reels]);
      }
      setHasMore(data.reels.length === 10);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReels(1); }, [fetchReels]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchReels(next);
    }
  }, [inView, hasMore, loading, page, fetchReels]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" style={{ color: 'var(--text-muted)' }}>
        <Play className="w-16 h-16 opacity-20" />
        <p className="font-semibold">No reels yet</p>
        <p className="text-sm">Create a reel to get started!</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-6">
      <div className="relative h-screen overflow-hidden" style={{ background: '#000' }}>
        {/* Reel feed - scroll snapping */}
        <div className="h-full overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          {reels.map((reel, index) => (
            <div key={reel._id} className="relative h-screen w-full snap-start flex items-center justify-center"
              onMouseEnter={() => setActiveIndex(index)}>
              {/* Video */}
              {reel.media[0] && (
                <video
                  src={reel.media[0].url}
                  className="w-full h-full object-cover"
                  autoPlay={index === activeIndex}
                  loop
                  muted={muted}
                  playsInline
                  poster={reel.media[0].thumbnail}
                />
              )}

              {/* Gradient overlays */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, transparent 80%, rgba(0,0,0,0.4) 100%)' }} />

              {/* Mute toggle */}
              <button onClick={() => setMuted(!muted)}
                className="absolute top-6 right-4 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Author info - bottom left */}
              <div className="absolute bottom-20 left-4 right-20 z-20">
                <Link href={`/profile/${reel.author.username}`} className="flex items-center gap-2 mb-3">
                  <img src={getAvatarUrl(reel.author)} alt={reel.author.name}
                    className="w-10 h-10 rounded-full ring-2 ring-white/40 object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">@{reel.author.username}</p>
                  </div>
                </Link>
                {reel.content && (
                  <p className="text-white text-sm leading-relaxed line-clamp-3">{reel.content}</p>
                )}
              </div>

              {/* Action buttons - right */}
              <div className="absolute bottom-24 right-4 z-20 flex flex-col items-center gap-6">
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="text-white text-xs font-medium">{formatNumber(reel.likes.length)}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-white text-xs font-medium">{formatNumber(reel.comments.length)}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {hasMore && <Loader2 className="w-5 h-5 animate-spin text-white/50" />}
          </div>
        </div>
      </div>
    </div>
  );
}
