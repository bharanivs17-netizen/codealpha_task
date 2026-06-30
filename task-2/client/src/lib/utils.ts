import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  if (new Date().getFullYear() === d.getFullYear()) return format(d, 'MMM d');
  return format(d, 'MMM d, yyyy');
}

export function formatChatTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarUrl(user: { avatar?: string; name: string }): string {
  if (user.avatar) return user.avatar;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=6d28d9&textColor=ffffff`;
}

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\w]+/g);
  return matches ? [...new Set(matches.map((h) => h.slice(1).toLowerCase()))] : [];
}

export function linkifyContent(content: string): string {
  return content
    .replace(/#([\w]+)/g, '<a href="/hashtag/$1" class="hashtag-link text-brand-400 hover:underline">#$1</a>')
    .replace(/@([\w]+)/g, '<a href="/profile/$1" class="mention-link text-accent-400 hover:underline">@$1</a>');
}

export function getMediaType(url: string): 'image' | 'video' | 'audio' | 'unknown' {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'webm'].includes(ext)) return 'audio';
  return 'unknown';
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function generateGradientAvatar(name: string): string {
  const colors = [
    ['#7c3aed', '#3b82f6'],
    ['#ec4899', '#7c3aed'],
    ['#f97316', '#ec4899'],
    ['#10b981', '#3b82f6'],
    ['#f59e0b', '#ef4444'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}
