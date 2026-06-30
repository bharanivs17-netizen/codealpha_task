'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '@/lib/api';
import {
  BarChart2, Users, FileText, TrendingUp, AlertTriangle, Loader2,
  AreaChart, Users2
} from 'lucide-react';
import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

interface Analytics {
  stats: {
    totalUsers: number;
    totalPosts: number;
    newUsers: number;
    newPosts: number;
    bannedUsers: number;
    flaggedPosts: number;
    pendingReports: number;
  };
  growthData: { date: string; users: number; posts: number }[];
}

const StatCard = ({ label, value, icon: Icon, gradient, sub }: {
  label: string; value: number | string; icon: typeof BarChart2; gradient: string; sub?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5 relative overflow-hidden">
    <div className="absolute inset-0 opacity-5" style={{ background: gradient }} />
    <div className="relative">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3`}
        style={{ background: gradient }}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {sub && <p className="text-xs mt-1 text-green-400">{sub}</p>}
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await adminAPI.getAnalytics();
        setAnalytics(data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (!analytics) return (
    <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
      <p>Unable to load analytics.</p>
    </div>
  );

  const { stats, growthData } = analytics;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, gradient: 'linear-gradient(135deg,#7c3aed,#3b82f6)', sub: `+${stats.newUsers} this month` },
    { label: 'Total Posts', value: stats.totalPosts, icon: FileText, gradient: 'linear-gradient(135deg,#ec4899,#f97316)', sub: `+${stats.newPosts} this month` },
    { label: 'Banned Users', value: stats.bannedUsers, icon: AlertTriangle, gradient: 'linear-gradient(135deg,#ef4444,#f97316)' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { label: 'Flagged Posts', value: stats.flaggedPosts, icon: FileText, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'New Users (30d)', value: stats.newUsers, icon: TrendingUp, gradient: 'linear-gradient(135deg,#10b981,#3b82f6)' },
  ];

  const chartColors = { bg: 'var(--bg-tertiary)', text: 'var(--text-muted)', border: 'var(--border-color)' };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Analytics Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Platform overview and growth metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} transition={{ delay: i * 0.05 }}>
            <StatCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* Growth Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" /> 7-Day Growth
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <ReAreaChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="postsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
              labelStyle={{ color: 'var(--text-muted)', fontSize: 12 }}
            />
            <Legend />
            <Area type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} fill="url(#usersGrad)" name="Users" />
            <Area type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2} fill="url(#postsGrad)" name="Posts" />
          </ReAreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" /> Daily Activity
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
            />
            <Legend />
            <Bar dataKey="users" fill="#7c3aed" radius={[4, 4, 0, 0]} name="New Users" />
            <Bar dataKey="posts" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Posts" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
