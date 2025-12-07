import React, { createContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notification, NotificationContextType } from '../types';
import { supabase } from '../firebase';
import {
  getNotifications,
  getUnreadCount,
  subscribeToNotifications,
  subscribeToNotificationUpdates,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
  filterNotificationsByRole,
} from '../services/notificationService';

// Action types
export type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_NOTIFICATIONS' };

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

/**
 * Reducer untuk notification state management
 */
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };

    case 'ADD_NOTIFICATION': {
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (exists) return state;
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.isRead ? state.unreadCount : state.unreadCount + 1,
      };
    }

    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload.id ? action.payload : n
        ),
      };

    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    default:
      return state;
  }
}

// Create context
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * NotificationProvider component
 * Wrap your app dengan ini untuk mengakses notification context
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');

  const channelsRef = useRef<{
    insert: RealtimeChannel | null;
    update: RealtimeChannel | null;
  }>({ insert: null, update: null });

  // Get user and role from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          setUser(authUser);
          // Fetch user role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();
          if (userData?.role) {
            setUserRole(userData.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  // Load notifications dari database
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Fetch notifications
      const data = await getNotifications({ limit: 50 });
      const filtered = filterNotificationsByRole(data, userRole || '');
      dispatch({ type: 'SET_NOTIFICATIONS', payload: filtered });

      // Fetch unread count
      const count = await getUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      dispatch({ type: 'SET_ERROR', payload: message });
      console.error('Error loading notifications:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id, userRole]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new notifications
    const insertChannel = subscribeToNotifications(user.id, (newNotification) => {
      const filtered = filterNotificationsByRole([newNotification], userRole || '');
      if (filtered.length > 0) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      }
    });

    // Subscribe to updates (mark as read, etc)
    const updateChannel = subscribeToNotificationUpdates(user.id, (updatedNotification) => {
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: updatedNotification });
    });

    channelsRef.current = { insert: insertChannel, update: updateChannel };

    // Cleanup
    return () => {
      insertChannel?.unsubscribe();
      updateChannel?.unsubscribe();
    };
  }, [user?.id, userRole]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

  // Mark as read
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsReadService(id);
        const notification = state.notifications.find((n) => n.id === id);
        if (notification) {
          dispatch({
            type: 'UPDATE_NOTIFICATION',
            payload: {
              ...notification,
              isRead: true,
              readAt: new Date().toISOString(),
            },
          });
        }
      } catch (err) {
        console.error('Error marking as read:', err);
        throw err;
      }
    },
    [state.notifications]
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadService();
      const updated = state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      }));
      dispatch({ type: 'SET_NOTIFICATIONS', payload: updated });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, [state.notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await deleteNotificationService(id);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Add notification (for manual addition)
  const addNotification = useCallback((notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const value: NotificationContextType = {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook untuk menggunakan NotificationContext
 */
export function useNotificationContext() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
