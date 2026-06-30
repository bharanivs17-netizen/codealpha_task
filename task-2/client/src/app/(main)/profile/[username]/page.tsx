'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { usersAPI, postsAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { getAvatarUrl, formatNumber } from '@/lib/utils';
import PostCard from '@/components/post/PostCard';
import {
  CheckCircle, MapPin, Link2, Calendar, Settings, UserPlus, UserMinus,
  Grid3X3, Film, Bookmark, Activity, Loader2, Camera, Edit3,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface UserProfile {
  _id: string;
  username: string;
  name: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  website: string;
  location: string;
  isVerified: boolean;
  role: string;
  followers: { _id: string; username: string; name: string; avatar: string }[];
  following: { _id: string; username: string; name: string; avatar: string }[];
  postsCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  createdAt: string;
}

type ProfileTab = 'posts' | 'reels' | 'saved';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile) fetchPosts(activeTab);
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getProfile(username);
      setProfile(data.user);
    } catch {
      toast.error('User not found');
      router.push('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (tab: ProfileTab) => {
    if (!profile) return;
    setPostsLoading(true);
    try {
      if (tab === 'saved' && profile.isOwnProfile) {
        const { data } = await usersAPI.getSavedPosts(username);
        setPosts(data.savedPosts);
      } else {
        const type = tab === 'reels' ? 'reel' : 'post';
        const { data } = await postsAPI.getUserPosts(username, 1, type);
        setPosts(data.posts);
      }
    } catch {
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await usersAPI.follow(profile._id);
      setProfile((prev) => {
        if (!prev) return prev;
        const wasFollowing = prev.isFollowing;
        return {
          ...prev,
          isFollowing: !wasFollowing,
          followers: wasFollowing
            ? prev.followers.filter((f) => f._id !== authUser?._id)
            : [...prev.followers, { _id: authUser?._id || '', username: authUser?.username || '', name: authUser?.name || '', avatar: authUser?.avatar || '' }],
        };
      });
    } catch {
      toast.error('Failed to follow/unfollow');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-24 w-24 rounded-full -mt-12 ml-6" />
        <div className="space-y-2 mt-4">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    { id: 'posts' as ProfileTab, label: 'Posts', icon: Grid3X3 },
    { id: 'reels' as ProfileTab, label: 'Reels', icon: Film },
    ...(profile.isOwnProfile ? [{ id: 'saved' as ProfileTab, label: 'Saved', icon: Bookmark }] : []),
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Cover Photo */}
      <div className="relative">
        <div
          className="h-48 rounded-2xl overflow-hidden"
          style={{ background: profile.coverPhoto ? undefined : 'var(--gradient-brand)' }}
        >
          {profile.coverPhoto && (
            <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          )}
          {!profile.coverPhoto && (
            <div className="w-full h-full opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #3b82f6 100%)' }} />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full ring-4 overflow-hidden"
              style={{ background: 'var(--bg-secondary)', ringColor: 'var(--bg-secondary)' }}>
              <img src={getAvatarUrl(profile)} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            {profile.isOwnProfile && (
              <Link href="/settings/profile"
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </Link>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute bottom-3 right-4 flex gap-2">
          {profile.isOwnProfile ? (
            <Link href="/settings/profile" className="btn-secondary text-sm py-2 px-4">
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Link>
          ) : (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={profile.isFollowing ? 'btn-secondary text-sm py-2 px-4' : 'btn-primary text-sm py-2 px-4'}
            >
              {followLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : profile.isFollowing ? (
                <><UserMinus className="w-4 h-4" />Unfollow</>
              ) : (
                <><UserPlus className="w-4 h-4" />Follow</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-14 px-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.isVerified && <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />}
              {profile.role !== 'user' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>@{profile.username}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brand-400 hover:underline">
              <Link2 className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.createdAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Joined {format(new Date(profile.createdAt), 'MMM yyyy')}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="font-bold text-lg">{formatNumber(profile.postsCount)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Posts</p>
          </div>
          <button onClick={() => setShowFollowers(true)} className="text-center hover:opacity-70 transition-opacity">
            <p className="font-bold text-lg">{formatNumber(profile.followers.length)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Followers</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center hover:opacity-70 transition-opacity">
            <p className="font-bold text-lg">{formatNumber(profile.following.length)}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Following</p>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.id ? 'text-brand-400' : ''
            }`}
            style={{ color: activeTab === tab.id ? undefined : 'var(--text-muted)' }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="profile-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Posts Grid / List */}
      {postsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No {activeTab} yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as { _id: string }[]).map((post) => (
            <PostCard key={(post as { _id: string })._id} post={post as Parameters<typeof PostCard>[0]['post']} />
          ))}
        </div>
      )}

      {/* Followers Modal */}
      <AnimatePresence>
        {(showFollowers || showFollowing) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b font-bold" style={{ borderColor: 'var(--border-color)' }}>
                {showFollowers ? 'Followers' : 'Following'}
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {(showFollowers ? profile.followers : profile.following).map((u) => (
                  <Link key={u._id} href={`/profile/${u.username}`}
                    onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <img src={getAvatarUrl(u)} alt={u.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-sm">{u.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
