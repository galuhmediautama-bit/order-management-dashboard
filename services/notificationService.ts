import { supabase } from '../firebase';
import type { Notification, NotificationCreatePayload, NotificationType } from '../types';

/**
 * Notification Service
 * API wrapper untuk semua operasi notifikasi ke Supabase
 */

// ============================================
// GET OPERATIONS
// ============================================

/**
 * Ambil semua notifikasi untuk user yang login
 * @param options - Filter dan sorting options
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
  type?: NotificationType;
}): Promise<Notification[]> {
  try {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const includeDeleted = options?.includeDeleted ?? false;
    const type = options?.type;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter deleted
    if (!includeDeleted) {
      query = query.eq('is_deleted', false);
    }

    // Filter by type
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.map(convertSnakeToCamel) ?? [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Ambil jumlah notifikasi yang belum dibaca
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .eq('is_deleted', false);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Ambil detail notifikasi berdasarkan ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? convertSnakeToCamel(data) : null;
  } catch (error) {
    console.error('Error fetching notification by id:', error);
    return null;
  }
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Buat notifikasi baru
 * Note: Biasanya dipanggil oleh server/edge function, bukan dari client
 */
export async function createNotification(
  userId: string,
  payload: NotificationCreatePayload
): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data ? convertSnakeToCamel(data) : null;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Mark notifikasi sebagai read
 */
export async function markAsRead(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark semua notifikasi sebagai read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('is_read', false)
      .eq('is_deleted', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Soft delete notifikasi (update is_deleted = true)
 */
export async function deleteNotification(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Soft delete semua notifikasi
 */
export async function deleteAllNotifications(): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_deleted: true })
      .eq('is_deleted', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to new notifications in real-time
 * @param userId - User ID untuk subscribe
 * @param callback - Callback ketika ada notifikasi baru
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(convertSnakeToCamel(payload.new));
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to notification updates (mark as read)
 * @param userId - User ID untuk subscribe
 * @param callback - Callback ketika ada update
 */
export function subscribeToNotificationUpdates(
  userId: string,
  callback: (notification: Notification) => void
) {
  const channel = supabase
    .channel(`notifications:updates:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(convertSnakeToCamel(payload.new));
        }
      }
    )
    .subscribe();

  return channel;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert snake_case dari database ke camelCase untuk TypeScript
 */
function convertSnakeToCamel(obj: any): Notification {
  return {
    id: obj.id,
    userId: obj.user_id,
    type: obj.type,
    title: obj.title,
    message: obj.message,
    metadata: obj.metadata,
    isRead: obj.is_read,
    readAt: obj.read_at,
    isDeleted: obj.is_deleted,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
  };
}

/**
 * Filter notifikasi berdasarkan role
 */
export function filterNotificationsByRole(
  notifications: Notification[],
  role: string
): Notification[] {
  // Admin & Owner bisa lihat semua type
  if (role === 'admin' || role === 'owner') {
    return notifications;
  }

  // Staff hanya bisa lihat ORDER_NEW
  if (role === 'staff') {
    return notifications.filter((n) => n.type === 'ORDER_NEW');
  }

  // Default: return all
  return notifications;
}
