import { useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import type { NotificationType } from '../types';

interface NotificationDropdownProps {
  onClose: () => void;
}

/**
 * NotificationDropdown Component
 * Dropdown menu yang tampil ketika bell icon di-click
 */
export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotificationContext();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationType>('all');

  // Filter notifications berdasarkan selected filter
  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === selectedFilter);

  // Group by type untuk tampilkan filter buttons
  const typeOptions: Array<{ type: 'all' | NotificationType; label: string }> = [
    { type: 'all', label: 'Semua' },
    { type: 'ORDER_NEW', label: 'Pesanan Baru' },
    { type: 'CART_ABANDON', label: 'Keranjang Ditinggalkan' },
    { type: 'SYSTEM_ALERT', label: 'Peringatan Sistem' },
  ];

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-50 flex flex-col border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifikasi
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">
              ({unreadCount} baru)
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition"
          >
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-slate-700 px-2 py-2 gap-2">
        {typeOptions.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setSelectedFilter(type)}
            className={`px-3 py-1 whitespace-nowrap text-sm rounded transition ${
              selectedFilter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={onClose}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {selectedFilter === 'all'
                ? 'Tidak ada notifikasi'
                : `Tidak ada notifikasi ${typeOptions.find((t) => t.type === selectedFilter)?.label}`}
            </p>
          </div>
        )}
      </div>

      {/* Footer - View All Link */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-3 text-center">
          <button
            onClick={() => {
              navigate('/notifikasi');
              onClose();
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition"
          >
            Lihat Semua Notifikasi →
          </button>
        </div>
      )}
    </div>
  );
}
