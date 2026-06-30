'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useNotificationStore } from '@/store';
import toast from 'react-hot-toast';

let socket: Socket | null = null;

export const getSocket = () => socket;

export function useSocket() {
  const { token, isAuthenticated, user } = useAuthStore();
  const { addOnlineUser, removeOnlineUser, setTyping } = useChatStore();
  const { incrementUnread } = useNotificationStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || initialized.current) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    initialized.current = true;

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socket.on('user_online', ({ userId }: { userId: string }) => {
      addOnlineUser(userId);
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      removeOnlineUser(userId);
    });

    socket.on('typing_start', ({ conversationId, user: typingUser }: { conversationId: string; user: { _id: string; username: string } }) => {
      setTyping(conversationId, typingUser._id);
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      setTyping(conversationId, null);
    });

    socket.on('notification', (data: { type: string; sender?: { username: string; avatar: string } }) => {
      incrementUnread();
      const messages: Record<string, string> = {
        like: `${data.sender?.username} liked your post`,
        comment: `${data.sender?.username} commented on your post`,
        follow: `${data.sender?.username} started following you`,
        mention: `${data.sender?.username} mentioned you`,
      };
      const msg = messages[data.type] || 'New notification';
      toast(msg, {
        icon: data.type === 'like' ? '❤️' : data.type === 'comment' ? '💬' : data.type === 'follow' ? '👤' : '🔔',
        duration: 3000,
        style: {
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
        },
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        initialized.current = false;
      }
    };
  }, [isAuthenticated, token]);

  return socket;
}

export function useSocketMessage(conversationId: string | null, onMessage: (msg: unknown) => void) {
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', conversationId);
    socket.on('new_message', onMessage as Parameters<typeof socket.on>[1]);

    return () => {
      socket?.emit('leave_conversation', conversationId);
      socket?.off('new_message', onMessage as Parameters<typeof socket.off>[1]);
    };
  }, [conversationId, onMessage]);
}

export function emitTyping(conversationId: string, recipientId: string, isTyping: boolean) {
  if (!socket) return;
  socket.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId, recipientId });
}
