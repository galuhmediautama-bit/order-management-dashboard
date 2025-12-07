import { useState, useRef, useEffect } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

/**
 * NotificationBell Component
 * Bell icon dengan badge untuk unread notifications
 * Tampilkan dropdown ketika di-click
 */
export default function NotificationBell() {
  const { unreadCount } = useNotificationContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown ketika click di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button - Modern Design */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 group"
        aria-label="Notifications"
        title="View notifications"
      >
        {/* Bell Icon - Modern Style */}
        <svg
          className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0M9 19h6" 
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"/>
        </svg>

        {/* Badge - Animated Unread Count */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse Ring untuk show ada unread */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-lg bg-red-500 opacity-0 animate-ping"></span>
        )}
      </button>

      {/* Dropdown Menu - Modern Positioning */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 z-50 animate-fadeIn">
          <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
        </div>
      )}
    </div>
  );
}
