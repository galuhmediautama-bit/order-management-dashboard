
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../firebase';
import type { User, Order } from '../types';
import MailIcon from '../components/icons/MailIcon';
import RoleIcon from '../components/icons/RoleIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import ClockIcon from '../components/icons/ClockIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import UserIcon from '../components/icons/UserIcon';
import { capitalizeWords } from '../utils';

const MyProfilePage: React.FC = () => {
    const [userData, setUserData] = useState<User | null>(null);
    const [stats, setStats] = useState({ ordersHandled: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [userAvatar, setUserAvatar] = useState<string>('');

    useEffect(() => {
        const fetchProfileAndStats = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    // 1. Fetch User Data
                    const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
                    
                    const currentUser: User = userDoc ? { ...userDoc } as User : {
                        id: user.id,
                        name: user.user_metadata?.full_name || 'Pengguna',
                        email: user.email || '',
                        role: 'Customer service', 
                        status: 'Aktif',
                        lastLogin: user.last_sign_in_at || new Date().toISOString(),
                        avatar: user.user_metadata?.avatar_url || ''
                    };
                    
                    setUserData(currentUser);
                    
                    // Fetch avatar from database (latest version)
                    if (userDoc?.avatar) {
                        setUserAvatar(userDoc.avatar);
                    } else {
                        setUserAvatar(user.user_metadata?.avatar_url || '');
                    }

                    // 2. Fetch Stats (Orders handled by this user)
                    // Note: If user is Super Admin/Admin, this might show 0 if they don't assign orders to themselves, which is correct behavior.
                    const { data: orders } = await supabase
                        .from('orders')
                        .select('totalPrice, status')
                        .eq('assignedCsId', user.id);

                    if (orders) {
                        const handled = orders.length;
                        const revenue = orders
                            .filter(o => ['Processing', 'Shipped', 'Delivered'].includes(o.status))
                            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
                        
                        setStats({ ordersHandled: handled, totalRevenue: revenue });
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileAndStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Memuat profil Anda...</p>
            </div>
        );
    }

    if (!userData) {
        return <div className="text-center p-8 text-slate-500">Gagal memuat data profil.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 shadow-sm border border-indigo-100/50 dark:border-indigo-800/30">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Profil Saya
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Informasi akun dan performa Anda</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Identity Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-6">
                        {/* Banner Background */}
                        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 relative">
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                        
                        <div className="px-6 pb-6 text-center relative">
                            {/* Avatar with Ring */}
                            <div className="relative -mt-16 inline-block">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 p-1 shadow-xl">
                                    <img
                                        src={userAvatar ? `${userAvatar}?t=${Date.now()}` : `https://i.pravatar.cc/150?u=${userData.id}`}
                                        alt="Avatar"
                                        className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-700"
                                    />
                                </div>
                                <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-3 border-white dark:border-slate-800 shadow-lg ${userData.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {userData.status === 'Aktif' && (
                                        <svg className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{capitalizeWords(userData.name)}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 flex items-center justify-center gap-1">
                                <MailIcon className="w-4 h-4" />
                                {userData.email}
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
                                    <RoleIcon className="w-4 h-4" />
                                    {userData.role}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 shadow-sm ${userData.status === 'Aktif' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 dark:from-green-900/40 dark:to-emerald-900/40 dark:text-green-300 dark:border-green-800' : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${userData.status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                    {userData.status}
                                </span>
                            </div>

                            <Link
                                to="/pengaturan-akun"
                                className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Profil
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg">
                                    <ShoppingCartIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Order Ditangani</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.ordersHandled}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Total pesanan</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl shadow-lg">
                                    <BanknotesIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Total Penjualan</p>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                        {stats.totalRevenue >= 1000000 
                                            ? `${(stats.totalRevenue / 1000000).toFixed(1)}jt` 
                                            : `${(stats.totalRevenue / 1000).toFixed(0)}k`
                                        }
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                            <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Detail Akun
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-lg">
                                        <MailIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">Email</span>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-semibold">{userData.email}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                    <div className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg">
                                        <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">ID Pengguna</span>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-mono text-sm bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 select-all">{userData.id}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                    <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-lg">
                                        <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="text-slate-600 dark:text-slate-300 font-semibold">Terakhir Login</span>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-medium text-right">
                                    {new Date(userData.lastLogin).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                    <div className="p-2.5 bg-green-500 rounded-lg shadow-lg">
                                        <CheckCircleFilledIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-slate-900 dark:text-green-100 font-semibold">Status Akun</span>
                                </div>
                                <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-300 font-bold bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-full text-sm shadow-sm">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                    </svg>
                                    Terverifikasi & Aktif
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfilePage;
