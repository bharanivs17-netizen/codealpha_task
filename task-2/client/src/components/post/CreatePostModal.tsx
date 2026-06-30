'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Video, Sparkles, Hash, Loader2, MapPin, Globe, Lock, Users } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { postsAPI, aiAPI } from '@/lib/api';
import { useAuthStore, useUIStore } from '@/store';
import { getAvatarUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  onPostCreated?: (post: unknown) => void;
}

const visibilityOptions = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'followers', label: 'Followers', icon: Users },
  { value: 'private', label: 'Private', icon: Lock },
];

const postTypeOptions = [
  { value: 'post', label: 'Post' },
  { value: 'reel', label: 'Reel' },
];

export default function CreatePostModal({ onPostCreated }: CreatePostModalProps) {
  const { createPostOpen, setCreatePostOpen } = useUIStore();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [visibility, setVisibility] = useState('public');
  const [postType, setPostType] = useState('post');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<'caption' | 'hashtag' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiHashtags, setAiHashtags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...mediaFiles, ...acceptedFiles].slice(0, 10);
    setMediaFiles(newFiles);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setMediaPreviews(previews);
  }, [mediaFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024,
  });

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleAICaption = async () => {
    if (!content && mediaFiles.length === 0) {
      toast.error('Add some context first');
      return;
    }
    setAiLoading('caption');
    try {
      const { data } = await aiAPI.generateCaption(content || 'social media post');
      setAiSuggestions(data.captions);
    } catch {
      toast.error('AI caption failed');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIHashtags = async () => {
    if (!content) { toast.error('Write something first'); return; }
    setAiLoading('hashtag');
    try {
      const { data } = await aiAPI.generateHashtags(content);
      setAiHashtags(data.hashtags);
    } catch {
      toast.error('AI hashtag generation failed');
    } finally {
      setAiLoading(null);
    }
  };

  const addHashtagsToContent = () => {
    const tags = aiHashtags.map((h) => `#${h}`).join(' ');
    setContent((prev) => prev + (prev.endsWith(' ') || !prev ? '' : '\n') + tags);
    setAiHashtags([]);
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Add content or media');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      formData.append('postType', postType);
      mediaFiles.forEach((f) => formData.append('media', f));

      const { data } = await postsAPI.create(formData);
      onPostCreated?.(data.post);
      toast.success('Post created! ✨');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setCreatePostOpen(false);
    } catch {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatePostOpen(false);
    setAiSuggestions([]);
    setAiHashtags([]);
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {createPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-card p-0 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold text-lg">Create Post</h2>
              <div className="flex items-center gap-3">
                {/* Post type */}
                <select
                  value={postType}
                  onChange={(e) => setPostType(e.target.value)}
                  className="text-sm rounded-lg px-3 py-1.5 border font-medium"
                  style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
                >
                  {postTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex gap-3 mb-4">
                <img src={getAvatarUrl(user)} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-brand-400/30" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.name}</p>
                  {/* Visibility selector */}
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-xs mt-1 rounded-lg px-2 py-1 border font-medium"
                    style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    {visibilityOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text area */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={postType === 'reel' ? "Describe your reel..." : "What's on your mind?"}
                className="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed min-h-[120px] placeholder-gray-400"
                maxLength={2200}
                style={{ color: 'var(--text-primary)' }}
              />

              {/* Character count */}
              <div className="text-right text-xs mb-3" style={{ color: content.length > 2000 ? '#ef4444' : 'var(--text-muted)' }}>
                {content.length}/2200
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                  <p className="text-xs font-semibold mb-2 text-brand-400">✨ AI Caption Suggestions</p>
                  <div className="space-y-2">
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setContent(s); setAiSuggestions([]); }}
                        className="w-full text-left text-sm p-2.5 rounded-lg hover:bg-white/5 transition-colors border"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Hashtag suggestions */}
              {aiHashtags.length > 0 && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-brand-400"># AI Hashtags</p>
                    <button onClick={addHashtagsToContent} className="text-xs font-semibold text-brand-400 hover:underline">
                      Add All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiHashtags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => setContent((prev) => prev + ` #${tag}`)}
                        className="hashtag-tag text-xs"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {mediaPreviews.map((preview, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      {mediaFiles[i]?.type.startsWith('video/') ? (
                        <video src={preview} className="w-full h-full object-cover" />
                      ) : (
                        <img src={preview} alt={`Media ${i}`} className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drag & Drop zone */}
              {mediaPreviews.length === 0 && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-brand-400 bg-brand-400/5' : 'border-gray-600 hover:border-brand-400/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex gap-2">
                      <Image className="w-6 h-6" />
                      <Video className="w-6 h-6" />
                    </div>
                    <p className="text-sm">Drag & drop media, or click to browse</p>
                    <p className="text-xs">Images, Videos up to 100MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              {/* AI Tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAICaption}
                  disabled={!!aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-brand-400/10 text-brand-400 border border-brand-400/30"
                >
                  {aiLoading === 'caption' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  AI Caption
                </button>
                <button
                  onClick={handleAIHashtags}
                  disabled={!!aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-blue-400/10 text-blue-400 border border-blue-400/30"
                >
                  {aiLoading === 'hashtag' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
                  AI Hashtags
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && mediaFiles.length === 0)}
                className="btn-primary py-2 px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
