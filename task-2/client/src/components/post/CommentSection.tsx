'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { getAvatarUrl, formatDate, formatNumber } from '@/lib/utils';
import { Heart, Trash2, Send, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  user: { _id: string; username: string; name: string; avatar: string; isVerified: boolean };
  content: string;
  likes: string[];
  createdAt: string;
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data } = await postsAPI.getPost(postId);
        setComments(data.post.comments || []);
      } catch {
        toast.error('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data } = await postsAPI.addComment(postId, newComment.trim());
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
      onCommentAdded();
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await postsAPI.deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      onCommentDeleted();
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border-color)' }}>
      {/* Comment input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
          <img src={getAvatarUrl(user)} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 relative">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="input-field pr-12 py-2 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg disabled:opacity-40 transition-colors text-brand-400 hover:bg-brand-400/10"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 group"
              >
                <Link href={`/profile/${comment.user.username}`}>
                  <img
                    src={getAvatarUrl(comment.user)}
                    alt={comment.user.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--bg-tertiary)' }}>
                    <Link href={`/profile/${comment.user.username}`} className="flex items-center gap-1 mb-1">
                      <span className="font-semibold text-xs">{comment.user.name}</span>
                      {comment.user.isVerified && <CheckCircle className="w-3 h-3 text-blue-500 fill-blue-500" />}
                    </Link>
                    <p className="text-sm leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 pl-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(comment.createdAt)}</span>
                    {(user?._id === comment.user._id) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-xs text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm py-4" style={{ color: 'var(--text-muted)' }}>
                No comments yet. Be the first!
              </p>
            )}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
