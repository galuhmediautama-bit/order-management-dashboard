
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MenuIcon from './icons/MenuIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ThemeToggle from './ThemeToggle';
import SearchIcon from './icons/SearchIcon';
import UserIcon from './icons/UserIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';
import { NotificationDropdown } from './NotificationDropdown';
import type { User as FirebaseUser } from '@supabase/supabase-js'; // Changed to Supabase type
import { supabase } from '../firebase';
import { useNotificationContext } from '../contexts/NotificationContext';

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
    const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userAvatar, setUserAvatar] = useState<string | undefined>(user.user_metadata?.avatar_url);
    const { unreadCount } = useNotificationContext();

    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const userEmail = user.email || 'user@email.com';

  // Fetch user avatar from database to get latest version
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('avatar')
          .eq('id', user.id)
          .single();
        
        if (data && data.avatar) {
          setUserAvatar(data.avatar);
        } else {
          // Fallback ke auth metadata jika tidak ada di database
          setUserAvatar(user.user_metadata?.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
        setUserAvatar(user.user_metadata?.avatar_url);
      }
    };
    
    fetchUserAvatar();
  }, [user.id, user.user_metadata?.avatar_url]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
            setProfileMenuOpen(false);
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
    <header className="sticky top-0 z-40 flex-shrink-0 bg-white/90 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm lg:border-l border-transparent lg:border-l-slate-200/60 dark:lg:border-l-slate-800/60">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8 gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={sidebarToggle}
          className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 rounded-lg transition-all"
          aria-label="Toggle Sidebar"
        >
          <MenuIcon className="h-7 w-7" />
        </button>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-2xl">
           <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="search"
              name="search"
              id="search"
              className="block w-full pl-12 pr-4 h-11 border border-slate-200 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-900 dark:text-white transition-all shadow-inner"
              placeholder="Cari pesanan, pelanggan, produk..."
            />
          </div>
        </div>

        <div className="flex-1 lg:hidden"></div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-2 md:space-x-3">
            {/* Search Button - Mobile */}
            <button className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <SearchIcon className="h-6 w-6" />
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationDropdownOpen(!isNotificationDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all group"
                title="Notifikasi"
              >
                <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotificationDropdownOpen} 
                onClose={() => setNotificationDropdownOpen(false)} 
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle toggleTheme={toggleTheme} theme={currentTheme} />

            {/* User Profile Dropdown */}
            <div className="relative border-l border-slate-200 dark:border-slate-700 ml-2 pl-2 md:ml-4 md:pl-4" ref={profileDropdownRef}>
                <button 
                  onClick={handleProfileToggle} 
                  className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  aria-label="User Menu"
                >
                    <img 
                      src={userAvatar ? `${userAvatar}?t=${Date.now()}` : `https://i.pravatar.cc/150?u=${user.id}`} 
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
                                  src={userAvatar ? `${userAvatar}?t=${Date.now()}` : `https://i.pravatar.cc/150?u=${user.id}`} 
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
