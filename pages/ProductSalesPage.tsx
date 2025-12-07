import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Order, Product, Brand } from '../types';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import EyeIcon from '../components/icons/EyeIcon';
import PrinterIcon from '../components/icons/PencilIcon';
import ArrowLeftIcon from '../components/icons/ChevronUpIcon';
import { useToast } from '../contexts/ToastContext';

const ProductSalesPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [brandsMap, setBrandsMap] = useState<Map<string, Brand>>(new Map());
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        averageOrderValue: 0
    });

    useEffect(() => {
        if (productId) {
            fetchData();
        }
    }, [productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch product details
            const { data: productData } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (productData) {
                setProduct(productData as Product);
            }

            // Fetch orders for this product - either direct product_id match or via form's product_id
            const { data: ordersData } = await supabase
                .from('orders')
                .select('*')
                .eq('product_id', productId)
                .in('status', ['Shipped', 'Delivered', 'Completed'])
                .order('created_at', { ascending: false });

            if (ordersData) {
                const typedOrders = ordersData as Order[];
                setOrders(typedOrders);

                // Fetch all brands to map brand IDs to names
                const brandIds = [...new Set(typedOrders
                    .map(o => o.brandId)
                    .filter((id): id is string => !!id))];

                if (brandIds.length > 0) {
                    const { data: brandsData } = await supabase
                        .from('brands')
                        .select('id, name')
                        .in('id', brandIds);

                    if (brandsData) {
                        const newBrandsMap = new Map<string, Brand>();
                        (brandsData as Brand[]).forEach(brand => {
                            newBrandsMap.set(brand.id, brand);
                        });
                        setBrandsMap(newBrandsMap);
                    }
                }

                // Calculate stats
                const totalOrders = typedOrders.length;
                const totalRevenue = typedOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                const shippedOrders = typedOrders.filter(o => o.status === 'Shipped').length;
                const deliveredOrders = typedOrders.filter(o => o.status === 'Delivered').length;
                const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                setStats({
                    totalOrders,
                    totalRevenue,
                    shippedOrders,
                    deliveredOrders,
                    averageOrderValue
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading sales data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <SpinnerIcon className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">{product?.name || 'Produk'}</h1>
                    <p className="text-slate-600 dark:text-slate-400">Data Penjualan</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Penjualan</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Pendapatan</p>
                    <p className="text-lg font-bold truncate">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Dikirim</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.shippedOrders}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Terkirim</p>
                    <p className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Rata-rata Order</p>
                    <p className="text-lg font-bold truncate">{formatCurrency(stats.averageOrderValue)}</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-600 dark:text-slate-400">Tidak ada penjualan untuk produk ini</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Pelanggan</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Brand</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Sumber</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Handler</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Tanggal</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <td className="px-6 py-4">
                                            <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                                {order.id.substring(0, 8)}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{order.customerName}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{order.customerPhone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                {order.brandId ? brandsMap.get(order.brandId)?.name || 'Unknown' : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold">
                                            {formatCurrency(order.totalPrice || 0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                                {order.sourceForm ? 'Form' : order.utmSource || 'Direct'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                order.assignedCsId 
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                            }`}>
                                                {order.assignedCsId ? 'CS' : 'Advertiser'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                order.status === 'Delivered'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : order.status === 'Shipped'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/pesanan`)}
                                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"
                                                title="Lihat Detail"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSalesPage;
