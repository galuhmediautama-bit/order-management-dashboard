
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Page, NavItem, UserRole } from '../types';
import DashboardIcon from './icons/DashboardIcon';
import OrdersIcon from './icons/OrdersIcon';
import ReportsIcon from './icons/ReportsIcon';
import FormsIcon from './icons/FormsIcon';
import SettingsIcon from './icons/SettingsIcon';
import BrandsIcon from './icons/BrandsIcon';
import CustomerServiceIcon from './icons/CustomerServiceIcon';
import TrackingIcon from './icons/TrackingIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UserIcon from './icons/UserIcon';
import RoleIcon from './icons/RoleIcon';
import WebsiteIcon from './icons/WebsiteIcon';
import DomainIcon from './icons/DomainIcon';
import UsersIcon from './icons/UsersIcon';
import ChatBubbleIcon from './icons/ChatBubbleIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import TrophyIcon from './icons/TrophyIcon';
import ArchiveIcon from './icons/ArchiveIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import TrashIcon from './icons/TrashIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import { supabase } from '../firebase';
import { getNormalizedRole } from '../utils';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  websiteName?: string;
}

const pageToPath: Record<string, string> = {
    // Landing page removed - root handled by auth/login
    'Dasbor': '/dashboard',
    'Pesanan': '#',
    'Daftar Pesanan': '/pesanan',
    'Pesanan Tertinggal': '/keranjang-terabaikan',
    'Laporan': '#',
    'Laporan Iklan': '/laporan-iklan',
    'Laporan CS': '/laporan-cs',
    'Formulir': '/formulir',
    'Pengaturan': '#',
    'Pengaturan Website': '/pengaturan/website',
    'Manajemen Pengguna': '/pengaturan/pengguna',
    'Manajemen Peran': '/pengaturan/peran',
    'Merek': '/pengaturan/merek',
    'Manajemen CS': '/pengaturan/cs',
    'Pelacakan': '/pengaturan/pelacakan',
    'Template Pesan': '/pengaturan/template-pesan',
    'Permintaan Hapus': '/pengaturan/permintaan-hapus',
    'CuanRank': '/pengaturan/cuan-rank',
    'Profil Saya': '/profil',
    'Pelanggan': '/pelanggan',
    'Penghasilan': '/penghasilan',
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, websiteName }) => {
    const [openSubMenus, setOpenSubMenus] = useState<{[key: string]: boolean}>({});
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
    const { t } = useLanguage();
    const location = useLocation();
    const currentPagePath = location.pathname;

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { data: userDoc, error } = await supabase.from('users').select('*').eq('id', user.id).single();
                    
                    if (error || !userDoc) {
                        console.warn("User role not found in DB, defaulting to Super Admin for UI.");
                        setCurrentUserRole('Super Admin');
                    } else {
                        const normalized = getNormalizedRole(userDoc.role, user.email);
                        setCurrentUserRole(normalized);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setCurrentUserRole('Super Admin');
                }
            }
        };
        fetchUserRole();
    }, []);

    useEffect(() => {
        allNavItems.forEach(item => {
            if (item.subItems) {
                const hasActiveChild = item.subItems.some(sub => pageToPath[sub.name] === currentPagePath);
                if (hasActiveChild) {
                    setOpenSubMenus(prev => ({ ...prev, [item.name]: true }));
                }
            }
        });
    }, [currentPagePath]);

    const toggleSubMenu = (name: string) => {
        setOpenSubMenus(prev => ({...prev, [name]: !prev[name]}));
    }

    const isSubItemActive = (item: NavItem) => {
      return item.subItems?.some(sub => pageToPath[sub.name] === currentPagePath) ?? false;
    }

    const canSee = (item: NavItem): boolean => {
        // Always show Dashboard
        if (item.name === 'Dasbor') return true;
        
        if (!currentUserRole) return false;
        if (currentUserRole === 'Super Admin') return true;

        // If specific roles are defined for the item, check them
        if (item.allowedRoles && item.allowedRoles.length > 0) {
            return item.allowedRoles.includes(currentUserRole);
        }

        // Default to visible if no roles specified
        return true; 
    };

    // Declarative Navigation Structure
    const allNavItems: NavItem[] = [
      { 
          name: 'Dasbor', 
          icon: DashboardIcon 
      },
      { 
        name: 'Pesanan', 
        label: 'Pesanan',
        icon: OrdersIcon,
        allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Customer service'],
        subItems: [
            { name: 'Daftar Pesanan', icon: ClipboardListIcon },
            { name: 'Pesanan Tertinggal', icon: ArchiveIcon },
        ]
      },
      { 
          name: 'Pelanggan', 
          icon: UsersIcon,
          allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Customer service']
      },
      { 
        name: 'Laporan', 
        icon: ReportsIcon,
        allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Customer service', 'Advertiser', 'Partner'],
        subItems: [
            { name: 'Laporan Iklan', icon: TrendingUpIcon, allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Advertiser'] },
            { name: 'Laporan CS', icon: UserGroupIcon, allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Customer service'] },
        ]
      },
      { 
          name: 'Penghasilan', 
          icon: BanknotesIcon,
          allowedRoles: ['Super Admin', 'Admin', 'Keuangan', 'Customer service', 'Advertiser']
      },
      { 
          name: 'Formulir', 
          icon: FormsIcon,
          allowedRoles: ['Super Admin', 'Admin', 'Advertiser']
      },
      { 
        name: 'Pengaturan', 
        icon: SettingsIcon,
        allowedRoles: ['Super Admin', 'Admin'],
        subItems: [
          { name: 'Pengaturan Website', icon: WebsiteIcon, allowedRoles: ['Super Admin', 'Admin'] },
          { name: 'Manajemen Pengguna', icon: UsersIcon, allowedRoles: ['Super Admin', 'Admin'] },
          { name: 'Manajemen Peran', icon: RoleIcon, allowedRoles: ['Super Admin'] },
          { name: 'Manajemen CS', icon: CustomerServiceIcon, allowedRoles: ['Super Admin', 'Admin'] },
          { name: 'CuanRank', icon: TrophyIcon, allowedRoles: ['Super Admin', 'Admin'] },
          { name: 'Merek', icon: BrandsIcon, allowedRoles: ['Super Admin'] },
          { name: 'Pelacakan', icon: TrackingIcon, allowedRoles: ['Super Admin', 'Admin', 'Advertiser'] },
          { name: 'Template Pesan', icon: ChatBubbleIcon, allowedRoles: ['Super Admin', 'Admin'] },
          { name: 'Permintaan Hapus', icon: TrashIcon, allowedRoles: ['Super Admin'] },
        ]
      },
    ];

    const filteredNavItems = allNavItems.filter(item => canSee(item)).map(item => {
        if (item.subItems) {
            const visibleSubItems = item.subItems.filter(sub => canSee(sub));
            return {
                ...item,
                subItems: visibleSubItems
            };
        }
        return item;
    }).filter(item => {
        // If it was a parent item, check if it still has children
        if (item.subItems !== undefined && item.subItems.length === 0) {
            return false;
        }
        return true;
    });

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/80 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      
      <aside className={`absolute inset-y-0 left-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 w-72 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-2xl border-r border-slate-800/50`}>
        
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-gradient-to-r from-slate-950 to-slate-900 shrink-0">
           <Link to="/" className="flex items-center space-x-3 text-white group w-full">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">{websiteName || 'OrderDash'}</span>
                    <span className="text-xs text-slate-500 font-medium">Management System</span>
                </div>
            </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredNavItems.map((item) => {
            const path = pageToPath[item.name];
            const isActive = currentPagePath === path || isSubItemActive(item);
            const hasSubMenu = !!item.subItems;
            const isMenuOpen = openSubMenus[item.name];
            
            const baseClasses = `flex items-center justify-between w-full px-4 py-3.5 text-[15px] font-semibold rounded-xl transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`;
            const activeClasses = `bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30`;
            const inactiveClasses = `text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 hover:shadow-md`;

            const content = (
                <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/10' : 'bg-slate-800/40 group-hover:bg-slate-700/50'}`}>
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 transition-colors'}`} />
                    </div>
                    <span className="truncate">{item.label || item.name}</span>
                </div>
            );

            return (
                <div key={item.name} className="flex flex-col">
                    {hasSubMenu ? (
                        <button 
                            onClick={() => toggleSubMenu(item.name)} 
                            className={`${baseClasses} ${isActive && !isMenuOpen ? 'bg-slate-800/60 text-indigo-400' : inactiveClasses} ${isMenuOpen ? 'text-slate-100 bg-slate-800/50' : ''}`}
                        >
                            {content}
                            <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200 ${isMenuOpen ? 'bg-slate-700/50' : 'group-hover:bg-slate-700/30'}`}>
                                <ChevronDownIcon className={`w-4 h-4 ${isActive || isMenuOpen ? 'text-slate-300' : 'text-slate-500'} transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                    ) : (
                        <Link 
                            to={path} 
                            onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} 
                            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
                        >
                           {content}
                        </Link>
                    )}

                    {hasSubMenu && (
                        <div 
                            className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 mt-2 mb-2' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="ml-4 pl-4 border-l-2 border-slate-800/50 space-y-1">
                                {item.subItems!.map(subItem => {
                                    const subPath = pageToPath[subItem.name];
                                    const isSubActive = currentPagePath === subPath;
                                    return (
                                        <Link
                                            key={subItem.name}
                                            to={subPath}
                                            onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                                            className={`group flex items-center pl-4 pr-4 py-3 text-[14px] font-medium rounded-xl transition-all duration-200 ${
                                            isSubActive 
                                                ? 'text-indigo-400 bg-slate-800/60 shadow-md' 
                                                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className={`flex items-center justify-center w-2 h-2 rounded-full mr-3 transition-all duration-200 ${isSubActive ? 'bg-indigo-500 scale-125' : 'bg-slate-700 group-hover:bg-slate-500 group-hover:scale-110'}`}></div>
                                            <span className="truncate">{subItem.label || subItem.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
          })}
        </nav>

        <div className="p-5 border-t border-slate-800/50 bg-slate-950/50">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-medium">v1.2.6</span>
                <span className="text-slate-700">•</span>
                <span>&copy; 2024</span>
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
