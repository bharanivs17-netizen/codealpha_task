'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, FileText, Flag, BarChart2, Search, Ban, Trash2,
  CheckCircle, Clock, RefreshCw, Loader2, ChevronDown
} from 'lucide-react';
import { getAvatarUrl, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'users' | 'posts' | 'reports';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<unknown[]>([]);
  const [posts, setPosts] = useState<unknown[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);
  const [analytics, setAnalytics] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || !['admin', 'moderator'].includes(user.role)) {
      router.replace('/feed');
    }
  }, [user, router]);

  useEffect(() => {
    loadTabData();
  }, [tab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const { data } = await adminAPI.getAnalytics();
        setAnalytics(data);
      } else if (tab === 'users') {
        const { data } = await adminAPI.getUsers();
        setUsers(data.users);
      } else if (tab === 'posts') {
        const { data } = await adminAPI.getPosts();
        setPosts(data.posts);
      } else if (tab === 'reports') {
        const { data } = await adminAPI.getReports();
        setReports(data.reports);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      await adminAPI.banUser(userId, ban);
      setUsers((prev) => (prev as { _id: string; isBanned: boolean }[]).map((u) =>
        u._id === userId ? { ...u, isBanned: ban } : u
      ));
      toast.success(`User ${ban ? 'banned' : 'unbanned'}`);
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await adminAPI.deletePost(postId);
      setPosts((prev) => (prev as { _id: string }[]).filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed');
    }
  };

  const handleReviewReport = async (reportId: string, status: string) => {
    try {
      await adminAPI.reviewReport(reportId, { status });
      setReports((prev) => (prev as { _id: string; status: string }[]).map((r) =>
        r._id === reportId ? { ...r, status } : r
      ));
      toast.success('Report updated');
    } catch {
      toast.error('Failed');
    }
  };

  const adminTabs = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: BarChart2 },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'posts' as AdminTab, label: 'Posts', icon: FileText },
    { id: 'reports' as AdminTab, label: 'Reports', icon: Flag },
  ];

  const stats = analytics ? (analytics as { stats: Record<string, number> }).stats : null;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Platform management & moderation</p>
        </div>
        <button onClick={loadTabData} className="ml-auto btn-ghost p-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
        {adminTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-gradient-brand text-white shadow-brand-sm' : ''
            }`}
            style={{ color: tab === t.id ? undefined : 'var(--text-secondary)' }}>
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && stats && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: 'totalUsers', l: 'Total Users', color: '#7c3aed' },
                { k: 'totalPosts', l: 'Total Posts', color: '#3b82f6' },
                { k: 'newUsers', l: 'New Users (30d)', color: '#10b981' },
                { k: 'newPosts', l: 'New Posts (30d)', color: '#f59e0b' },
                { k: 'bannedUsers', l: 'Banned Users', color: '#ef4444' },
                { k: 'pendingReports', l: 'Pending Reports', color: '#f97316' },
              ].map(({ k, l, color }) => (
                <motion.div key={k} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-5">
                  <p className="text-2xl font-black" style={{ color }}>{stats[k]?.toLocaleString()}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{l}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..." className="input-field pl-10" />
              </div>
              <div className="space-y-2">
                {(users as {
                  _id: string; username: string; name: string; avatar: string;
                  email: string; role: string; isBanned: boolean; createdAt: string;
                }[])
                  .filter((u) => !search || u.username.includes(search) || u.email.includes(search))
                  .map((u, i) => (
                    <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="glass-card p-4 flex items-center gap-4">
                      <img src={getAvatarUrl(u)} alt={u.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{u.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            u.role === 'admin' ? 'bg-brand-400/20 text-brand-400' :
                            u.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>{u.role}</span>
                          {u.isBanned && <span className="text-xs text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Banned</span>}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Joined {formatDate(u.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBanUser(u._id, !u.isBanned)}
                          className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                            u.isBanned ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          }`}
                          title={u.isBanned ? 'Unban' : 'Ban'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {tab === 'posts' && (
            <div className="space-y-3">
              {(posts as {
                _id: string;
                author: { username: string; name: string; avatar: string };
                content: string;
                isFlagged: boolean;
                createdAt: string;
                likes: unknown[];
                comments: unknown[];
              }[]).map((post, i) => (
                <motion.div key={post._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img src={getAvatarUrl(post.author)} alt={post.author.name} className="w-9 h-9 rounded-full flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">@{post.author.username}</p>
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {post.content || '📎 Media post'}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>❤️ {post.likes?.length}</span>
                          <span>💬 {post.comments?.length}</span>
                          <span>{formatDate(post.createdAt)}</span>
                          {post.isFlagged && <span className="text-orange-400 font-medium">🚩 Flagged</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeletePost(post._id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {posts.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No posts found</p>}
            </div>
          )}

          {/* Reports */}
          {tab === 'reports' && (
            <div className="space-y-3">
              {(reports as {
                _id: string;
                reporter: { username: string; name: string; avatar: string };
                reportedUser?: { username: string; name: string };
                reportedPost?: { content: string };
                type: string;
                reason: string;
                status: string;
                createdAt: string;
              }[]).map((report, i) => (
                <motion.div key={report._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <img src={getAvatarUrl(report.reporter)} alt={report.reporter.name} className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">@{report.reporter.username}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>{report.status}</span>
                      </div>
                      <p className="text-xs font-medium text-orange-400 capitalize">{report.type.replace('_', ' ')}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{report.reason}</p>
                      {report.reportedUser && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Reported user: @{report.reportedUser.username}
                        </p>
                      )}
                      {report.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleReviewReport(report._id, 'resolved')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </button>
                          <button onClick={() => handleReviewReport(report._id, 'dismissed')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors">
                            <Clock className="w-3.5 h-3.5" /> Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {reports.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No reports found</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
