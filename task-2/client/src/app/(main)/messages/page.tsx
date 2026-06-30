'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { messagesAPI } from '@/lib/api';
import { useAuthStore, useChatStore } from '@/store';
import { getAvatarUrl, formatChatTime } from '@/lib/utils';
import { Send, Mic, MicOff, Image, Smile, ArrowLeft, Loader2, Check, CheckCheck } from 'lucide-react';
import { emitTyping, useSocketMessage } from '@/lib/socket';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';

interface Conversation {
  _id: string;
  participants: { _id: string; username: string; name: string; avatar: string; lastSeen: string }[];
  lastMessageText?: string;
  lastMessageAt: string;
}

interface Message {
  _id: string;
  sender: { _id: string; username: string; name: string; avatar: string };
  content: string;
  messageType: string;
  media?: { url: string };
  readBy: string[];
  createdAt: string;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { onlineUsers, typingUsers } = useChatStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await messagesAPI.getConversations();
        setConversations(data.conversations);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    const fetchMessages = async () => {
      try {
        const { data } = await messagesAPI.getMessages(activeConv._id);
        setMessages(data.messages);
        scrollToBottom();
      } catch {
        toast.error('Failed to load messages');
      }
    };
    fetchMessages();
  }, [activeConv]);

  useSocketMessage(activeConv?._id || null, (msgData) => {
    const { message } = msgData as { conversationId: string; message: Message };
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  });

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!activeConv || !user) return;
    const recipient = activeConv.participants.find((p) => p._id !== user._id);
    if (!recipient) return;
    emitTyping(activeConv._id, recipient._id, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      emitTyping(activeConv._id, recipient._id, false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    const text = newMessage;
    setNewMessage('');
    const formData = new FormData();
    formData.append('content', text);
    formData.append('messageType', 'text');
    try {
      const { data } = await messagesAPI.send(activeConv._id, formData);
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    } catch {
      toast.error('Failed to send message');
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p._id !== user?._id);
  };

  const isTyping = activeConv ? typingUsers.has(activeConv._id) : false;

  return (
    <div className="flex h-[calc(100vh-2rem)] glass-card overflow-hidden -mt-6 -mx-4 rounded-none md:rounded-2xl">
      {/* Conversations List */}
      <div className={`${activeConv ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r`}
        style={{ borderColor: 'var(--border-color)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              if (!other) return null;
              const isOnline = onlineUsers.has(other._id);
              return (
                <button
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/5 ${activeConv?._id === conv._id ? 'bg-brand-400/10' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={getAvatarUrl(other)} alt={other.name} className="w-12 h-12 rounded-full object-cover" />
                    {isOnline && <div className="online-dot" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{other.name}</p>
                    {conv.lastMessageText && (
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {conv.lastMessageText}
                      </p>
                    )}
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatChatTime(conv.lastMessageAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Window */}
      {activeConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          {(() => {
            const other = getOtherParticipant(activeConv);
            if (!other) return null;
            const isOnline = onlineUsers.has(other._id);
            return (
              <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <button onClick={() => setActiveConv(null)} className="md:hidden p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img src={getAvatarUrl(other)} alt={other.name} className="w-10 h-10 rounded-full object-cover" />
                  {isOnline && <div className="online-dot" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{other.name}</p>
                  <p className="text-xs" style={{ color: isOnline ? '#22c55e' : 'var(--text-muted)' }}>
                    {isOnline ? 'Online' : `Last seen ${formatChatTime(other.lastSeen)}`}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => {
              const isOwn = msg.sender._id === user?._id;
              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {!isOwn && (
                    <img src={getAvatarUrl(msg.sender)} alt={msg.sender.name} className="w-7 h-7 rounded-full flex-shrink-0" />
                  )}
                  <div className={`max-w-xs lg:max-w-sm ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {msg.media?.url && (
                      <img src={msg.media.url} alt="Media" className="max-w-full rounded-2xl" />
                    )}
                    {msg.content && (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isOwn
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm'
                        }`}
                        style={{
                          background: isOwn ? 'var(--gradient-brand)' : 'var(--bg-tertiary)',
                        }}
                      >
                        {msg.content}
                      </div>
                    )}
                    <div className={`flex items-center gap-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatChatTime(msg.createdAt)}</span>
                      {isOwn && (
                        msg.readBy.length > 1
                          ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                          : <Check className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-600 flex-shrink-0" />
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1" style={{ background: 'var(--bg-tertiary)' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-4 border-t relative" style={{ borderColor: 'var(--border-color)' }}>
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-4 mb-2 z-20">
                  <EmojiPicker
                    onEmojiClick={(e) => setNewMessage((prev) => prev + e.emoji)}
                    theme={'dark' as 'dark'}
                    height={350}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 rounded-xl transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Message..."
                className="flex-1 input-field py-2.5"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="p-2.5 rounded-xl bg-gradient-brand text-white disabled:opacity-50 transition-all hover:shadow-brand"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3" style={{ color: 'var(--text-muted)' }}>
          <div className="w-16 h-16 rounded-full bg-brand-400/10 flex items-center justify-center">
            <Send className="w-8 h-8 text-brand-400" />
          </div>
          <p className="font-semibold text-lg">Your Messages</p>
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
