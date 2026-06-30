import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  coverPhoto?: string;
  bio?: string;
  website?: string;
  location?: string;
  isVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  followersCount: number;
  followingCount: number;
  notificationSettings?: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ns_token', token);
          if (refreshToken) localStorage.setItem('ns_refresh_token', refreshToken);
        }
        set({ token, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {}
        localStorage.removeItem('ns_token');
        localStorage.removeItem('ns_refresh_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      refreshUser: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },
    }),
    {
      name: 'novasphere-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ========== UI STORE ===========
interface UIState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  createPostOpen: boolean;
  setCreatePostOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        document.documentElement.classList.toggle('dark', next === 'dark');
      },
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      createPostOpen: false,
      setCreatePostOpen: (open) => set({ createPostOpen: open }),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    { name: 'novasphere-ui', partialize: (state) => ({ theme: state.theme }) }
  )
);

// ========== NOTIFICATIONS STORE ===========
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}));

// ========== CHAT STORE ===========
interface ChatState {
  activeConversation: string | null;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // conversationId -> userId
  setActiveConversation: (id: string | null) => void;
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setTyping: (conversationId: string, userId: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  setActiveConversation: (id) => set({ activeConversation: id }),
  setOnlineUsers: (users) => set({ onlineUsers: new Set(users) }),
  addOnlineUser: (userId) => set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })),
  removeOnlineUser: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
  setTyping: (conversationId, userId) =>
    set((state) => {
      const next = new Map(state.typingUsers);
      if (userId) next.set(conversationId, userId);
      else next.delete(conversationId);
      return { typingUsers: next };
    }),
}));
