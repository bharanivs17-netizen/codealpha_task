'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Repeat2,
  Play, CheckCircle, Trash2, Edit3, Flag,
} from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { cn, formatDate, formatNumber, getAvatarUrl, linkifyContent } from '@/lib/utils';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';

interface Post {
  _id: string;
  author: { _id: string; username: string; name: string; avatar: string; isVerified: boolean };
  content: string;
  media?: Array<{ url: string; type: 'image' | 'video'; thumbnail?: string }>;
  likes: string[];
  likesCount?: number;
  comments: unknown[];
  commentsCount?: number;
  saves: string[];
  reposts: string[];
  hashtags: string[];
  isRepost?: boolean;
  originalPost?: { content: string; author: { username: string } };
  createdAt: string;
  views?: number;
  aiSummary?: string;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onUpdate?: (post: Post) => void;
}

export default function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes?.length ?? 0);
  const [saved, setSaved] = useState(post.saves?.includes(user?._id || '') || false);
  const [reposted, setReposted] = useState(post.reposts?.includes(user?._id || '') || false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? post.comments?.length ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);

  const isOwnPost = user?._id === post.author._id;

  const handleLike = async () => {
    if (!user) return;
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    if (!liked) {
      setIsAnimatingLike(true);
      setTimeout(() => setIsAnimatingLike(false), 500);
    }
    try {
      await postsAPI.like(post._id);
    } catch {
      setLiked(!liked);
      setLikesCount(liked ? likesCount : likesCount - 1);
    }
  };

  const handleSave = async () => {
    setSaved(!saved);
    try {
      await postsAPI.save(post._id);
      toast.success(saved ? 'Post unsaved' : 'Post saved! ✨');
    } catch {
      setSaved(!saved);
    }
  };

  const handleRepost = async () => {
    setReposted(!reposted);
    try {
      await postsAPI.repost(post._id);
      toast.success(reposted ? 'Repost removed' : 'Reposted! 🔄');
    } catch {
      setReposted(!reposted);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await postsAPI.delete(post._id);
      onDelete?.(post._id);
      toast.success('Post deleted.');
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `Post by @${post.author.username}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="post-card"
    >
      {/* Repost indicator */}
      {post.isRepost && post.originalPost && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          <Repeat2 className="w-3.5 h-3.5" />
          <span>Reposted from @{post.originalPost.author.username}</span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <img
                src={getAvatarUrl(post.author)}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-400/40 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm group-hover:text-brand-400 transition-colors">
                  {post.author.name}
                </span>
                {post.author.isVerified && (
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>@{post.author.username}</span>
                <span>·</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </Link>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-8 w-44 glass-card py-1 z-20"
                style={{ boxShadow: 'var(--glass-shadow)' }}
              >
                {isOwnPost && (
                  <>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Edit3 className="w-4 h-4" /> Edit Post
                    </button>
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )}
                {!isOwnPost && (
                  <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors">
                    <Flag className="w-4 h-4" /> Report
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Content */}
        {post.content && (
          <div
            className="text-sm leading-relaxed mb-3 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: linkifyContent(post.content) }}
          />
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.hashtags.slice(0, 6).map((tag) => (
              <Link key={tag} href={`/hashtag/${tag}`} className="hashtag-tag">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="relative overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          {post.media[currentMediaIndex].type === 'video' ? (
            <div className="relative aspect-video">
              <video
                src={post.media[currentMediaIndex].url}
                controls
                className="w-full h-full object-cover"
                poster={post.media[currentMediaIndex].thumbnail}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100">
                <Play className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <img
              src={post.media[currentMediaIndex].url}
              alt="Post media"
              className="w-full max-h-[500px] object-cover"
              loading="lazy"
            />
          )}

          {/* Multi-media indicators */}
          {post.media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentMediaIndex(i)}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === currentMediaIndex ? 'bg-white w-4' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={cn(
              'like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium',
              liked ? 'text-red-500' : 'hover:bg-red-500/5 hover:text-red-400',
              liked && 'liked'
            )}
          >
            <Heart
              className={cn('w-5 h-5 transition-all', liked && 'fill-red-500')}
              style={isAnimatingLike ? { animation: 'bounceIn 0.4s ease' } : {}}
            />
            <span>{formatNumber(likesCount)}</span>
          </motion.button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium hover:bg-blue-500/5 hover:text-blue-400"
            style={{ color: 'var(--text-muted)' }}
          >
            <MessageCircle className="w-5 h-5" />
            <span>{formatNumber(commentsCount)}</span>
          </button>

          {/* Repost */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleRepost}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium',
              reposted ? 'text-green-500' : 'hover:bg-green-500/5 hover:text-green-400'
            )}
            style={{ color: reposted ? undefined : 'var(--text-muted)' }}
          >
            <Repeat2 className="w-5 h-5" />
          </motion.button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-brand-400/5 hover:text-brand-400"
            style={{ color: 'var(--text-muted)' }}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Save */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleSave}
          className={cn('p-2 rounded-lg transition-colors', saved ? 'text-brand-400' : 'hover:text-brand-400 hover:bg-brand-400/5')}
          style={{ color: saved ? undefined : 'var(--text-muted)' }}
        >
          <Bookmark className={cn('w-5 h-5', saved && 'fill-current')} />
        </motion.button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post._id}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
          onCommentDeleted={() => setCommentsCount((c) => c - 1)}
        />
      )}
    </motion.article>
  );
}
