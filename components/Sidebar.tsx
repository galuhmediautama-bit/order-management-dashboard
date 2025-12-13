
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Page, NavItem, UserRole } from '../types';
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
import BellIcon from './icons/BellIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import TrophyIcon from './icons/TrophyIcon';
import ArchiveIcon from './icons/ArchiveIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import TrashIcon from './icons/TrashIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import Squares2x2Icon from './icons/Squares2x2Icon';
import DashboardIcon from './icons/DashboardIcon';
import GlobeIcon from './icons/GlobeIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import { supabase } from '../firebase';
import { getNormalizedRole } from '../utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useRolePermissions } from '../contexts/RolePermissionsContext';
import { SettingsContext } from '../contexts/SettingsContext';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    websiteName?: string;
}

const pageToPath: Record<string, string> = {
    // Landing page removed - root handled by auth/login
    'Dasbor': '/dashboard',
    'Landing Page': '/landing-page',
    'Pesanan': '#',
    'Daftar Pesanan': '/pesanan',
    'Pesanan Tertinggal': '/keranjang-terabaikan',
    'Laporan': '#',
    'Laporan Iklan': '/laporan-iklan',
    'Laporan CS': '/laporan-cs',
    'Laporan Stock': '/laporan-stock',
    'Laporan Keuangan': '/laporan-keuangan',
    'Produk': '#',
    'Daftar Produk': '/daftar-produk',
    'Daftar Formulir': '/formulir',
    'Pengaturan': '#',
    'Website': '/pengaturan/website',
    'Pengguna': '/pengaturan/pengguna',
    'Peran': '/pengaturan/peran',
    'Merek': '/pengaturan/merek',
    'Customer Service': '/pengaturan/cs',
    'Pelacakan': '/pengaturan/pelacakan',
    'Pengumuman': '/pengaturan/pengumuman/kelola',
    'Permintaan Hapus': '/pengaturan/permintaan-hapus',
    'CuanRank': '/pengaturan/cuan-rank',
    'Profil Saya': '/profil',
    'Pelanggan': '/pelanggan',
    'Penghasilan': '/penghasilan',
    'Log Error': '/pengaturan/log-error',
    'Performa': '/monitoring/performance',
};

