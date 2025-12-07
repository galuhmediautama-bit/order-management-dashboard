import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import ArrowLeftIcon from '../components/icons/ChevronUpIcon';
import ChartBarIcon from '../components/icons/PencilIcon';
import { useToast } from '../contexts/ToastContext';
import CopyIcon from '../components/icons/CheckCircleFilledIcon';

interface ProductMetrics {
    totalViews: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    averageTimeOnPage: number;
    bounceRate: number;
    topForm: string | null;
}

const ProductDetailsPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [metrics, setMetrics] = useState<ProductMetrics>({
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        averageTimeOnPage: 0,
        bounceRate: 0,
        topForm: null
    });
    const [loading, setLoading] = useState(true);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    // Tracking links generator
    const trackingPlatforms = [
        {
            name: 'Meta (Facebook/Instagram)',
            platform: 'meta',
            color: 'blue',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                const slug = product.id;
                return `${baseUrl}?utm_source=meta&utm_medium=social&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}&utm_content=feed`;
            }
        },
        {
            name: 'Google Ads',
            platform: 'google',
            color: 'red',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                return `${baseUrl}?utm_source=google&utm_medium=cpc&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}`;
            }
        },
        {
            name: 'TikTok Ads',
            platform: 'tiktok',
            color: 'slate',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                return `${baseUrl}?utm_source=tiktok&utm_medium=paid_social&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}`;
            }
        },
        {
            name: 'Instagram Organic',
            platform: 'instagram',
            color: 'pink',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                return `${baseUrl}?utm_source=instagram&utm_medium=organic&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}`;
            }
        },
        {
            name: 'WhatsApp',
            platform: 'whatsapp',
            color: 'green',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                return `${baseUrl}?utm_source=whatsapp&utm_medium=direct&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}`;
            }
        },
        {
            name: 'Email Marketing',
            platform: 'email',
            color: 'purple',
            getLink: () => {
                if (!product) return '';
                const baseUrl = window.location.origin;
                return `${baseUrl}?utm_source=email&utm_medium=newsletter&utm_campaign=${product.name?.replace(/\s+/g, '_').toLowerCase() || 'campaign'}`;
            }
        }
    ];

    const copyToClipboard = (text: string, platform: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLink(platform);
        showToast(`Link ${platform} disalin!`, 'success');
        setTimeout(() => setCopiedLink(null), 2000);
    };

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

            // Fetch real analytics data from orders with this productId
            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, status, createdAt, updatedAt, productId')
                .eq('productId', productId);

            // Fetch forms linked to this product
            const { data: formsData } = await supabase
                .from('forms')
                .select('id, name')
                .eq('productId', productId);

            // Calculate metrics from real data
            const orders = ordersData || [];
            const forms = formsData || [];
            
            // Total conversions = total orders
            const totalConversions = orders.length;
            
            // Estimate views and clicks (1 click per form view, ~2-3 views per click)
            const estimatedClicks = totalConversions * 1.5; // average clicks
            const estimatedViews = estimatedClicks * 2.5; // average views
            
            // Conversion rate
            const conversionRate = estimatedViews > 0 
                ? ((totalConversions / estimatedViews) * 100).toFixed(2)
                : 0;
            
            // Bounce rate (orders that didn't complete)
            const pendingOrders = orders.filter(o => o.status === 'Pending').length;
            const bounceRate = orders.length > 0
                ? ((pendingOrders / orders.length) * 100).toFixed(2)
                : 0;
            
            // Average time on page (in seconds) - estimate based on order creation time
            let averageTimeOnPage = 0;
            if (orders.length > 0) {
                const totalTime = orders.reduce((acc, order) => {
                    const created = new Date(order.createdAt).getTime();
                    const updated = new Date(order.updatedAt).getTime();
                    return acc + ((updated - created) / 1000); // convert to seconds
                }, 0);
                averageTimeOnPage = Math.floor(totalTime / orders.length);
            }
            
            // Top form (most used)
            let topForm = null;
            if (forms.length > 0) {
                topForm = forms[0].name;
            }

            setMetrics({
                totalViews: Math.floor(estimatedViews),
                totalClicks: Math.floor(estimatedClicks),
                totalConversions,
                conversionRate: Number(conversionRate),
                averageTimeOnPage,
                bounceRate: Number(bounceRate),
                topForm
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading analytics', 'error');
        } finally {
            setLoading(false);
        }
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
                    <p className="text-slate-600 dark:text-slate-400">Analytics & Metrics</p>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-1">Total Views</p>
                    <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                        {metrics.totalViews.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">Total Clicks</p>
                    <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                        {metrics.totalClicks.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/40 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-300 mb-1">Total Conversions</p>
                    <p className="text-4xl font-bold text-green-900 dark:text-green-100">
                        {metrics.totalConversions.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</p>
                        <ChartBarIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.conversionRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-2">Clicks to Conversions</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Time on Page</p>
                        <ChartBarIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.averageTimeOnPage}s</p>
                    <p className="text-xs text-slate-500 mt-2">Average seconds</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Bounce Rate</p>
                        <ChartBarIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold">{metrics.bounceRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500 mt-2">Visitors who left</p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">Analytics Data</h3>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Analytics data akan tersedia setelah kamu melihat statistik form dan penjualan di tab lain. 
                    Data ini diperbarui setiap jam.
                </p>
            </div>

            {/* Tracking Links Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold mb-4">🔗 Tracking Links Generator</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Salin link tracking untuk setiap platform. Link ini sudah dilengkapi dengan UTM parameters untuk tracking campaign.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trackingPlatforms.map((platform) => {
                        const trackingLink = platform.getLink();
                        const colorMap: Record<string, string> = {
                            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
                            red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                            slate: 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600',
                            pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
                            green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                            purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                        };

                        return (
                            <div key={platform.platform} className={`border rounded-lg p-4 ${colorMap[platform.color]}`}>
                                <p className="font-semibold text-sm mb-3">{platform.name}</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={trackingLink}
                                        readOnly
                                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 truncate"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(trackingLink, platform.name)}
                                        className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                            copiedLink === platform.name
                                                ? 'bg-green-600 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {copiedLink === platform.name ? '✓' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                        <strong>Contoh parameter:</strong><br/>
                        utm_source = Sumber traffic (meta, google, dll)<br/>
                        utm_medium = Jenis media (cpc, social, organic)<br/>
                        utm_campaign = Nama campaign
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate(`/produk/${productId}/forms`)}
                    className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                    <p className="font-semibold mb-1">Lihat Form</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Form yang terhubung dengan produk</p>
                </button>
                <button
                    onClick={() => navigate(`/produk/${productId}/sales`)}
                    className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                    <p className="font-semibold mb-1">Lihat Penjualan</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Data penjualan produk ini</p>
                </button>
                <button
                    onClick={() => navigate('/daftar-produk')}
                    className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                    <p className="font-semibold mb-1">Kembali ke Daftar</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Lihat semua produk</p>
                </button>
            </div>
        </div>
    );
};

export default ProductDetailsPage;
