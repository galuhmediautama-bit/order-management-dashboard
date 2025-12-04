
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MenuIcon from './icons/MenuIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ThemeToggle from './ThemeToggle';
import SearchIcon from './icons/SearchIcon';
import UserIcon from './icons/UserIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import type { User as FirebaseUser } from '@supabase/supabase-js'; // Changed to Supabase type
import type { Notification } from '../types';
import BellIcon from './icons/BellIcon';
import { supabase } from '../supabase';


const timeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} tahun lalu`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} bulan lalu`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} hari lalu`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} jam lalu`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} menit lalu`;
    return "Baru saja";
}

interface HeaderProps {
  sidebarToggle: () => void;
  toggleTheme: () => void;
  currentTheme: 'light' | 'dark';
  user: FirebaseUser;
  logout: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarToggle, toggleTheme, currentTheme, user, logout }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || 'user@email.com';
  const userAvatar = user.user_metadata?.avatar_url;

  useEffect(() => {
    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            setNotifications(data as Notification[]);
        } catch (error: any) {
            // Cek apakah error karena tabel belum ada (Postgres code 42P01 atau pesan spesifik client)
            const isTableMissing = error.code === '42P01' || 
                                   (error.message && error.message.includes('does not exist')) ||
                                   (error.message && error.message.includes('Could not find the table'));

            if (isTableMissing) {
                console.warn("Fitur Notifikasi: Tabel 'notifications' belum dibuat di database Supabase.");
                setNotifications([]); // Set kosong agar UI tidak loading selamanya
            } else {
                console.error("Error fetching notifications:", error.message || error);
            }
        } finally {
            setLoadingNotifications(false);
        }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
            setProfileMenuOpen(false);
        }
        if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
            setNotificationsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileToggle = () => {
    const nextState = !isProfileMenuOpen;
    setProfileMenuOpen(nextState);
    if (nextState) {
        setNotificationsOpen(false);
    }
  };

  const handleNotificationsToggle = () => {
      const nextState = !isNotificationsOpen;
      setNotificationsOpen(nextState);
      if (nextState) {
          setProfileMenuOpen(false);
      }
  };

  const hasUnread = useMemo(() => notifications.some(n => !n.read), [notifications]);

  const handleMarkAllAsRead = async () => {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;

      try {
          const ids = unreadNotifs.map(n => n.id);
          await supabase.from('notifications').update({ read: true }).in('id', ids);
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
          console.error("Error marking notifications as read:", error);
      }
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileMenuOpen(false);
    logout();
  };
  
  const handleProfileLinkClick = () => {
    setProfileMenuOpen(false);
  }

  return (
    <header className="bg-white dark:bg-slate-900 shadow-md z-10 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 sticky top-0">
      <div className="flex items-center justify-between h-20 px-6 md:px-8">
        {/* Mobile Menu Button */}
        <button
          onClick={sidebarToggle}
          className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 rounded-lg transition-all"
          aria-label="Toggle Sidebar"
        >
          <MenuIcon className="h-7 w-7" />
        </button>
        
        {/* Logo/Brand (Mobile) */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">OrderDash</span>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-2xl ml-6">
           <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              className="block w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-slate-50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base text-slate-900 dark:text-white transition-all"
              placeholder="Cari pesanan, pelanggan, produk..."
            />
          </div>
        </div>

        <div className="flex-1 lg:hidden"></div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
            {/* Search Button - Mobile */}
            <button className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <SearchIcon className="h-6 w-6" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle toggleTheme={toggleTheme} theme={currentTheme} />

            {/* Notifications */}
            <div className="relative" ref={notificationsDropdownRef}>
                <button 
                  onClick={handleNotificationsToggle} 
                  className="relative p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  aria-label="Notifications"
                >
                    {hasUnread && (
                        <>
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full animate-ping"></span>
                        </>
                    )}
                    <BellIcon className="h-6 w-6" />
                </button>
                {isNotificationsOpen && (
                    <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 origin-top-right animate-in slide-in-from-top-2">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Notifikasi</p>
                                {hasUnread && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {notifications.filter(n => !n.read).length} notifikasi baru
                                    </p>
                                )}
                            </div>
                            <button 
                              onClick={handleMarkAllAsRead} 
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors" 
                              disabled={!hasUnread}
                            >
                                Tandai semua
                            </button>
                        </div>
                        <ul className="py-2 max-h-96 overflow-y-auto custom-scrollbar">
                            {loadingNotifications ? (
                                <li className="px-6 py-8 text-center">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Memuat notifikasi...</p>
                                </li>
                            ) : notifications.length === 0 ? (
                                <li className="px-6 py-12 text-center">
                                    <BellIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tidak ada notifikasi</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Semua notifikasi akan muncul di sini</p>
                                </li>
                            ) : (
                                notifications.map(notif => (
                                <li key={notif.id} className={`border-l-4 ${notif.read ? 'border-transparent' : 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10'}`}>
                                    <a 
                                      href="#" 
                                      onClick={e => e.preventDefault()} 
                                      className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <p className={`text-sm text-slate-800 dark:text-slate-200 ${!notif.read ? 'font-semibold' : 'font-normal'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            {timeAgo(notif.timestamp)}
                                        </p>
                                    </a>
                                </li>
                                ))
                            )}
                        </ul>
                        {notifications.length > 0 && (
                            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700">
                                <a href="#/notifikasi" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-center gap-1">
                                    Lihat semua notifikasi
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative border-l border-slate-200 dark:border-slate-700 ml-2 pl-2 md:ml-4 md:pl-4" ref={profileDropdownRef}>
                <button 
                  onClick={handleProfileToggle} 
                  className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  aria-label="User Menu"
                >
                    <img 
                      src={userAvatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                      alt="User Avatar" 
                      className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-md object-cover" 
                    />
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{userDisplayName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{userEmail}</span>
                    </div>
                     <ChevronDownIcon className={`hidden md:block w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 border border-slate-200 dark:border-slate-700 origin-top-right animate-in slide-in-from-top-2">
                        {/* Profile Header */}
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <img 
                                  src={userAvatar || `https://i.pravatar.cc/150?u=${user.id}`} 
                                  alt="User Avatar" 
                                  className="w-14 h-14 rounded-full border-3 border-white dark:border-slate-700 shadow-lg object-cover" 
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{userEmail}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <ul className="py-2">
                            <li>
                                <Link 
                                  to="/profil" 
                                  onClick={handleProfileLinkClick} 
                                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                                >
                                    <UserIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    <span>Profil Saya</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                  to="/pengaturan-akun" 
                                  onClick={handleProfileLinkClick} 
                                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                                >
                                    <SettingsIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                    <span>Pengaturan Akun</span>
                                </Link>
                            </li>
                        </ul>

                        {/* Logout */}
                        <div className="py-2 px-3 border-t border-slate-200 dark:border-slate-700">
                             <a 
                               href="#" 
                               onClick={handleLogoutClick} 
                               className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all group"
                             >
                                <LogoutIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Keluar</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
