import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MagnifyingGlass, PaperPlaneRight, CaretLeft, CheckCircle,
  Plus, X, UserCircle,
} from '@phosphor-icons/react';
import { messagesService } from '../services/messages.service';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import type { Conversation, Message, Contact } from '../types/api';

interface Props {
  title: string;
  subtitle: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, image, size = 'md' }: { name: string; image?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  if (image) return <img src={image} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export default function MessagesView({ title, subtitle }: Props) {
  const { user } = useAuth();
  const { socket, setUnreadMessages, onNewMessage, setActiveConversation } = useSocket();
  const location = useLocation();
  if (!user) return null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const initialOpenUserIdRef = useRef<string | null>(
    (location.state as { openUserId?: string } | null)?.openUserId ?? null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);

  // New conversation modal
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const justSwitchedConvRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedConv = conversations.find(c => c.user._id === selectedUserId);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await messagesService.getConversations();
      if (res.success) setConversations(res.data);
    } catch {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Auto-open a conversation when navigated from a notification click
  useEffect(() => {
    const targetId = initialOpenUserIdRef.current;
    if (targetId && conversations.length > 0 && !selectedUserId) {
      initialOpenUserIdRef.current = null;
      setSelectedUserId(targetId);
    }
  }, [conversations, selectedUserId]);

  // Tell SocketContext which conversation is active so message notifications are suppressed
  useEffect(() => {
    setActiveConversation(selectedUserId);
    return () => { setActiveConversation(null); };
  }, [selectedUserId, setActiveConversation]);

  // Mark as "just switched" when conversation changes so first load uses instant scroll
  useEffect(() => {
    justSwitchedConvRef.current = true;
  }, [selectedUserId]);

  // Load messages when a user is selected
  useEffect(() => {
    if (!selectedUserId) return;
    setLoadingMsgs(true);
    messagesService.getMessagesWith(selectedUserId)
      .then(async res => {
        if (res.success) setMessages(res.data);
        // Reset unread count in conversations list
        setConversations(prev => prev.map(c =>
          c.user._id === selectedUserId ? { ...c, unreadCount: 0 } : c
        ));
        // Emit mark_read to notify sender
        socket?.emit('mark_read', { senderId: selectedUserId });
        // Sync topbar badge with actual server count after marking read
        const countRes = await messagesService.getUnreadCount();
        setUnreadMessages(countRes.count);
      })
      .catch(() => {})
      .finally(() => setLoadingMsgs(false));
  }, [selectedUserId, socket, setUnreadMessages]);

  // Scroll to bottom: instant on conversation open, smooth for new messages
  // loadingMsgs is included so the effect re-fires after spinner disappears and messages paint
  useEffect(() => {
    if (loadingMsgs || messages.length === 0) return;
    const container = chatScrollRef.current;
    if (!container) return;
    if (justSwitchedConvRef.current) {
      container.scrollTop = container.scrollHeight;
      justSwitchedConvRef.current = false;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMsgs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [typingFrom]);

  // Socket: incoming messages
  useEffect(() => {
    const unsub = onNewMessage((msg: Message) => {
      const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender as string;
      if (senderId === selectedUserId) {
        // In active conversation — add message and mark read
        setMessages(prev => [...prev, msg]);
        socket?.emit('mark_read', { senderId });
        setUnreadMessages(prev => Math.max(0, prev - 1));
      }
      // Update conversation list
      loadConversations();
    });
    return unsub;
  }, [onNewMessage, selectedUserId, socket, setUnreadMessages, loadConversations]);

  // Socket: typing indicators
  useEffect(() => {
    if (!socket) return;
    const onTyping = ({ senderId }: { senderId: string }) => {
      if (senderId === selectedUserId) {
        setTypingFrom(senderId);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingFrom(null), 3000);
      }
    };
    const onStopTyping = ({ senderId }: { senderId: string }) => {
      if (senderId === selectedUserId) setTypingFrom(null);
    };
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    return () => { socket.off('user_typing', onTyping); socket.off('user_stop_typing', onStopTyping); };
  }, [socket, selectedUserId]);

  // Emit typing events
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!selectedUserId || !socket) return;
    socket.emit('typing', { receiverId: selectedUserId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: selectedUserId });
    }, 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUserId || sending) return;
    const text = inputText.trim();
    setInputText('');
    socket?.emit('stop_typing', { receiverId: selectedUserId });
    setSending(true);

    // Optimistic update
    const tempMsg: Message = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user!._id, name: user!.name, profileImage: user?.profileImage },
      receiver: { _id: selectedUserId, name: selectedConv?.user.name || '' },
      content: text,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await messagesService.sendMessage({ receiverId: selectedUserId, content: text });
      if (res.success) {
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data : m));
        loadConversations();
      }
    } catch {
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
    } finally {
      setSending(false);
    }
  };

  const handleSelectUser = (userId: string, contact?: Contact) => {
    setSelectedUserId(userId);
    setShowContacts(false);
    // If conversation doesn't exist yet, create a placeholder
    if (!conversations.find(c => c.user._id === userId) && contact) {
      setConversations(prev => [{
        _id: { s: user!._id, r: userId },
        user: { _id: contact._id, name: contact.name, profileImage: contact.profileImage, role: contact.role },
        lastMessage: null,
        unreadCount: 0,
      }, ...prev]);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await messagesService.getContacts();
      if (res.success) setContacts(res.data);
    } catch {}
    setLoadingContacts(false);
  };

  const filteredConvs = conversations.filter(c =>
    c.user && c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">{subtitle}</p>
        </div>
        <button
          onClick={() => { setShowContacts(true); setContactSearch(''); loadContacts(); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-violet-600/20 self-start sm:self-auto"
        >
          <Plus size={16} weight="bold" />
          New Message
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">

        {/* Left Pane: Conversation List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden flex-shrink-0 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="relative group">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" weight="bold" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center">
                <UserCircle size={40} className="text-slate-300 dark:text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">No conversations yet</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Start a new message above</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-neutral-800/50">
                {filteredConvs.map(conv => {
                  const isSelected = selectedUserId === conv.user._id;
                  const lastMsg = conv.lastMessage;
                  const isFromMe = lastMsg && lastMsg.sender != null && typeof lastMsg.sender === 'object' && lastMsg.sender._id === user?._id;
                  return (
                    <button
                      key={conv.user._id}
                      onClick={() => handleSelectUser(conv.user._id)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/50 ${isSelected ? 'bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="relative">
                        <Avatar name={conv.user.name} image={conv.user.profileImage} size="lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`text-sm truncate font-bold ${conv.unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>
                            {conv.user.name}
                          </h3>
                          {lastMsg && (
                            <span className={`text-[10px] whitespace-nowrap ml-2 ${conv.unreadCount > 0 ? 'text-violet-600 font-bold' : 'text-slate-400'}`}>
                              {formatTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 capitalize mb-1">{conv.user.role}</p>
                        <div className="flex justify-between items-center gap-2">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800 dark:text-neutral-200' : 'text-slate-500 dark:text-neutral-400'}`}>
                            {lastMsg ? `${isFromMe ? 'You: ' : ''}${lastMsg.content}` : 'No messages yet'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {selectedUserId && selectedConv ? (
            <>
              <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center gap-4 flex-shrink-0">
                <button onClick={() => setSelectedUserId(null)} className="md:hidden w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300">
                  <CaretLeft size={16} weight="bold" />
                </button>
                <Avatar name={selectedConv.user.name} image={selectedConv.user.profileImage} />
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{selectedConv.user.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 capitalize">
                    {typingFrom ? <span className="text-violet-500 font-semibold animate-pulse">Typing...</span> : selectedConv.user.role}
                  </p>
                </div>
              </div>

              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-neutral-900/30">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-slate-400 dark:text-neutral-500">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const senderId = msg.sender != null && typeof msg.sender === 'object' ? msg.sender._id : msg.sender as string;
                    const isMe = senderId === user?._id;
                    return (
                      <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                          {!isMe && (
                            <Avatar name={selectedConv.user.name} image={selectedConv.user.profileImage} size="sm" />
                          )}
                          <div className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-violet-600 text-white rounded-br-sm shadow-md shadow-violet-600/20' : 'bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 rounded-bl-sm shadow-sm'}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'pr-2' : 'pl-10'}`}>
                          <span className="text-[10px] font-medium text-slate-400">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCircle size={12} weight={msg.isRead ? 'fill' : 'regular'} className={msg.isRead ? 'text-violet-500' : 'text-slate-400'} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {typingFrom && (
                  <div className="flex items-end gap-2">
                    <Avatar name={selectedConv.user.name} image={selectedConv.user.profileImage} size="sm" />
                    <div className="px-4 py-3 bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 rounded-2xl rounded-bl-sm shadow-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => handleInputChange(e.target.value)}
                    placeholder="Write your message..."
                    className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-violet-600/20 flex-shrink-0"
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600 p-6 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <PaperPlaneRight size={32} weight="duotone" className="text-slate-300 dark:text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-neutral-300 mb-2">Your Messages</h3>
              <p className="text-sm max-w-xs">Select a conversation to view messages, or click "New Message" to start one.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">New Message</h3>
              <button onClick={() => setShowContacts(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center justify-center text-slate-500 transition-colors">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
              <div className="relative">
                <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {loadingContacts ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">No contacts found</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-neutral-800/50">
                  {filteredContacts.map(contact => (
                    <button
                      key={contact._id}
                      onClick={() => handleSelectUser(contact._id, contact)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
                    >
                      <Avatar name={contact.name} image={contact.profileImage} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{contact.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
