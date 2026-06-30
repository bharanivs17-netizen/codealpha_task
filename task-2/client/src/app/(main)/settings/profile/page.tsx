'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store';
import { usersAPI } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import { getAvatarUrl } from '@/lib/utils';
import { Camera, Loader2, Save, User, MapPin, Link2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
    location: user?.location || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const { getRootProps: getAvatarProps, getInputProps: getAvatarInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    },
  });

  const { getRootProps: getCoverProps, getInputProps: getCoverInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: ([file]) => {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (avatarFile) formData.append('avatar', avatarFile);
      if (coverFile) formData.append('coverPhoto', coverFile);
      const { data } = await usersAPI.updateProfile(formData);
      updateUser(data.user);
      toast.success('Profile updated! ✨');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold">Edit Profile</h1>

      {/* Cover photo */}
      <div {...getCoverProps()} className="relative cursor-pointer group">
        <input {...getCoverInputProps()} />
        <div className="h-40 rounded-2xl overflow-hidden"
          style={{ background: user.coverPhoto ? undefined : 'var(--gradient-brand)' }}>
          <img
            src={coverPreview || user.coverPhoto || ''}
            alt="Cover"
            className="w-full h-full object-cover"
            style={{ display: coverPreview || user.coverPhoto ? 'block' : 'none' }}
          />
          {!coverPreview && !user.coverPhoto && (
            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899, #3b82f6)' }} />
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
          <span className="text-white font-medium ml-2">Change Cover</span>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-end gap-4 -mt-12 ml-4">
        <div {...getAvatarProps()} className="relative cursor-pointer group">
          <input {...getAvatarInputProps()} />
          <div className="w-24 h-24 rounded-full ring-4 overflow-hidden" style={{ ringColor: 'var(--bg-primary)' }}>
            <img src={avatarPreview || getAvatarUrl(user)} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-sm pb-2" style={{ color: 'var(--text-muted)' }}>Click to change avatar</p>
      </div>

      {/* Form Fields */}
      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-brand-400" /> Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Your Name"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-medium" style={{ color: 'var(--text-muted)' }}>@</span>
              <input
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                className="input-field pl-8"
                placeholder="username"
                maxLength={30}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-400" /> Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            className="input-field resize-none"
            placeholder="Tell the world about yourself..."
            maxLength={200}
          />
          <p className="text-xs text-right mt-1" style={{ color: 'var(--text-muted)' }}>{form.bio.length}/200</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-400" /> Location
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              className="input-field"
              placeholder="City, Country"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-brand-400" /> Website
            </label>
            <input
              value={form.website}
              onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              className="input-field"
              placeholder="https://yourwebsite.com"
              type="url"
            />
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={loading}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
      </motion.button>
    </div>
  );
}
