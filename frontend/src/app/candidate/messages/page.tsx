'use client';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { messageAPI, interviewAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Send, MessageSquare, Lock, Calendar, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { io, Socket } from 'socket.io-client';

export default function MessagesPage() {
  const { user, token } = useAuthStore();
  const [contacts, setContacts] = useState<any[]>([]);        // people with scheduled interviews
  const [conversations, setConversations] = useState<any[]>([]);  // existing message threads
  const [activeUser, setActiveUser] = useState<any>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadAll();
    const SOCKET_URL = 'https://smart-resume-backend-7jeu.onrender.com';
    socketRef.current = io(SOCKET_URL, { 
      auth: { token },
      transports: ['websocket', 'polling'], // Support both
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    socketRef.current.on('new_message', (msg: any) => {
      // Only add if from the active conversation
      setMessages(prev => {
        if (activeUser && (msg.sender_id === activeUser.id || msg.receiver_id === activeUser.id)) {
          return [...prev, msg];
        }
        return prev;
      });
      loadAll(); // refresh conversation list
    });
    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAll = async () => {
    try {
      const [contactsRes, convRes] = await Promise.all([
        interviewAPI.getContacts(),
        messageAPI.getConversations().catch(() => ({ data: [] })),
      ]);
      setContacts(contactsRes.data || []);
      setConversations(convRes.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const openChat = async (contact: any) => {
    setActiveUser(contact);
    setShowChatMobile(true);
    setMsgLoading(true);
    setMessages([]);
    try {
      const res = await messageAPI.getConversation(contact.id);
      setMessages(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('Interview must be scheduled before messaging');
      }
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeUser) return;
    setSending(true);
    try {
      const res = await messageAPI.send({ receiver_id: activeUser.id, content: input.trim() });
      setMessages(prev => [...prev, { ...res.data, sender_name: user?.full_name }]);
      socketRef.current?.emit('send_message', { receiver_id: activeUser.id, content: input.trim() });
      setInput('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Merge contacts + conversations into a unified list (contacts first, then anyone with messages)
  const allContacts = contacts;
  const convUserIds = new Set(conversations.map((c: any) => c.other_user_id));
  const unreadFor = (id: string) => conversations.find((c: any) => c.other_user_id === id)?.unread_count || 0;
  const lastMsgFor = (id: string) => conversations.find((c: any) => c.other_user_id === id)?.last_message;

  return (
    <DashboardLayout>
      <div className="animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-5">
          <h1 className="font-display text-3xl text-ink-900 mb-1">Messages</h1>
          <p className="text-ink-500 text-sm flex items-center gap-1.5">
            <Lock size={12} />
            You can message HR after an interview has been scheduled with you.
          </p>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0">
          {/* Contact sidebar */}
          <div className={clsx("w-full md:w-72 shrink-0 card flex flex-col overflow-hidden", showChatMobile && "hidden md:flex")}>
            <div className="px-4 py-3 border-b border-ink-100">
              <p className="text-xs font-medium text-ink-500 uppercase tracking-wide">Your Interviewers</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : allContacts.length === 0 ? (
                <div className="p-6 text-center">
                  <Calendar size={28} className="mx-auto text-ink-300 mb-3" />
                  <p className="text-xs text-ink-500 leading-relaxed">
                    No interviews scheduled yet.<br />
                    Once HR schedules an interview with you, you can message them here.
                  </p>
                </div>
              ) : (
                allContacts.map(c => {
                  const isActive = activeUser?.id === c.id;
                  const unread = unreadFor(c.id);
                  const lastMsg = lastMsgFor(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => openChat(c)}
                      className={clsx(
                        'w-full text-left px-4 py-3.5 border-b border-ink-100 hover:bg-ink-50 transition-colors',
                        isActive && 'bg-ink-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-ink-200 flex items-center justify-center text-xs font-semibold text-ink-600 shrink-0">
                          {c.full_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-ink-900 truncate">{c.full_name}</p>
                            {unread > 0 && (
                              <span className="w-5 h-5 rounded-full bg-ink-900 text-white text-xs flex items-center justify-center shrink-0">
                                {unread}
                              </span>
                            )}
                          </div>
                          {lastMsg ? (
                            <p className="text-xs text-ink-500 truncate">{lastMsg}</p>
                          ) : (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <Calendar size={9} />
                              {c.mode?.replace('_', ' ')} · {c.scheduled_date}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={13} className="text-ink-300 shrink-0" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className={clsx("flex-1 card flex flex-col overflow-hidden", !showChatMobile && "hidden md:flex")}>
            {!activeUser ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={40} className="mx-auto text-ink-300 mb-3" />
                  <p className="text-ink-500 text-sm">
                    {allContacts.length > 0
                      ? 'Select an interviewer to start messaging'
                      : 'Waiting for an interview to be scheduled'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-3">
                  <button onClick={() => setShowChatMobile(false)} className="md:hidden p-2 -ml-2 text-ink-400">
                    <ChevronRight className="rotate-180" size={20} />
                  </button>
                  <div className="w-9 h-9 rounded-full bg-ink-200 flex items-center justify-center text-sm font-semibold text-ink-600">
                    {activeUser.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-ink-900 text-sm">{activeUser.full_name}</p>
                    <p className="text-xs text-ink-400">
                      {activeUser.email} · {activeUser.mode?.replace('_', ' ')} on {activeUser.scheduled_date}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-ink-400">No messages yet — start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m: any) => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id || m.sent_at} className={clsx('flex', isMine ? 'justify-end' : 'justify-start')}>
                          <div className={clsx('max-w-xs lg:max-w-md flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
                            <div className={clsx('px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                              isMine ? 'bg-ink-900 text-white rounded-br-sm' : 'bg-ink-100 text-ink-900 rounded-bl-sm'
                            )}>
                              {m.content}
                            </div>
                            <span className="text-xs text-ink-400 px-1">{formatTime(m.sent_at)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-ink-100 flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="input flex-1"
                    placeholder="Type a message... (Enter to send)"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim()}
                    className="btn-primary shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
