import React, { useState, useMemo } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationItem from '../components/NotificationItem';
import type { NotificationType } from '../types';

/**
 * NotificationsPage Component
 * Full page untuk menampilkan semua notifikasi dengan filter lengkap
 */
const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotificationContext();
  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationType>('all');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return selectedFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === selectedFilter);
  }, [notifications, selectedFilter]);

  // Type options untuk filter
  const typeOptions: Array<{ type: 'all' | NotificationType; label: string; icon: string }> = [
    { type: 'all', label: 'Semua', icon: '📋' },
    { type: 'ORDER_NEW', label: 'Pesanan Baru', icon: '📦' },
    { type: 'CART_ABANDON', label: 'Keranjang Ditinggalkan', icon: '🛒' },
    { type: 'SYSTEM_ALERT', label: 'Peringatan Sistem', icon: '⚠️' },
  ];

  // Get count for each type
  const getCountForType = (type: 'all' | NotificationType) => {
    if (type === 'all') return notifications.length;
    return notifications.filter((n) => n.type === type).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0M9 19h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Notifikasi</h1>
              <p className="text-slate-600 dark:text-slate-400">Kelola semua notifikasi Anda di sini</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">{unreadCount} belum dibaca</span>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-150 font-medium text-sm"
              >
                Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {typeOptions.map(({ type, label, icon }) => {
              const count = getCountForType(type);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedFilter === type
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    selectedFilter === type
                      ? 'bg-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-slate-300 dark:border-slate-600 border-t-indigo-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Memuat notifikasi...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
            <svg className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-1">
              {selectedFilter === 'all' ? 'Tidak ada notifikasi' : `Tidak ada notifikasi tipe ini`}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {selectedFilter === 'all' 
                ? 'Notifikasi baru akan muncul di sini' 
                : 'Coba filter lain untuk melihat notifikasi'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
