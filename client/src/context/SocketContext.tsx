import {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { config } from '../config/env';
import { useAuth } from './AuthContext';
import { messagesService } from '../services/messages.service';
import { notificationsService } from '../services/notifications.service';
import type { Message, Notification } from '../types/api';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  unreadMessages: number;
  unreadNotifications: number;
  setUnreadMessages: (n: number | ((prev: number) => number)) => void;
  setUnreadNotifications: (n: number | ((prev: number) => number)) => void;
  onNewMessage: (handler: (msg: Message) => void) => () => void;
  setActiveConversation: (userId: string | null) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  unreadMessages: 0,
  unreadNotifications: 0,
  setUnreadMessages: () => {},
  setUnreadNotifications: () => {},
  onNewMessage: () => () => {},
  setActiveConversation: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const messageHandlersRef = useRef<Set<(msg: Message) => void>>(new Set());
  const activeConversationRef = useRef<string | null>(null);

  const onNewMessage = useCallback((handler: (msg: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => { messageHandlersRef.current.delete(handler); };
  }, []);

  const setActiveConversation = useCallback((userId: string | null) => {
    activeConversationRef.current = userId;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }

    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) return;

    // Fetch initial unread counts
    messagesService.getUnreadCount().then(d => setUnreadMessages(d.count)).catch(() => {});
    notificationsService.getUnreadCount().then(d => setUnreadNotifications(d.count)).catch(() => {});

    const socket = io(config.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      if (config.isDevelopment) console.warn('[Socket] connection error:', err.message);
    });

    socket.on('new_message', (msg: Message) => {
      setUnreadMessages(prev => prev + 1);
      messageHandlersRef.current.forEach(h => h(msg));
    });

    socket.on('new_notification', (notif: Notification) => {
      // If user is actively viewing the conversation this notification is about, mark it read silently
      if (
        notif.type === 'message' &&
        notif.relatedId &&
        notif.relatedId === activeConversationRef.current
      ) {
        notificationsService.markAsRead(notif._id).catch(() => {});
        return; // don't increment badge
      }
      setUnreadNotifications(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      unreadMessages,
      unreadNotifications,
      setUnreadMessages,
      setUnreadNotifications,
      onNewMessage,
      setActiveConversation,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
