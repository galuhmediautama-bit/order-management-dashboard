import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import { Notification } from '../types';
import { useToast } from '../contexts/ToastContext';
import XIcon from '../components/icons/XIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';

// Simple UUID v4 generator
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const NotificationsPage: React.FC = () => {
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

    useEffect(() => {
        fetchNotifications();
    
        // Realtime listener for notifications (INSERT/UPDATE/DELETE)
        const channel = supabase.channel('notifications-page-channel')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
              console.log('[NotificationsPage] INSERT event:', payload);
              const newNotif = payload.new as Notification;
              setNotifications(prev => {
                  // Prevent duplicates by id
                  if (prev.some(n => n.id === newNotif.id)) return prev;
                  return [newNotif, ...prev].sort((a, b) => {
                      const timeA = new Date(b.timestamp || 0).getTime();
                      const timeB = new Date(a.timestamp || 0).getTime();
                      return timeA - timeB;
                  });
              });
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, payload => {
              console.log('[NotificationsPage] UPDATE event:', payload);
              const updated = payload.new as Notification;
              setNotifications(prev => prev.map(n => n.id === updated.id ? { ...n, ...updated } : n));
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, payload => {
              console.log('[NotificationsPage] DELETE event:', payload.old.id);
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          })
          .subscribe(status => {
              console.log('[NotificationsPage] Realtime subscription status:', status);
          });

        return () => {
            try {
                supabase.removeChannel(channel);
            } catch (err) {
                console.warn('Failed to remove notifications channel:', err);
            }
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            console.log('[fetchNotifications] Starting fetch...');
            
            // Ambil semua notifikasi dari DB
            const { data: existingNotifs, error } = await supabase
                .from('notifications')
                .select('*')
                .order('timestamp', { ascending: false, nullsFirst: false })
                .limit(200);

            if (error) {
                console.error('[fetchNotifications] Query error:', error);
                throw error;
            }

            console.log('[fetchNotifications] Fetched notifications:', existingNotifs?.length || 0);
            
            // Gunakan apa yang ada di DB - JANGAN tambah fallback
            const notifs = existingNotifs || [];
            
            // Ensure they're sorted properly
            notifs.sort((a: any, b: any) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeB - timeA; // Descending
            });
            
            setNotifications(notifs);
            console.log('[fetchNotifications] Notifications set in state, count:', notifs.length);
        } catch (error: any) {
            console.error('[fetchNotifications] Error:', error);
            showToast('Gagal memuat notifikasi: ' + (error?.message || 'Unknown error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            console.log('[markAsRead] Updating notification:', { notificationId });
            
            // Update the notification
            const { data, error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId)
                .select();

            if (error) {
                console.error('[markAsRead] Supabase error:', error);
                throw error;
            }
            
            console.log('[markAsRead] Update successful:', data);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error: any) {
            console.error('Error marking as read:', error);
            showToast('Gagal menandai notifikasi', 'error');
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            console.log('[deleteNotification] Deleting notification:', { notificationId });
            
            // Delete the notification
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                console.error('[deleteNotification] Supabase error:', error);
                throw error;
            }
            
            console.log('[deleteNotification] Delete successful');
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            showToast('Notifikasi dihapus', 'success');
        } catch (error: any) {
            console.error('Error deleting notification:', error);
            showToast('Gagal menghapus notifikasi', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            console.log('[NotificationsPage] Marking all as read...');
            
            // Update semua notifikasi dimana read = false
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('read', false);

            if (error) {
                console.error('Error marking all as read:', error);
                showToast('Gagal menandai semua: ' + error.message, 'error');
                return;
            }

            // Update UI state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setFilter('read');
            showToast('Semua notifikasi ditandai sebagai dibaca', 'success');
        } catch (error: any) {
            console.error('Error marking all as read:', error);
            showToast('Gagal menandai semua notifikasi', 'error');
        }
    };

    const deleteAllNotifications = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) return;

        try {
            console.log('[NotificationsPage] Deleting all notifications...');
            
            // Delete semua notifikasi dari database
            const { error } = await supabase
                .from('notifications')
                .delete()
                .neq('id', null); // Delete all rows

            if (error) {
                console.error('Error deleting all:', error);
                showToast('Gagal menghapus semua: ' + error.message, 'error');
                return;
            }

            // Clear UI state
            setNotifications([]);
            showToast('Semua notifikasi dihapus', 'success');
        } catch (error: any) {
            console.error('Error deleting all notifications:', error);
            showToast('Gagal menghapus semua notifikasi', 'error');
        }
    };

    const getFilteredNotifications = () => {
        switch (filter) {
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'read':
                return notifications.filter(n => n.read);
            default:
                return notifications;
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_order':
                return '📦';
            case 'user_signup':
                return '👤';
            case 'order_shipped':
                return '🚚';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'new_order':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
            case 'user_signup':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
            case 'order_shipped':
                return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
            default:
                return 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        
        return date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">🔔 Notifikasi</h1>
                    <p className="text-slate-600 dark:text-slate-400">Kelola semua notifikasi sistem Anda</p>
                </div>

                {/* Stats & Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Total Notifikasi</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
                            </div>
                            {unreadCount > 0 && (
                                <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                                    {unreadCount} belum dibaca
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                                >
                                    Tandai Semua Dibaca
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={deleteAllNotifications}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                                >
                                    Hapus Semua
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                    {(['all', 'unread', 'read'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                                filter === f
                                    ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-300'
                            }`}
                        >
                            {f === 'all' && `Semua (${notifications.length})`}
                            {f === 'unread' && `Belum Dibaca (${unreadCount})`}
                            {f === 'read' && `Sudah Dibaca (${notifications.length - unreadCount})`}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="mt-4 text-slate-600 dark:text-slate-400">Memuat notifikasi...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <p className="text-2xl mb-2">📭</p>
                        <p className="text-slate-600 dark:text-slate-400">
                            {filter === 'all' && 'Tidak ada notifikasi'}
                            {filter === 'unread' && 'Semua notifikasi sudah dibaca'}
                            {filter === 'read' && 'Tidak ada notifikasi yang dibaca'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg border-2 transition-all ${getNotificationColor(notification.type)} ${
                                    !notification.read ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <span className="text-2xl flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-relaxed ${
                                                !notification.read 
                                                    ? 'font-semibold text-slate-900 dark:text-white' 
                                                    : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                title="Tandai sebagai dibaca"
                                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                            >
                                                <CheckCircleFilledIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            title="Hapus notifikasi"
                                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
