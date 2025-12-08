import type { Notification } from '../types';
import { supabase } from '../firebase';

// Create notification for a user
export async function createNotification(
  userId: string,
  payload: { type: string; title: string; message: string; metadata?: Record<string, any> }
) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata || {},
        is_read: false,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      isRead: data.is_read,
      isDeleted: data.is_deleted,
      userId: data.user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      readAt: data.read_at,
    } as Notification;
  } catch (err) {
    console.error('Error in createNotification:', err);
    return null;
  }
}

// Get notifications for current user
export async function getNotifications(options?: { limit?: number }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const limit = options?.limit || 50;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      timestamp: n.created_at,
      read: n.is_read,
      user_id: n.user_id,
      order_id: n.order_id,
      created_at: n.created_at,
      // Normalize camelCase fields expected by UI components
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      isRead: n.is_read,
      isDeleted: n.is_deleted,
    })) as Notification[];
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return [];
  }
}

// Get unread count
export async function getUnreadCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
}

// Subscribe to new notifications (INSERT)
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  if (!userId) return null;

  const channel = supabase
    .channel(`notifications-insert-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const n = payload.new;
        callback({
          id: n.id,
          type: n.type,
          message: n.message,
          timestamp: n.created_at,
          read: n.is_read,
          user_id: n.user_id,
          order_id: n.order_id,
          created_at: n.created_at,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          isRead: n.is_read,
          isDeleted: n.is_deleted,
        });
      }
    )
    .subscribe();

  return channel;
}

// Subscribe to notification updates (UPDATE - for read status)
export function subscribeToNotificationUpdates(userId: string, callback: (notification: Notification) => void) {
  if (!userId) return null;

  const channel = supabase
    .channel(`notifications-update-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const n = payload.new;
        callback({
          id: n.id,
          type: n.type,
          message: n.message,
          timestamp: n.created_at,
          read: n.is_read,
          user_id: n.user_id,
          order_id: n.order_id,
          created_at: n.created_at,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          isRead: n.is_read,
          isDeleted: n.is_deleted,
        });
      }
    )
    .subscribe();

  return channel;
}

// Mark single notification as read
export async function markAsRead(id: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error marking as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAsRead:', error);
    return false;
  }
}

// Mark all notifications as read
export async function markAllAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return false;
  }
}

// Delete (soft delete) a notification
export async function deleteNotification(id: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return false;
  }
}

// Filter notifications by user role (client-side filtering)
export function filterNotificationsByRole(notifications: Notification[], role: string) {
  // All notifications are already filtered by user_id on server
  // This is for additional role-based filtering if needed
  return notifications;
}
