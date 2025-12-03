
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { CSPerformanceData, Order, User } from '../types';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';
import CustomTooltip from '../components/CustomTooltip';
import { supabase } from '../supabase';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import DollarSignIcon from '../components/icons/DollarSignIcon';
import ClockIcon from '../components/icons/ClockIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import ReportsIcon from '../components/icons/ReportsIcon';


const CSReportsPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 29); // Last 30 days
        return { startDate, endDate };
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [ordersResult, usersResult] = await Promise.all([
                    supabase.from('orders').select('*'),
                    supabase.from('users').select('*')
                ]);

                setOrders((ordersResult.data || []).map(o => ({ ...o, date: o.date } as Order)));
                setUsers((usersResult.data || []).map(u => ({ ...u } as User)));
            } catch (error) {
                console.error("Error fetching CS reports data:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredOrders = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return orders;
        
        const start = new Date(dateRange.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.endDate);
        end.setHours(23, 59, 59, 999);

        return orders.filter(order => {
            try {
                const orderDate = new Date(order.date);
                return orderDate >= start && orderDate <= end;
            } catch {
                return false;
            }
        });
    }, [orders, dateRange]);

    const csPerformanceData = useMemo(() => {
        const csUsers = users.filter(u => u.role === 'Customer service' || u.role === 'CS');
        
        return csUsers.map(cs => {
            const csOrders = filteredOrders.filter(o => o.assignedCsId === cs.id);
            const totalOrders = csOrders.length;
            const closedOrders = csOrders.filter(o => ['Shipped', 'Delivered'].includes(o.status));
            const processingOrders = csOrders.filter(o => o.status === 'Processing');
            const pendingOrders = csOrders.filter(o => o.status === 'Pending');
            const canceledOrders = csOrders.filter(o => ['Canceled', 'Refunded'].includes(o.status));
            
            const totalOmzet = closedOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            const totalCommission = closedOrders.reduce((sum, o) => sum + (o.csCommission || o.commissionSnapshot || 0), 0);
            const closingRate = totalOrders > 0 ? (closedOrders.length / totalOrders) * 100 : 0;
            const avgOrderValue = closedOrders.length > 0 ? totalOmzet / closedOrders.length : 0;
            const avgResponseTime = Math.floor(Math.random() * 30) + 10; // Mock data

            return {
                id: cs.id,
                name: cs.name,
                avatar: cs.avatar || `https://i.pravatar.cc/150?u=${cs.name}`,
                totalOrders,
                closedOrders: closedOrders.length,
                processingOrders: processingOrders.length,
                pendingOrders: pendingOrders.length,
                canceledOrders: canceledOrders.length,
                totalOmzet,
                totalCommission,
                closingRate,
                avgOrderValue,
                avgResponseTime,
                rank: cs.rank || '-'
            };
        }).sort((a, b) => b.totalOmzet - a.totalOmzet);
    }, [users, filteredOrders]);

    const summaryStats = useMemo(() => {
        return csPerformanceData.reduce((acc, cs) => ({
            totalOmzet: acc.totalOmzet + cs.totalOmzet,
            totalOrders: acc.totalOrders + cs.totalOrders,
            totalClosed: acc.totalClosed + cs.closedOrders,
            totalCommission: acc.totalCommission + cs.totalCommission,
        }), { totalOmzet: 0, totalOrders: 0, totalClosed: 0, totalCommission: 0 });
    }, [csPerformanceData]);

    const avgClosingRate = summaryStats.totalOrders > 0 
        ? (summaryStats.totalClosed / summaryStats.totalOrders) * 100 
        : 0;

    const chartData = csPerformanceData.map(cs => ({
        name: cs.name.split(' ')[0], // First name only
        Omzet: cs.totalOmzet,
        Closing: cs.closedOrders,
        'Closing Rate': cs.closingRate
    }));

    const statusDistribution = useMemo(() => {
        const total = csPerformanceData.reduce((acc, cs) => ({
            closed: acc.closed + cs.closedOrders,
            processing: acc.processing + cs.processingOrders,
            pending: acc.pending + cs.pendingOrders,
            canceled: acc.canceled + cs.canceledOrders
        }), { closed: 0, processing: 0, pending: 0, canceled: 0 });

        return [
            { name: 'Closed', value: total.closed },
            { name: 'Processing', value: total.processing },
            { name: 'Pending', value: total.pending },
            { name: 'Canceled', value: total.canceled }
        ];
    }, [csPerformanceData]);

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laporan Kinerja CS</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analisis performa tim customer service</p>
            </div>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-20">
                <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        ) : (
            <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Omzet</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                    Rp {summaryStats.totalOmzet.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {summaryStats.totalClosed} pesanan closed
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <DollarSignIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Pesanan</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                    {summaryStats.totalOrders.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Ditangani semua CS
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <ShoppingCartIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Closing Rate</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                    {avgClosingRate.toFixed(1)}%
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Rata-rata tim
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Komisi</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                    Rp {summaryStats.totalCommission.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {csPerformanceData.length} CS aktif
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                <UserGroupIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ReportsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Perbandingan Kinerja CS</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.6}/>
                                    </linearGradient>
                                    <linearGradient id="colorClosing" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.2)" />
                                <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ color: 'rgb(100 116 139)', fontSize: 12 }} />
                                <Bar dataKey="Omzet" fill="url(#colorOmzet)" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Closing" fill="url(#colorClosing)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <CheckCircleFilledIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Status Pesanan</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {statusDistribution.map((item, idx) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <TrophyIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">🏆 Peringkat CS Terbaik</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {csPerformanceData.slice(0, 3).map((cs, index) => {
                            const medals = ['🥇', '🥈', '🥉'];
                            const bgColors = [
                                'from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-700',
                                'from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 border-slate-300 dark:border-slate-600',
                                'from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-700'
                            ];
                            
                            return (
                                <div key={cs.id} className={`bg-gradient-to-br ${bgColors[index]} border-2 rounded-xl p-5 text-center transform transition-transform hover:scale-105`}>
                                    <div className="text-4xl mb-2">{medals[index]}</div>
                                    <img src={cs.avatar} alt={cs.name} className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white dark:border-slate-700 shadow-lg" />
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{cs.name}</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{cs.rank !== '-' ? `Rank ${cs.rank}` : 'Customer Service'}</p>
                                    <div className="space-y-2 text-left bg-white/50 dark:bg-slate-900/20 rounded-lg p-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Omzet:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">Rp {cs.totalOmzet.toLocaleString('id-ID', { notation: 'compact' })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Closing:</span>
                                            <span className="font-bold text-green-600 dark:text-green-400">{cs.closingRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400">Orders:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{cs.closedOrders}/{cs.totalOrders}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Detailed Performance Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <ReportsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rincian Kinerja CS</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CS Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Orders</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Closed</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Closing Rate</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Avg Order</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total Omzet</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Komisi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {csPerformanceData.map((cs, index) => (
                                    <tr key={cs.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={cs.avatar} alt={cs.name} className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{cs.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Response: ~{cs.avgResponseTime}m</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                ['SSS', 'SS', 'S+', 'S'].includes(cs.rank) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                ['A+', 'A'].includes(cs.rank) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                ['B', 'C'].includes(cs.rank) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                                {cs.rank}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-slate-900 dark:text-white">{cs.totalOrders}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-semibold text-green-600 dark:text-green-400">{cs.closedOrders}</span>
                                                <div className="flex gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="text-blue-600 dark:text-blue-400">{cs.processingOrders}P</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{cs.pendingOrders}W</span>
                                                    <span className="text-red-600 dark:text-red-400">{cs.canceledOrders}X</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`text-sm font-bold ${
                                                    cs.closingRate >= 70 ? 'text-green-600 dark:text-green-400' :
                                                    cs.closingRate >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                                    'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {cs.closingRate.toFixed(1)}%
                                                </span>
                                                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                    <div 
                                                        className={`h-1.5 rounded-full ${
                                                            cs.closingRate >= 70 ? 'bg-green-500' :
                                                            cs.closingRate >= 50 ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min(cs.closingRate, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                Rp {cs.avgOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0, notation: 'compact' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                Rp {cs.totalOmzet.toLocaleString('id-ID', { notation: 'compact' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                Rp {cs.totalCommission.toLocaleString('id-ID', { notation: 'compact' })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {csPerformanceData.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12">
                                            <div className="text-slate-400 dark:text-slate-500">
                                                <UserGroupIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">Tidak ada data CS ditemukan.</p>
                                                <p className="text-xs mt-1">Tambahkan user dengan role Customer Service</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};

export default CSReportsPage;
