import React, { useState, useEffect, useRef } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import { Notification } from '../types';
import XIcon from './icons/XIcon';
import CheckIcon from './icons/CheckIcon';

export const NotificationDropdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationContext();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
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

    // Get latest 10 notifications for dropdown preview
    const previewNotifications = notifications.slice(0, 10);

    const getTypeIcon = (type: string) => {
        switch (type) {
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

    return (
        <div
            ref={dropdownRef}
            className="absolute top-16 right-4 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} belum dibaca</p>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                        Tandai Semua
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {previewNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Tidak ada notifikasi</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group ${
                                    !notification.isRead ? 'bg-indigo-50 dark:bg-indigo-950' : ''
                                }`}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        handleMarkAsRead(notification.id, new MouseEvent('click') as any);
                                    }
                                }}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    {/* Icon + Content */}
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                        <span className="text-lg mt-0.5 flex-shrink-0">
                                            {getTypeIcon(notification.type)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                {new Date(notification.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-full transition-colors opacity-100"
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
            {previewNotifications.length > 0 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                    <a
                        href="/#/notifikasi"
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                        Lihat Semua Notifikasi →
                    </a>
                </div>
            )}
        </div>
    );
};
