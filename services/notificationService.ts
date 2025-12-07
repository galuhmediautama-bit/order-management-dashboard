// Stub notification service
// This will be expanded in Phase 2

import type { Notification } from '../types';

// Stub: Get notifications
export async function getNotifications(options?: { limit?: number }) {
  return [] as Notification[];
}

// Stub: Get unread count
export async function getUnreadCount() {
  return 0;
}

// Stub: Subscribe to notifications
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  return null;
}

// Stub: Subscribe to notification updates
export function subscribeToNotificationUpdates(userId: string, callback: (notification: Notification) => void) {
  return null;
}

// Stub: Mark as read
export async function markAsRead(id: string) {
  return true;
}

// Stub: Mark all as read
export async function markAllAsRead() {
  return true;
}

// Stub: Delete notification
export async function deleteNotification(id: string) {
  return true;
}

// Stub: Filter by role
export function filterNotificationsByRole(notifications: Notification[], role: string) {
  return notifications;
}
