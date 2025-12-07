import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notification, NotificationType } from '../types';
import {
  getNotifications,
  getUnreadCount,
  subscribeToNotifications,
  subscribeToNotificationUpdates,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  filterNotificationsByRole,
} from '../services/notificationService';

interface UseNotificationsOptions {
  limit?: number;
  autoLoad?: boolean;
  enableRealtime?: boolean;
}

/**
 * Custom hook untuk manage notifications dengan realtime updates
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoLoad = true, enableRealtime = true, limit = 50 } = options;
  const { user, userRole } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const updateChannelRef = useRef<RealtimeChannel | null>(null);

  // Load notifikasi dari database
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch notifications
      const data = await getNotifications({ limit });
      const filtered = filterNotificationsByRole(data, userRole || '');
      setNotifications(filtered);

      // Fetch unread count
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(message);
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userRole, limit]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    // Subscribe to new notifications
    const insertChannel = subscribeToNotifications(user.id, (newNotification) => {
      const filtered = filterNotificationsByRole([newNotification], userRole || '');
      if (filtered.length > 0) {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Subscribe to notification updates (mark as read)
    const updateChannel = subscribeToNotificationUpdates(user.id, (updatedNotification) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
      );

      // Update unread count
      if (updatedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    channelRef.current = insertChannel;
    updateChannelRef.current = updateChannel;

    // Cleanup subscriptions
    return () => {
      insertChannel?.unsubscribe();
      updateChannel?.unsubscribe();
    };
  }, [user?.id, enableRealtime, userRole]);

  // Initial load
  useEffect(() => {
    if (autoLoad && user?.id) {
      loadNotifications();
    }
  }, [autoLoad, user?.id, loadNotifications]);

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read:', err);
        throw err;
      }
    },
    []
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, []);

  // Handle delete notification
  const handleDeleteNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, []);

  // Filter notifications by type
  const filterByType = useCallback((type: NotificationType) => {
    return notifications.filter((n) => n.type === type);
  }, [notifications]);

  // Get unread notifications
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    isLoading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    filterByType,
    reload: loadNotifications,
  };
}

/**
 * Hook untuk get notifikasi filtered by type
 */
export function useNotificationsByType(type: NotificationType) {
  const { notifications } = useNotifications();
  return notifications.filter((n) => n.type === type);
}
