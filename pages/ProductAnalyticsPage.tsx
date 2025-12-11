import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../firebase';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProductPerformance {
    productId: string;
    productName: string;
    brandId: string;
    totalForms: number;
    totalViews: number;
    totalOrders: number;
    totalRevenue: number;
    conversionRatePercent: number;
}

interface AdvertiserPerformance {
    advertiserId: string;
    advertiserName: string;
    totalForms: number;
    totalViews: number;
    totalOrders: number;
    totalRevenue: number;
    conversionRatePercent: number;
}

const ProductAnalyticsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'aggregate' | 'advertiser'>('aggregate');

    // Aggregate view - Product performance
    const [productsPerformance, setProductsPerformance] = useState<ProductPerformance[]>([]);

    // Advertiser view - Advertiser performance
    const [advertiserPerformance, setAdvertiserPerformance] = useState<AdvertiserPerformance[]>([]);

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
            // Get user's assigned brands (for Advertiser role) or all brands (for Admin)
            let brandIds: string[] = [];
            const role = currentUser.role?.toLowerCase();

            if (role === 'super admin' || role === 'admin') {
                // Admin sees all brands
                const { data: brands } = await supabase.from('brands').select('id');
                brandIds = (brands || []).map(b => b.id);
            } else if (currentUser.assignedBrandIds?.length > 0) {
                brandIds = currentUser.assignedBrandIds;
            }

            if (brandIds.length === 0) {
                setProductsPerformance([]);
                setIsLoading(false);
                return;
            }

            // Get forms for these brands
            const { data: forms } = await supabase
                .from('forms')
                .select('id, title, brandId')
                .in('brandId', brandIds);

            // Get orders for these brands
            const { data: orders } = await supabase
                .from('orders')
                .select('id, formId, brandId, totalPrice, productName, status')
                .in('brandId', brandIds)
                .in('status', ['Pending', 'Processing', 'Shipped', 'Delivered']);

            // Get products for these brands
            const { data: products } = await supabase
                .from('products')
                .select('id, name, brand_id')
                .in('brand_id', brandIds)
                .eq('status', 'active');

            // Aggregate by product
            const productMap = new Map<string, ProductPerformance>();

            // Initialize with products
            (products || []).forEach(product => {
                productMap.set(product.id, {
                    productId: product.id,
                    productName: product.name,
                    brandId: product.brand_id,
                    totalForms: 0,
                    totalViews: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    conversionRatePercent: 0
                });
            });

            // Also create entries for forms without product_id (using productName from orders)
            const formProductMap = new Map<string, string>(); // formId -> productName

            // Count forms per product
            (forms || []).forEach(form => {
                if (form.productId && productMap.has(form.productId)) {
                    const perf = productMap.get(form.productId)!;
                    perf.totalForms++;
                    // viewCount column doesn't exist - will be 0
                }
            });

            // Count orders per product
            (orders || []).forEach(order => {
                // Try to match by productId from form first
                const form = (forms || []).find(f => f.id === order.formId);
                if (form?.productId && productMap.has(form.productId)) {
                    const perf = productMap.get(form.productId)!;
                    perf.totalOrders++;
                    perf.totalRevenue += order.totalPrice || 0;
                } else if (order.productName) {
                    // Fallback: aggregate by productName
                    const existingByName = Array.from(productMap.values()).find(p => p.productName === order.productName);
                    if (existingByName) {
                        existingByName.totalOrders++;
                        existingByName.totalRevenue += order.totalPrice || 0;
                    } else {
                        // Create new entry by productName
                        const key = `name-${order.productName}`;
                        if (!productMap.has(key)) {
                            productMap.set(key, {
                                productId: key,
                                productName: order.productName,
                                brandId: order.brandId || '',
                                totalForms: 0,
                                totalViews: 0,
                                totalOrders: 0,
                                totalRevenue: 0,
                                conversionRatePercent: 0
                            });
                        }
                        const perf = productMap.get(key)!;
                        perf.totalOrders++;
                        perf.totalRevenue += order.totalPrice || 0;
                    }
                }
            });

            // Calculate conversion rate
            productMap.forEach(perf => {
                if (perf.totalViews > 0) {
                    perf.conversionRatePercent = (perf.totalOrders / perf.totalViews) * 100;
                }
            });

            // Convert to array and sort by revenue
            const result = Array.from(productMap.values())
                .filter(p => p.totalOrders > 0 || p.totalViews > 0 || p.totalForms > 0)
                .sort((a, b) => b.totalRevenue - a.totalRevenue);

            setProductsPerformance(result);
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
            // Get user's assigned brands
            let brandIds: string[] = [];
            const role = currentUser.role?.toLowerCase();

            if (role === 'super admin' || role === 'admin') {
                const { data: brands } = await supabase.from('brands').select('id');
                brandIds = (brands || []).map(b => b.id);
            } else if (currentUser.assignedBrandIds?.length > 0) {
                brandIds = currentUser.assignedBrandIds;
            }

            if (brandIds.length === 0) {
                setAdvertiserPerformance([]);
                setIsLoading(false);
                return;
            }

            // Get all advertisers who have forms for these brands
            const { data: users } = await supabase
                .from('users')
                .select('id, name, email, role')
                .eq('role', 'Advertiser')
                .eq('status', 'Aktif');

            // Get forms created by advertisers for these brands
            const { data: forms } = await supabase
                .from('forms')
                .select('id, title, brandId, createdBy')
                .in('brandId', brandIds);

            // Get orders for these brands
            const { data: orders } = await supabase
                .from('orders')
                .select('id, formId, brandId, totalPrice, assignedAdvertiserId, status')
                .in('brandId', brandIds)
                .in('status', ['Pending', 'Processing', 'Shipped', 'Delivered']);

            // Aggregate by advertiser
            const advertiserMap = new Map<string, AdvertiserPerformance>();

            // Count forms per advertiser (by createdBy field)
            (forms || []).forEach(form => {
                if (form.createdBy) {
                    if (!advertiserMap.has(form.createdBy)) {
                        const user = (users || []).find(u => u.id === form.createdBy);
                        advertiserMap.set(form.createdBy, {
                            advertiserId: form.createdBy,
                            advertiserName: user?.name || user?.email || 'Unknown',
                            totalForms: 0,
                            totalViews: 0,
                            totalOrders: 0,
                            totalRevenue: 0,
                            conversionRatePercent: 0
                        });
                    }
                    const perf = advertiserMap.get(form.createdBy)!;
                    perf.totalForms++;
                    // viewCount column doesn't exist - will be 0
                }
            });

            // Count orders per advertiser (by assignedAdvertiserId)
            (orders || []).forEach(order => {
                const advertiserId = order.assignedAdvertiserId;
                if (advertiserId) {
                    if (!advertiserMap.has(advertiserId)) {
                        const user = (users || []).find(u => u.id === advertiserId);
                        advertiserMap.set(advertiserId, {
                            advertiserId: advertiserId,
                            advertiserName: user?.name || user?.email || 'Unknown',
                            totalForms: 0,
                            totalViews: 0,
                            totalOrders: 0,
                            totalRevenue: 0,
                            conversionRatePercent: 0
                        });
                    }
                    const perf = advertiserMap.get(advertiserId)!;
                    perf.totalOrders++;
                    perf.totalRevenue += order.totalPrice || 0;
                }
            });

            // Calculate conversion rate
            advertiserMap.forEach(perf => {
                if (perf.totalViews > 0) {
                    perf.conversionRatePercent = (perf.totalOrders / perf.totalViews) * 100;
                }
            });

            // Convert to array and sort by revenue
            const result = Array.from(advertiserMap.values())
                .filter(p => p.totalOrders > 0 || p.totalViews > 0 || p.totalForms > 0)
                .sort((a, b) => b.totalRevenue - a.totalRevenue);

            setAdvertiserPerformance(result);
        } catch (error) {
            console.error('Error fetching advertiser performance:', error);
            showToast('Gagal mengambil data performa', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate total metrics for products
    const totalMetrics = productsPerformance.reduce((acc, p) => ({
        views: acc.views + (p.totalViews || 0),
        orders: acc.orders + (p.totalOrders || 0),
        revenue: acc.revenue + (p.totalRevenue || 0),
        avgConversion: productsPerformance.length > 0
            ? (acc.avgConversion * (productsPerformance.indexOf(p)) + (p.conversionRatePercent || 0)) / (productsPerformance.indexOf(p) + 1)
            : 0,
    }), { views: 0, orders: 0, revenue: 0, avgConversion: 0 });

    // Recalculate average conversion properly
    const avgConversion = productsPerformance.length > 0
        ? productsPerformance.reduce((sum, p) => sum + (p.conversionRatePercent || 0), 0) / productsPerformance.length
        : 0;

    // Calculate total metrics for advertisers
    const totalAdvertiserMetrics = advertiserPerformance.reduce((acc, p) => ({
        views: acc.views + (p.totalViews || 0),
        orders: acc.orders + (p.totalOrders || 0),
        revenue: acc.revenue + (p.totalRevenue || 0),
        forms: acc.forms + (p.totalForms || 0),
    }), { views: 0, orders: 0, revenue: 0, forms: 0 });

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
                    className={`px-6 py-2 rounded-lg font-medium transition ${view === 'aggregate'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                >
                    Performa Produk
                </button>
                <button
                    onClick={() => setView('advertiser')}
                    className={`px-6 py-2 rounded-lg font-medium transition ${view === 'advertiser'
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
                                {avgConversion.toFixed(2)}%
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
                    {/* KPI Cards for Advertiser */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Forms</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalAdvertiserMetrics.forms.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Views</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalAdvertiserMetrics.views.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pesanan</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                {totalAdvertiserMetrics.orders.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">Total Pendapatan</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                                Rp {(totalAdvertiserMetrics.revenue / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>

                    {/* Advertiser Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                        Advertiser
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
                                {advertiserPerformance.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                            Belum ada data performa advertiser
                                        </td>
                                    </tr>
                                ) : (
                                    advertiserPerformance.map((perf) => (
                                        <tr key={perf.advertiserId} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                            <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">
                                                {perf.advertiserName}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {perf.totalForms}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {perf.totalViews.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {perf.totalOrders.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-semibold">
                                                Rp {perf.totalRevenue.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${perf.conversionRatePercent >= 5
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                        : perf.conversionRatePercent >= 2
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                    }`}>
                                                    {perf.conversionRatePercent.toFixed(2)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
