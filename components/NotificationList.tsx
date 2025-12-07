import { useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import type { NotificationType } from '../types';

/**
 * NotificationList Component
 * Halaman lengkap untuk menampilkan semua notifications
 */
export default function NotificationList() {
  const { notifications, markAllAsRead, deleteNotification, isLoading, unreadCount } =
    useNotificationContext();

  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter notifications
  const filteredNotifications =
    selectedFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === selectedFilter);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  // Type options
  const typeOptions: Array<{ type: 'all' | NotificationType; label: string; count: number }> = [
    {
      type: 'all',
      label: 'Semua',
      count: notifications.length,
    },
    {
      type: 'ORDER_NEW',
      label: 'Pesanan Baru',
      count: notifications.filter((n) => n.type === 'ORDER_NEW').length,
    },
    {
      type: 'CART_ABANDON',
      label: 'Keranjang Ditinggalkan',
      count: notifications.filter((n) => n.type === 'CART_ABANDON').length,
    },
    {
      type: 'SYSTEM_ALERT',
      label: 'Peringatan Sistem',
      count: notifications.filter((n) => n.type === 'SYSTEM_ALERT').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200 dark:border-slate-700">
        {typeOptions.map(({ type, label, count }) => (
          <button
            key={type}
            onClick={() => {
              setSelectedFilter(type);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 whitespace-nowrap rounded-lg transition ${
              selectedFilter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {label}
            {count > 0 && <span className="ml-2 text-xs opacity-75">({count})</span>}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : paginatedNotifications.length > 0 ? (
        <div className="space-y-2">
          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
            >
              <NotificationItem notification={notification} />
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                ← Sebelumnya
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded transition ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {selectedFilter === 'all'
              ? 'Tidak ada notifikasi'
              : `Tidak ada notifikasi di kategori ini`}
          </p>
        </div>
      )}
    </div>
  );
}