// Map sidebar menu names to RBAC menu IDs from rolePermissions.ts
const menuNameToRbacId: Record<string, string> = {
    'Dasbor': 'dashboard',
    'Landing Page': 'landing_page',
    'Produk': 'products',
    'Daftar Produk': 'product_list',
    'Daftar Formulir': 'form_list',
    'Pesanan': 'orders',
    'Daftar Pesanan': 'order_list',
    'Pesanan Tertinggal': 'abandoned_carts',
    'Pelanggan': 'customers',
    'Laporan': 'reports',
    'Laporan Iklan': 'ad_reports',
    'Laporan CS': 'cs_reports',
    'Laporan Stock': 'stock_reports',
    'Laporan Keuangan': 'finance_reports',
    'Penghasilan': 'earnings',
    'Performa': 'performance_dashboard',
    'Pengaturan': 'settings',
    'Website': 'website_settings',
    'Peran': 'role_management',
    'Merek': 'brands',
    'Pengguna': 'user_management',
    'Customer Service': 'cs_management',
    'Pelacakan': 'tracking',
    'Pengumuman': 'announcements',
    'Permintaan Hapus': 'deletion_requests',
    'CuanRank': 'cuan_rank',
    'Log Error': 'error_logs',
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, websiteName }) => {
    const [openSubMenus, setOpenSubMenus] = useState<{ [key: string]: boolean }>({});
    const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
    const { t } = useLanguage();
    const { canAccessMenu } = useRolePermissions();
    const { websiteSettings } = useContext(SettingsContext);
    const location = useLocation();
    const currentPagePath = location.pathname;

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                try {
                    // Retry logic for race condition during registration
                    let userDoc = null;
                    let error = null;
                    let retries = 0;
                    const maxRetries = 3;
                    const retryDelay = 500; // ms

                    while (retries < maxRetries && !userDoc) {
                        const result = await supabase.from('users').select('*').eq('id', user.id).single();
                        error = result.error;
                        userDoc = result.data;

                        if (!userDoc && retries < maxRetries - 1) {
                            // Retry with exponential backoff
                            await new Promise(resolve => setTimeout(resolve, retryDelay * (retries + 1)));
                            retries++;
                        } else {
                            break;
                        }
                    }

                    if (error || !userDoc) {
                        // Fallback: Check if this is likely a super admin (first user or owner)
                        const isSuperAdmin = user.email?.includes('admin') || user.email?.includes('owner');
                        const fallbackRole = isSuperAdmin ? 'Super Admin' : 'Advertiser';
                        setCurrentUserRole(fallbackRole);
                    } else {
                        const normalized = getNormalizedRole(userDoc.role, user.email);
                        setCurrentUserRole(normalized);
                    }
                } catch (error) {
                    setCurrentUserRole(null);
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
        setOpenSubMenus(prev => ({ ...prev, [name]: !prev[name] }));
    }

    const isSubItemActive = (item: NavItem) => {
        return item.subItems?.some(sub => pageToPath[sub.name] === currentPagePath) ?? false;
    }

    const canSee = (item: NavItem): boolean => {
        // Always show Dashboard
        if (item.name === 'Dasbor') return true;

        // If role not loaded yet, show most items except admin-only ones
        if (!currentUserRole) {
            // Show common items to all users while role loads
            const commonItems = ['Produk', 'Pesanan', 'Pelanggan', 'Laporan', 'Penghasilan', 'Daftar Produk', 'Daftar Formulir', 'Pesanan Tertinggal', 'Daftar Pesanan', 'Laporan Iklan', 'Laporan CS', 'Laporan Stock', 'Laporan Keuangan'];
            if (commonItems.includes(item.name)) {
                return true;
            }
            // Hide sensitive items while role loads
            return false;
        }

        // Super Admin sees everything
        if (currentUserRole === 'Super Admin') {
            return true;
        }

        // Get RBAC menu ID for this item
        const rbacMenuId = menuNameToRbacId[item.name];

        if (!rbacMenuId) {
            return false;
        }

        // Check dynamic permissions via RBAC
        return canAccessMenu(rbacMenuId, currentUserRole);
    };

    // Declarative Navigation Structure - NO hardcoded allowedRoles, use RBAC only!
    const allNavItems: NavItem[] = [
        {
            name: 'Dasbor',
            icon: DashboardIcon
        },
        {
            name: 'Produk',
            label: 'Produk',
            icon: Squares2x2Icon,
            subItems: [
                { name: 'Daftar Produk', icon: Squares2x2Icon },
                { name: 'Daftar Formulir', icon: FormsIcon },
            ]
        },
        {
            name: 'Landing Page',
            icon: GlobeIcon
        },
        {
            name: 'Pesanan',
            label: 'Pesanan',
            icon: OrdersIcon,
            subItems: [
                { name: 'Daftar Pesanan', icon: ClipboardListIcon },
                { name: 'Pesanan Tertinggal', icon: ArchiveIcon },
            ]
        },
        {
            name: 'Pelanggan',
            icon: UsersIcon
        },
        {
            name: 'Laporan',
            icon: ReportsIcon,
            subItems: [
                { name: 'Laporan Iklan', icon: TrendingUpIcon },
                { name: 'Laporan CS', icon: UserGroupIcon },
                { name: 'Laporan Stock', icon: ArchiveIcon },
                { name: 'Laporan Keuangan', icon: BanknotesIcon },
            ]
        },
        {
            name: 'Penghasilan',
            icon: BanknotesIcon
        },
        {
            name: 'Pengaturan',
            icon: SettingsIcon,
            subItems: [
                { name: 'Website', icon: WebsiteIcon },
                { name: 'Merek', icon: BrandsIcon },
                { name: 'Pengguna', icon: UsersIcon },
                { name: 'Peran', icon: RoleIcon },
                { name: 'Customer Service', icon: CustomerServiceIcon },
                { name: 'CuanRank', icon: TrophyIcon },
                { name: 'Pelacakan', icon: TrackingIcon },
                { name: 'Log Error', icon: ExclamationTriangleIcon },
                { name: 'Performa', icon: DashboardIcon },
            ]
        },
    ]; const filteredNavItems = allNavItems.filter(item => canSee(item)).map(item => {
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
            <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>

            <aside className={`absolute inset-y-0 left-0 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-xl border-r border-slate-800/80 bg-slate-950 text-slate-100`}>

                <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-br-2xl shadow-inner shrink-0">
                    <Link to="/" className="flex items-center space-x-3 group w-full">
                        {websiteSettings?.logo ? (
                            <img
                                src={websiteSettings.logo}
                                alt={websiteName || websiteSettings?.siteName || 'Logo'}
                                className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow"
                            />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                        )}
                        <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-white leading-tight truncate">{websiteName || websiteSettings?.siteName || 'CuanMax Digital'}</span>
                            <span className="text-xs text-slate-400">Dashboard</span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const path = pageToPath[item.name];
                        const isActive = currentPagePath === path || isSubItemActive(item);
                        const hasSubMenu = !!item.subItems;
                        const isMenuOpen = openSubMenus[item.name];

                        const baseClasses = `flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 group`;
                        const activeClasses = `bg-slate-800/80 text-white border border-slate-700 shadow-sm`;
                        const inactiveClasses = `text-slate-300 hover:bg-slate-900/80 hover:text-white`;

                        const content = (
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                <span className="truncate">{item.label || item.name}</span>
                            </div>
                        );

                        return (
                            <div key={item.name} className="flex flex-col">
                                {hasSubMenu ? (
                                    <button
                                        onClick={() => toggleSubMenu(item.name)}
                                        className={`${baseClasses} ${isActive && !isMenuOpen ? activeClasses : inactiveClasses} ${isMenuOpen ? 'bg-slate-900/70' : ''}`}
                                    >
                                        {content}
                                        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
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
                                        className={`overflow-hidden transition-all duration-200 ${isMenuOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}
                                    >
                                        <div className="ml-8 space-y-0.5 py-1">
                                            {item.subItems!.map(subItem => {
                                                const subPath = pageToPath[subItem.name];
                                                const isSubActive = currentPagePath === subPath;

                                                // Skip if path is undefined or '#'
                                                if (!subPath || subPath === '#') {
                                                    console.warn(`⚠️ No route defined for submenu: ${subItem.name}`);
                                                    return null;
                                                }

                                                return (
                                                    <Link
                                                        key={subItem.name}
                                                        to={subPath}
                                                        onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${isSubActive
                                                            ? 'text-white bg-slate-800/80'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                                                            }`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-3 ${isSubActive ? 'bg-indigo-400' : 'bg-slate-600'}`}></div>
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

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <span>&copy; 2024</span>
                        <span>•</span>
                        <span className="font-medium">v1.2.6</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
