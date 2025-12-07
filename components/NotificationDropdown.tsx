import { useNotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  onClose: () => void;
}

/**
 * NotificationDropdown Component
 * Dropdown menu yang tampil ketika bell icon di-click
 * Simple version tanpa filter - filter ada di halaman notifikasi
 */
export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotificationContext();
  const navigate = useNavigate();

  return (
    <div className="w-96 max-h-[28rem] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col backdrop-blur-sm">
      {/* Header - Modern Style */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0M9 19h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} belum dibaca</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-2.5 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors duration-150"
            >
              Tandai Semua
            </button>
          )}
        </div>
      </div>

      {/* Notifications List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-600 border-t-indigo-600"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Belum ada notifikasi
            </p>
          </div>
        )}
      </div>

      {/* Footer - View All Link - Always Visible */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
        <button
          onClick={() => {
            navigate('/notifikasi');
            onClose();
          }}
          className="w-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-150 flex items-center justify-center gap-2"
        >
          Lihat Semua Notifikasi
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
