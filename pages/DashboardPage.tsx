
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { Order, User } from '../types';
import StatusBadge from '../components/StatusBadge';
import DateRangePicker from '../components/DateRangePicker';
import type { DateRange } from '../components/DateRangePicker';
import CustomTooltip from '../components/CustomTooltip';
import DollarSignIcon from '../components/icons/DollarSignIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import UsersIcon from '../components/icons/UsersIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import ArrowRightIcon from '../components/icons/ArrowRightIcon';
import ClockIcon from '../components/icons/ClockIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import { supabase } from '../supabase';
import { capitalizeWords, filterDataByBrand, getNormalizedRole } from '../utils';


const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
}> = ({ title, value, icon: Icon, change, changeType = 'neutral' }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-3 md:p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex-shrink-0">
              <Icon className="w-5 h-5 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
              <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
              {change && (
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                  changeType === 'increase' ? 'text-green-600 dark:text-green-400' :
                  changeType === 'decrease' ? 'text-red-600 dark:text-red-400' :
                  'text-slate-500 dark:text-slate-400'
                }`}>
                  {changeType === 'increase' && '↑'}
                  {changeType === 'decrease' && '↓'}
                  {change}
                </p>
              )}
            </div>
          </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        return { startDate, endDate };
    });
    
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [viewType, setViewType] = useState<'bar' | 'line'>('bar');
    const [showStatusBreakdown, setShowStatusBreakdown] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                     const { data: userDoc } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                     if (userDoc) {
                         setCurrentUser(userDoc as User);
                         console.log('✅ DashboardPage - User loaded:', { id: userDoc.id, role: userDoc.role, name: userDoc.name });
                     } else {
                         // Fallback for super admin owner who might not be in users collection yet
                         setCurrentUser({ id: user.id, role: 'Super Admin', name: 'Owner', email: user.email || '', status: 'Aktif', lastLogin: '' });
                         console.log('⚠️ DashboardPage - Using fallback Super Admin');
                     }
                }

                // Fetch Orders
                const { data: ordersData, error } = await supabase
                    .from('orders')
                    .select('*')
                    .order('date', { ascending: false });

                if (error) throw error;

                // Mapper Supabase data to Order Type
                const allOrdersList = (ordersData || []).map(data => {
                    // Supabase returns date as string usually, ensure it matches
                    return data as Order;
                });

                setAllOrders(allOrdersList);

                // Fetch Users for CS ranking
                const { data: usersData } = await supabase.from('users').select('*');
                if (usersData) {
                    setUsers(usersData as User[]);
                }

            } catch (error) {
                console.error("Error fetching orders: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const filteredDashboardData = useMemo(() => {
        if (!allOrders.length || !dateRange.startDate || !dateRange.endDate || !currentUser || !users.length) {
            return {
                stats: { 
                    totalSales: 0, 
                    totalOrders: 0, 
                    uniqueCustomers: 0, 
                    averageOrderValue: 0,
                    pendingOrders: 0,
                    completedOrders: 0,
                    conversionRate: 0
                },
                chartData: [],
                recentOrders: [],
                statusBreakdown: [],
                topProducts: [],
                topAdvertisers: [],
                topCS: [],
                previousStats: { totalSales: 0, totalOrders: 0 }
            };
        }

        // 1. Filter by Brand (Role Based)
        const brandFilteredOrders = filterDataByBrand<Order>(allOrders, currentUser);

        // 2. Filter by Date Range
        const dateFilteredOrders = brandFilteredOrders.filter(order => {
            try {
                const orderDate = new Date(order.date);
                if (isNaN(orderDate.getTime())) return false;
                orderDate.setHours(0, 0, 0, 0);

                const startDate = new Date(dateRange.startDate!);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(dateRange.endDate!);
                endDate.setHours(0, 0, 0, 0);
                
                return orderDate >= startDate && orderDate <= endDate;
            } catch {
                return false;
            }
        });

        // Calculate previous period for comparison
        const daysDiff = Math.ceil((new Date(dateRange.endDate!).getTime() - new Date(dateRange.startDate!).getTime()) / (1000 * 60 * 60 * 24));
        const previousStart = new Date(dateRange.startDate!);
        previousStart.setDate(previousStart.getDate() - daysDiff);
        const previousEnd = new Date(dateRange.startDate!);
        previousEnd.setDate(previousEnd.getDate() - 1);

        const previousOrders = brandFilteredOrders.filter(order => {
            try {
                const orderDate = new Date(order.date);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate >= previousStart && orderDate <= previousEnd;
            } catch {
                return false;
            }
        });

        const previousTotalSales = previousOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const previousTotalOrders = previousOrders.length;

        // Calculate stats
        const totalSales = dateFilteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const totalOrders = dateFilteredOrders.length;
        const uniqueCustomers = new Set(dateFilteredOrders.map(order => order.customer)).size;
        const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const pendingOrders = dateFilteredOrders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
        const completedOrders = dateFilteredOrders.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length;
        const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        
        // Daily data for chart
        const dailyData: { [key: string]: { name: string; Sales: number; Orders: number } } = {};
        const currentDate = new Date(dateRange.startDate);
        const loopEndDate = new Date(dateRange.endDate);

        while (currentDate <= loopEndDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            dailyData[dateString] = {
                name: currentDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
                Sales: 0,
                Orders: 0,
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        dateFilteredOrders.forEach(order => {
            const dateString = new Date(order.date).toISOString().split('T')[0];
            if (dailyData[dateString]) {
                dailyData[dateString].Sales += (order.totalPrice || 0);
                dailyData[dateString].Orders += 1;
            }
        });

        const chartData = Object.values(dailyData);
        
        // Status breakdown for pie chart
        const statusCounts: { [key: string]: number } = {};
        dateFilteredOrders.forEach(order => {
            const status = order.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        // Top products
        const productCounts: { [key: string]: number } = {};
        dateFilteredOrders.forEach(order => {
            const product = order.productName || 'Unknown';
            productCounts[product] = (productCounts[product] || 0) + 1;
        });
        const topProducts = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        // Top Advertisers (by total sales)
        // FITUR DINONAKTIFKAN - Order tidak punya field 'advertiser' atau 'assignedAdvId'
        // Butuh penambahan field ke Order type untuk mengaktifkan ranking advertiser
        const topAdvertisers: { name: string; sales: number; orders: number }[] = [];
        
        /* CODE ASLI - DINONAKTIFKAN
        const advertiserStats: { [key: string]: { sales: number; orders: number } } = {};
        dateFilteredOrders.forEach(order => {
            if (order.advertiser) { // Field ini tidak ada di Order type
                if (!advertiserStats[order.advertiser]) {
                    advertiserStats[order.advertiser] = { sales: 0, orders: 0 };
                }
                advertiserStats[order.advertiser].sales += (order.totalPrice || 0);
                advertiserStats[order.advertiser].orders += 1;
            }
        });
        const topAdvertisers = Object.entries(advertiserStats)
            .map(([name, stats]) => ({ name, sales: stats.sales, orders: stats.orders }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
        */


        // Top CS Stats - menggunakan assignedCsId dan join dengan users table
        const csStats: { [key: string]: { orders: number; sales: number; name: string } } = {};
        
        dateFilteredOrders.forEach(order => {
            if (order.assignedCsId) {
                // Cari nama CS dari users
                const csUser = users.find(u => u.id === order.assignedCsId && getNormalizedRole(u.role) === 'Customer service');
                if (csUser) {
                    const csName = csUser.name;
                    if (!csStats[csName]) {
                        csStats[csName] = { orders: 0, sales: 0, name: csName };
                    }
                    csStats[csName].orders += 1;
                    csStats[csName].sales += (order.totalPrice || 0);
                }
            }
        });
        
        const topCS = Object.entries(csStats)
            .map(([name, stats]) => ({ name: stats.name, orders: stats.orders, sales: stats.sales }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5);
        
        const recent = brandFilteredOrders.slice(0, 5);

        return {
            stats: { totalSales, totalOrders, uniqueCustomers, averageOrderValue, pendingOrders, completedOrders, conversionRate },
            chartData,
            recentOrders: recent,
            statusBreakdown,
            topProducts,
            topAdvertisers,
            topCS,
            previousStats: { totalSales: previousTotalSales, totalOrders: previousTotalOrders }
        };
    }, [allOrders, dateRange, currentUser, users]);

    // Derived: filtered recent orders by search and pagination
    const filteredRecentOrders = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const list = filteredDashboardData.recentOrders.filter(order => {
            if (!q) return true;
            return (
                (order.id || '').toLowerCase().includes(q) ||
                (order.customer || '').toLowerCase().includes(q) ||
                String(order.totalPrice || '').toLowerCase().includes(q)
            );
        });
        const effectivePageSize = pageSize > 0 ? pageSize : (list.length || 1);
        const start = (page - 1) * effectivePageSize;
        return list.slice(start, start + effectivePageSize);
    }, [filteredDashboardData.recentOrders, searchQuery, page]);
    const totalRecentPages = useMemo(() => {
        const total = filteredDashboardData.recentOrders.length || 0;
        const effective = pageSize > 0 ? pageSize : total || 1;
        return Math.max(1, Math.ceil(total / effective));
    }, [filteredDashboardData.recentOrders.length, pageSize]);

    const exportCsv = () => {
        const rows = filteredDashboardData.recentOrders.map(o => ({
            id: o.id,
            customer: o.customer,
            date: o.date,
            total: o.totalPrice || 0,
            status: o.status
        }));
        const header = ['Order ID', 'Customer', 'Date', 'Total', 'Status'];
        const csv = [header.join(',')].concat(rows.map(r => [r.id, `"${r.customer}"`, r.date, r.total, r.status].join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

  return (
    <div className="space-y-6 sm:space-y-6 md:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-3 md:flex-row md:justify-between md:items-center">
        <div className="min-w-0">
            <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Dashboard Analytics</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Pantau performa bisnis Anda secara real-time</p>
        </div>
        <div className="w-full md:w-auto"><DateRangePicker value={dateRange} onChange={setDateRange} /></div>
      </div>

      {/* Advertiser-specific Dashboard View */}
      {currentUser && getNormalizedRole(currentUser.role) === 'Advertiser' && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-xl border border-purple-200 dark:border-slate-700">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat Datang, {currentUser.name} 👋</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Berikut adalah ringkasan performa Anda hari ini</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Peran</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">📢 {currentUser.role || 'Advertiser'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-purple-100 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Pesanan</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredDashboardData.stats.totalOrders}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Dalam periode yang dipilih</p>
            </div>
            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-blue-100 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Penjualan</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {(filteredDashboardData.stats.totalSales / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Total revenue</p>
            </div>
            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg border border-indigo-100 dark:border-slate-600">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Conversion Rate</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredDashboardData.stats.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Tingkat penyelesaian</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 md:gap-4 animate-pulse">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 sm:h-20 md:h-20 bg-slate-200 dark:bg-slate-700 rounded-lg sm:rounded-xl"></div>)}
        </div>
      ) : (
        <>
          {/* Only show full dashboard for non-Advertiser roles */}
          {(!currentUser || getNormalizedRole(currentUser.role) !== 'Advertiser') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3 md:gap-4">
            <StatCard 
              title="Total Penjualan" 
              value={`Rp ${filteredDashboardData.stats.totalSales.toLocaleString('id-ID')}`} 
              icon={DollarSignIcon}
              change={filteredDashboardData.previousStats.totalSales > 0 
                ? `${(((filteredDashboardData.stats.totalSales - filteredDashboardData.previousStats.totalSales) / filteredDashboardData.previousStats.totalSales) * 100).toFixed(1)}% vs periode sebelumnya`
                : 'Periode pertama'}
              changeType={filteredDashboardData.stats.totalSales > filteredDashboardData.previousStats.totalSales ? 'increase' : 'decrease'}
            />
            <StatCard 
              title="Total Pesanan" 
              value={filteredDashboardData.stats.totalOrders.toLocaleString('id-ID')} 
              icon={ShoppingCartIcon}
              change={filteredDashboardData.previousStats.totalOrders > 0 
                ? `${(((filteredDashboardData.stats.totalOrders - filteredDashboardData.previousStats.totalOrders) / filteredDashboardData.previousStats.totalOrders) * 100).toFixed(1)}% vs periode sebelumnya`
                : 'Periode pertama'}
              changeType={filteredDashboardData.stats.totalOrders > filteredDashboardData.previousStats.totalOrders ? 'increase' : 'decrease'}
            />
            <StatCard 
              title="Pelanggan Unik" 
              value={filteredDashboardData.stats.uniqueCustomers.toLocaleString('id-ID')} 
              icon={UsersIcon}
              change={`${filteredDashboardData.stats.pendingOrders} pesanan pending`}
              changeType="neutral"
            />
            <StatCard 
              title="Rata-rata Order" 
              value={`Rp ${filteredDashboardData.stats.averageOrderValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`} 
              icon={TrendingUpIcon}
              change={`${filteredDashboardData.stats.conversionRate.toFixed(1)}% conversion rate`}
              changeType="neutral"
            />
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircleFilledIcon className="w-5 h-5 text-green-200 opacity-60" />
                  <p className="text-green-100 text-xs sm:text-xs md:text-sm font-medium">Pesanan Selesai</p>
                </div>
                <div>
                  <p className="text-xl sm:text-xl md:text-2xl font-bold">{filteredDashboardData.stats.completedOrders}</p>
                  <p className="text-green-100 text-xs mt-0.5">
                    {filteredDashboardData.stats.totalOrders > 0 
                      ? `${((filteredDashboardData.stats.completedOrders / filteredDashboardData.stats.totalOrders) * 100).toFixed(1)}%`
                      : '0%'} dari total
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-orange-200 opacity-60" />
                  <p className="text-orange-100 text-xs sm:text-xs md:text-sm font-medium">Pesanan Pending</p>
                </div>
                <div>
                  <p className="text-xl sm:text-xl md:text-2xl font-bold">{filteredDashboardData.stats.pendingOrders}</p>
                  <p className="text-orange-100 text-xs mt-0.5">Perlu ditindaklanjuti</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-indigo-200 opacity-60" />
                  <p className="text-indigo-100 text-xs sm:text-xs md:text-sm font-medium">Conversion Rate</p>
                </div>
                <div>
                  <p className="text-xl sm:text-xl md:text-2xl font-bold">{filteredDashboardData.stats.conversionRate.toFixed(1)}%</p>
                  <p className="text-indigo-100 text-xs mt-0.5">Tingkat penyelesaian</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4 md:gap-4">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <h2 className="text-base sm:text-base md:text-lg font-bold text-slate-900 dark:text-white">Ringkasan Penjualan</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewType('bar')}
                className={`px-3 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg text-xs sm:text-xs md:text-sm font-medium transition ${
                  viewType === 'bar' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Bar
              </button>
              <button 
                onClick={() => setViewType('line')}
                className={`px-3 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-lg text-xs sm:text-xs md:text-sm font-medium transition ${
                  viewType === 'line' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Line
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: '250px' }}>
            <ResponsiveContainer>
              {viewType === 'bar' ? (
                <BarChart data={filteredDashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.2)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value as number)}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 14, color: 'rgb(100 116 139)', paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="Sales" fill="#4f46e5" name="Penjualan" radius={[4, 4, 0, 0]} barSize={40}/>
                  <Bar yAxisId="right" dataKey="Orders" fill="#a5b4fc" name="Pesanan" radius={[4, 4, 0, 0]} barSize={40}/>
                </BarChart>
              ) : (
                <LineChart data={filteredDashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.2)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis yAxisId="left" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgb(100 116 139)', fontSize: 14 }} axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value as number)}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 14, color: 'rgb(100 116 139)', paddingTop: '20px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="Sales" stroke="#4f46e5" strokeWidth={3} name="Penjualan" dot={{ fill: '#4f46e5', r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Orders" stroke="#a5b4fc" strokeWidth={3} name="Pesanan" dot={{ fill: '#a5b4fc', r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-base sm:text-base md:text-lg font-bold mb-4 text-slate-900 dark:text-white">Status Pesanan</h2>
          {filteredDashboardData.statusBreakdown.length > 0 ? (
            <>
              <div style={{ width: '100%', height: '180px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={filteredDashboardData.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredDashboardData.statusBreakdown.map((entry, index) => {
                        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {filteredDashboardData.statusBreakdown.map((item, idx) => {
                  const colors = ['bg-indigo-600', 'bg-green-600', 'bg-orange-600', 'bg-red-600', 'bg-purple-600'];
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs sm:text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}></div>
                        <span className="text-slate-600 dark:text-slate-300 truncate text-xs">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white flex-shrink-0 text-xs">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">Tidak ada data</p>
          )}
        </div>
      </div>

      {/* Top Products */}
      {filteredDashboardData.topProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-base sm:text-base md:text-lg font-bold mb-4 text-slate-900 dark:text-white">Top 5 Produk Terlaris</h2>
          <div className="space-y-2.5 sm:space-y-2.5 md:space-y-3">
            {filteredDashboardData.topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm sm:text-sm md:text-base font-bold text-slate-400 dark:text-slate-600 flex-shrink-0">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-xs md:text-sm truncate">{product.name}</p>
                    <div className="mt-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${(product.count / filteredDashboardData.topProducts[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs sm:text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{product.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Advertiser & Top CS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-4 md:gap-4">
        {/* Top Advertiser */}
        {filteredDashboardData.topAdvertisers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-4 md:p-5 rounded-lg sm:rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h2 className="text-base sm:text-base md:text-lg font-bold mb-3 text-slate-900 dark:text-white">🏆 Top Advertiser</h2>
            <div className="space-y-2">
              {filteredDashboardData.topAdvertisers.map((adv, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-700/50 rounded-lg border border-blue-100 dark:border-slate-600/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-indigo-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-xs md:text-sm truncate">{adv.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{adv.orders} pesanan</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400">Rp {adv.sales.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Customer Service */}
        {filteredDashboardData.topCS.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">⭐ Top 5 Customer Service</h2>
            <div className="space-y-4">
              {filteredDashboardData.topCS.map((cs, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-700 rounded-xl">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-green-500'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{cs.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Rp {cs.sales.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{cs.orders}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Pesanan</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 sm:p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pesanan Terbaru</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 dark:text-slate-300">Per halaman</label>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="px-2 py-1 rounded-lg border bg-white dark:bg-slate-900 text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={0}>Custom</option>
                    </select>
                    {pageSize === 0 && (
                        <input
                            type="number"
                            min={1}
                            placeholder="Masukkan jumlah"
                            onChange={(e) => { const v = Number(e.target.value || 0); if (v > 0) { setPageSize(v); setPage(1); } }}
                            className="w-24 px-2 py-1 rounded-lg border bg-white dark:bg-slate-900 text-sm"
                        />
                    )}
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder="Cari Order ID, nama pelanggan, atau total..."
                  className="w-full sm:w-60 md:w-80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
                />
                <button onClick={exportCsv} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Export CSV</button>
            </div>
        </div>
        <div className="overflow-x-auto">
            {loading ? (
                <div className="text-center p-12 text-slate-600 dark:text-slate-400 text-lg">Memuat pesanan...</div>
            ) : (
                <table className="w-full text-left">
                  <thead className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 md:px-8 py-2 sm:py-4 font-semibold">Order ID</th>
                      <th scope="col" className="px-3 sm:px-6 md:px-8 py-2 sm:py-4 font-semibold">Pelanggan</th>
                      <th scope="col" className="px-3 sm:px-6 md:px-8 py-2 sm:py-4 font-semibold">Tanggal</th>
                      <th scope="col" className="px-3 sm:px-6 md:px-8 py-2 sm:py-4 font-semibold">Total</th>
                      <th scope="col" className="px-3 sm:px-6 md:px-8 py-2 sm:py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredRecentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 sm:px-6 md:px-8 py-2 sm:py-5 font-medium text-xs sm:text-sm md:text-base text-slate-900 dark:text-white whitespace-nowrap" title={order.id}>{order.id.substring(0, 6)}...</td>
                      <td className="px-3 sm:px-6 md:px-8 py-2 sm:py-5 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300">
                         <span className="truncate max-w-[100px] sm:max-w-[160px] md:max-w-[200px]">{capitalizeWords(order.customer)}</span>
                      </td>
                      <td className="px-3 sm:px-6 md:px-8 py-2 sm:py-5 text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 whitespace-nowrap">{order.date}</td>
                      <td className="px-3 sm:px-6 md:px-8 py-2 sm:py-5 text-xs sm:text-sm md:text-base text-slate-900 dark:text-white font-semibold">Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</td>
                      <td className="px-3 sm:px-6 md:px-8 py-2 sm:py-5"><StatusBadge status={order.status} /></td>
                    </tr>
                    ))}
                  </tbody>
                </table>
            )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
                {(() => {
                    const total = filteredDashboardData.recentOrders.length || 0;
                    const effective = pageSize > 0 ? pageSize : total || 1;
                    const start = total === 0 ? 0 : (page - 1) * effective + 1;
                    const end = Math.min(total, page * effective);
                    return `Menampilkan ${start}-${end} dari ${total} pesanan`;
                })()}
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border bg-white dark:bg-slate-900 disabled:opacity-40">Prev</button>
                <span className="px-3 text-sm">{page} / {totalRecentPages}</span>
                <button onClick={() => setPage(p => Math.min(totalRecentPages, p + 1))} disabled={page === totalRecentPages} className="px-3 py-1 rounded border bg-white dark:bg-slate-900 disabled:opacity-40">Next</button>
            </div>
        </div>
       </div>
    </div>
  );
};

export default DashboardPage;
