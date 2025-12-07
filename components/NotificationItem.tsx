import { useNotificationContext } from '../contexts/NotificationContext';
import type { Notification, NotificationType } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

/**
 * Get icon berdasarkan notification type
 */
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'ORDER_NEW':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3a1 1 0 000 2h1.438l.789 3.154A1 1 0 006 9a2 2 0 100 4 2 2 0 100-4 2 2 0 100 4h8a2 2 0 100-4H6.583l-.4-1.6A1 1 0 005 6H3z" />
          </svg>
        </div>
      );

    case 'CART_ABANDON':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 rounded-lg">
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    case 'SYSTEM_ALERT':
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-lg">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM9 13a1 1 0 11-2 0 1 1 0 012 0zm0-3a1 1 0 11-2 0 1 1 0 012 0zm1-2a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Get notification type label dalam bahasa Indonesia
 */
function getTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'ORDER_NEW':
      return 'Pesanan Baru';
    case 'CART_ABANDON':
      return 'Keranjang Ditinggalkan';
    case 'SYSTEM_ALERT':
      return 'Peringatan Sistem';
    default:
      return type;
  }
}

/**
 * NotificationItem Component
 * Individual notification card dalam dropdown/list
 */
export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotificationContext();

  const handleMarkAsRead = async () => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format time
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div
      className={`px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 ${
        !notification.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/15' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon - Modern Gradient */}
        <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold transition-colors ${
                !notification.isRead
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-700 dark:text-slate-200'
              }`}>
                {notification.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="inline-block">{getTypeLabel(notification.type)}</span>
                <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                <span className="inline-block">{timeAgo}</span>
              </p>
            </div>
            
            {/* Unread Indicator */}
            {!notification.isRead && (
              <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full animate-pulse mt-1"></div>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            {notification.message}
          </p>

          {/* Metadata - if any */}
          {notification.metadata && (
            <div className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              {notification.metadata.orderId && (
                <p><span className="font-medium">Order:</span> {notification.metadata.orderId}</p>
              )}
              {notification.metadata.customerId && (
                <p><span className="font-medium">Customer:</span> {notification.metadata.customerId}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 items-center mt-3 flex-wrap">
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 rounded-lg transition-colors duration-150"
                title="Mark as read"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Tandai Sudah Baca</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg transition-colors duration-150"
              title="Delete notification"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format waktu relatif (e.g. "2 minutes ago", "1 hour ago")
 */
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari yang lalu`;

  return date.toLocaleDateString('id-ID');
}
