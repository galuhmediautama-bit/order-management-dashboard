import React from 'react';
import type { Notification } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * NotificationItem Component
 * Renders a single notification item
 */
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onDelete }) => {
  const getTypeIcon = () => {
    switch (notification.type) {
      case 'ORDER_NEW':
        return '📦';
      case 'CART_ABANDON':
        return '🛒';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '📋';
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'ORDER_NEW':
        return 'Pesanan Baru';
      case 'CART_ABANDON':
        return 'Keranjang Ditinggalkan';
      case 'SYSTEM_ALERT':
        return 'Peringatan Sistem';
      default:
        return 'Notifikasi';
    }
  };

  return (
    <div className={`p-4 border-b ${notification.read ? 'bg-gray-50 dark:bg-slate-700' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-lg mt-1">{getTypeIcon()}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{getTypeLabel()}</h3>
              {!notification.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{notification.message}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
              {new Date(notification.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          {!notification.read && onMarkAsRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Baca
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(notification.id)}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
