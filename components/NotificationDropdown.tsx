import React, { useState, useEffect, useRef } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { supabase } from '../firebase';
import { Notification } from '../types';
import XIcon from './icons/XIcon';
import CheckIcon from './icons/CheckIcon';

export const NotificationDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationContext();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markAsRead(notificationId);
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute top-16 right-4 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} belum dibaca</p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        Tandai Semua
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                        <p>Memuat...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Tidak ada notifikasi</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${
                                    !notification.is_read ? 'bg-indigo-50 dark:bg-indigo-950' : ''
                                }`}
                                onClick={() => handleMarkAsRead(notification.id, new MouseEvent('click') as any)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                            {notification.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            {new Date(notification.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {!notification.is_read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full transition-colors"
                                                title="Tandai sebagai dibaca"
                                            >
                                                <CheckIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(notification.id, e)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Hapus"
                                        >
                                            <XIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer - Link to Full Page */}
            {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
                    <a
                        href="/#/notifikasi"
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        Lihat Semua Notifikasi →
                    </a>
                </div>
            )}
        </div>
    );
};
