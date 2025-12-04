import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { ProductPerformanceAggregate, AdvertiserProductPerformance } from '../types';
import { productService } from '../services/productService';
import { supabase } from '../firebase';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ProductAnalyticsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'aggregate' | 'advertiser'>('aggregate');
    
    // Aggregate view
    const [productsPerformance, setProductsPerformance] = useState<ProductPerformanceAggregate[]>([]);
    
    // Advertiser view
    const [advertiserPerformance, setAdvertiserPerformance] = useState<AdvertiserProductPerformance[]>([]);

    const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981'];

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser?.id) {
            if (view === 'aggregate') {
                fetchProductsPerformance();
            } else {
                fetchAdvertiserPerformance();
            }
        }
    }, [currentUser, view]);

    const fetchCurrentUser = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.session.user.id)
                    .single();
                setCurrentUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            showToast('Gagal mengambil data pengguna', 'error');
        }
    };

    const fetchProductsPerformance = async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            const data = await productService.getBrandProductsPerformance(currentUser.id);
            setProductsPerformance(data);
        } catch (error) {
            console.error('Error fetching performance:', error);
            showToast('Gagal mengambil data performa', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAdvertiserPerformance = async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            const data = await productService.getAdvertiserPerformancePerProduct(currentUser.id);
            setAdvertiserPerformance(data);
        } catch (error) {
            console.error('Error fetching advertiser performance:', error);
            showToast('Gagal mengambil data performa', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total metrics
    const totalMetrics = productsPerformance.reduce((acc, p) => ({
        views: acc.views + (p.totalViews || 0),
        clicks: acc.clicks + (p.totalClicks || 0),
        orders: acc.orders + (p.totalOrders || 0),
        revenue: acc.revenue + (p.totalRevenue || 0),
        avgConversion: (acc.avgConversion + (p.conversionRatePercent || 0)) / 2,
    }), { views: 0, clicks: 0, orders: 0, revenue: 0, avgConversion: 0 });

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Analitik Produk
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Lacak performa produk dan iklan dari berbagai advertiser
                    </p>
                </div>
                <TrendingUpIcon className="w-12 h-12 text-indigo-600" />
            </div>

            {/* View Toggle */}
            <div className="flex gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg">
                <button
                    onClick={() => setView('aggregate')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                        view === 'aggregate'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                    Performa Produk
                </button>
                <button
                    onClick={() => setView('advertiser')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                        view === 'advertiser'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                    Performa Advertiser
                </button>
            </div>

            {/* AGGREGATE VIEW */}
            {view === 'aggregate' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Views</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalMetrics.views.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pesanan</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalMetrics.orders.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pendapatan</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                Rp {(totalMetrics.revenue / 1000000).toFixed(1)}M
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Rata-rata Konversi</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalMetrics.avgConversion.toFixed(2)}%
                            </p>
                        </div>
                    </div>

                    {/* Revenue by Product */}
                    {productsPerformance.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                                Pendapatan per Produk
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={productsPerformance.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Bar dataKey="totalRevenue" fill="#4f46e5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Conversion Rate by Product */}
                    {productsPerformance.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                                Tingkat Konversi per Produk
                            </h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={productsPerformance.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="conversionRatePercent" stroke="#7c3aed" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Product Details Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Produk
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Forms
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Pesanan
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Pendapatan
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Konversi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                {productsPerformance.map((product) => (
                                    <tr key={product.productId} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                                            {product.productName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {product.totalForms}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {product.totalViews.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {product.totalOrders.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">
                                            Rp {product.totalRevenue.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {product.conversionRatePercent.toFixed(2)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ADVERTISER VIEW */}
            {view === 'advertiser' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Produk
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Forms
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Pesanan
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Pendapatan
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                                {advertiserPerformance.map((perf) => (
                                    <tr key={`${perf.productId}-${perf.periodStart}`} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                                            {perf.productName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {perf.formsCount}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {perf.viewsCount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                            {perf.ordersCount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">
                                            Rp {perf.totalRevenue.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                perf.isProfitable
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                            }`}>
                                                {perf.isProfitable ? 'Profitable' : 'Loss'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {productsPerformance.length === 0 && advertiserPerformance.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    Belum ada data analitik. Mulai dengan membuat produk dan formulir.
                </div>
            )}
        </div>
    );
};

export default ProductAnalyticsPage;
