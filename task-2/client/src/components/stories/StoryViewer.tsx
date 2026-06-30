'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { storiesAPI } from '@/lib/api';
import { getAvatarUrl, formatDate } from '@/lib/utils';

interface Story {
  _id: string;
  media: { url: string; type: 'image' | 'video' };
  text?: string;
  duration?: number;
  createdAt: string;
}

interface StoryGroup {
  author: { _id: string; username: string; name: string; avatar: string };
  stories: Story[];
  hasUnviewed: boolean;
}

interface StoryViewerProps {
  group: StoryGroup;
  initialIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function StoryViewer({ group, initialIndex = 0, onClose, onNext, onPrev }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStory = group.stories[currentIndex];
  const duration = currentStory?.duration || 5;

  const advance = useCallback(() => {
    if (currentIndex < group.stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onNext?.();
    }
  }, [currentIndex, group.stories.length, onNext]);

  useEffect(() => {
    if (!currentStory) return;
    // Mark as viewed
    storiesAPI.view(currentStory._id).catch(() => {});

    setProgress(0);
    const step = 100 / (duration * 20);
    intervalRef.current = setInterval(() => {
      if (!paused) {
        setProgress((p) => {
          if (p >= 100) {
            advance();
            return 0;
          }
          return p + step;
        });
      }
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentIndex, paused, advance, duration, currentStory]);

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    } else {
      onPrev?.();
    }
  };

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full md:h-[90vh] md:max-h-[700px] md:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setPaused(true)}
        onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {group.stories.map((_, i) => (
            <div key={i} className="story-progress flex-1">
              <div
                className="story-progress-fill"
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                  transitionDuration: i === currentIndex ? '50ms' : '0ms',
                }}
              />
            </div>
          ))}
        </div>

        {/* Author info */}
        <div className="absolute top-8 left-3 right-10 z-20 flex items-center gap-2 pt-2">
          <img src={getAvatarUrl(group.author)} alt={group.author.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/40" />
          <div>
            <p className="text-white text-sm font-semibold">{group.author.name}</p>
            <p className="text-white/70 text-xs">{formatDate(currentStory.createdAt)}</p>
          </div>
        </div>

        {/* Close */}
        <button onClick={onClose} className="absolute top-8 right-3 z-20 text-white/80 hover:text-white p-1.5 pt-2">
          <X className="w-5 h-5" />
        </button>

        {/* Media */}
        {currentStory.media.type === 'video' ? (
          <video
            src={currentStory.media.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img src={currentStory.media.url} alt="Story" className="w-full h-full object-cover" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Story text */}
        {currentStory.text && (
          <div className="absolute bottom-20 left-4 right-4 z-20">
            <p className="text-white text-lg font-semibold text-center drop-shadow-lg">{currentStory.text}</p>
          </div>
        )}

        {/* Navigation tap zones */}
        <button
          onClick={goBack}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Previous story"
        />
        <button
          onClick={advance}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Next story"
        />
      </div>
    </motion.div>
  );
}
