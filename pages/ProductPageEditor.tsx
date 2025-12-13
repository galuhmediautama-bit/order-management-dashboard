import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import CheckIcon from '../components/icons/CheckIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';
import ImageIcon from '../components/icons/ImageIcon';

// ==================== TYPES ====================
interface ProductImage {
    id: string;
    url: string;
    isMain: boolean;
}

interface ProductVariant {
    id: string;
    name: string;
    type: 'color' | 'size' | 'style';
    options: { value: string; label: string; colorHex?: string; }[];
}

interface TrustBadge {
    id: string;
    icon: string;
    title: string;
    description: string;
}

interface Review {
    id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
    avatar?: string;
    photo?: string;
    verified: boolean;
}

interface SocialProofSettings {
    active: boolean;
    liveViewersMin: number;
    liveViewersMax: number;
    recentPurchaseNames: string;
    recentPurchaseCities: string;
}

interface UrgencySettings {
    countdownActive: boolean;
    countdownMinutes: number;
    stockActive: boolean;
    stockInitial: number;
    stockMin: number;
}

// Display/Device Settings
interface DisplaySettings {
    showOnDesktop: boolean;
    showOnTablet: boolean;
    showOnMobile: boolean;
}

// Tracking Pixel Settings
interface PixelEventSetting {
    platform: 'meta' | 'google' | 'tiktok' | 'snack';
    pixelIds: string[];
    events: string[];
}

interface TrackingSettings {
    pageView: PixelEventSetting[];
    buttonClick: PixelEventSetting[];
}

// Global Pixel from settings
interface GlobalPixel {
    id: string;
    name: string;
}
interface GlobalPixelSettings {
    meta: GlobalPixel[];
    google: GlobalPixel[];
    tiktok: GlobalPixel[];
    snack: GlobalPixel[];
}

const PIXEL_EVENTS = {
    meta: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Lead', 'Purchase'],
    google: ['page_view', 'view_item', 'add_to_cart', 'begin_checkout', 'purchase', 'generate_lead'],
    tiktok: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'CompletePayment'],
    snack: ['PageView', 'ViewContent', 'AddToCart', 'Checkout', 'Purchase'],
};

interface ProductPageData {
    id?: string;
    title: string;
    slug: string;
    type: 'product';
    // Product Info
    productName: string;
    productDescription: string;
    productPrice: number;
    productComparePrice?: number;
    totalSold: number;
    // Images
    productImages: ProductImage[];
    // Variants
    variants: ProductVariant[];
    // Form Link
    ctaFormId: string;
    ctaButtonText: string;
    ctaSubtext: string;
    // Trust & Features
    trustBadges: TrustBadge[];
    // Reviews
    reviews: Review[];
    showReviews: boolean;
    // Social Proof
    socialProof: SocialProofSettings;
    // Urgency
    urgency: UrgencySettings;
    // Display Settings
    displaySettings: DisplaySettings;
    // Tracking Pixels
    trackingSettings: TrackingSettings;
    // Styling
    accentColor: string;
    backgroundColor: string;
    // Footer
    footerText: string;
    isPublished: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface Form {
    id: string;
    title: string;
    slug?: string;
}

// ==================== DEFAULTS ====================
const defaultTrustBadges: TrustBadge[] = [
    { id: '1', icon: '🚚', title: 'Gratis Ongkir', description: 'Ke seluruh Indonesia' },
    { id: '2', icon: '🔒', title: 'Pembayaran Aman', description: 'COD & Transfer' },
    { id: '3', icon: '✨', title: 'Kualitas Premium', description: 'Bahan terbaik' },
    { id: '4', icon: '💯', title: 'Garansi 100%', description: 'Uang kembali' },
];

const defaultReviews: Review[] = [
    { id: '1', name: 'Rina S.', rating: 5, comment: 'Barangnya bagus banget, sesuai ekspektasi! Pengiriman cepat. Recommended!', date: '2 hari lalu', verified: true },
    { id: '2', name: 'Budi P.', rating: 5, comment: 'Kualitas oke, harga terjangkau. Pasti repeat order!', date: '3 hari lalu', verified: true },
    { id: '3', name: 'Siti M.', rating: 4, comment: 'Produknya bagus, packagingnya rapi. Seller fast response.', date: '5 hari lalu', verified: true },
];

const defaultSocialProof: SocialProofSettings = {
    active: true,
    liveViewersMin: 15,
    liveViewersMax: 45,
    recentPurchaseNames: 'Rina Setyawati\nAndi Prasetyo\nSiti Marlina\nBudi Hartanto\nDella Anggraini\nFajar Nugraha',
    recentPurchaseCities: 'Jakarta\nBandung\nSurabaya\nYogyakarta\nSemarang\nBekasi\nDepok\nTangerang',
};

const defaultUrgency: UrgencySettings = {
    countdownActive: true,
    countdownMinutes: 15,
    stockActive: true,
    stockInitial: 47,
    stockMin: 5,
};

const defaultDisplaySettings: DisplaySettings = {
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
};

const defaultTrackingSettings: TrackingSettings = {
    pageView: [],
    buttonClick: [],
};

const defaultData: ProductPageData = {
    title: '',
    slug: '',
    type: 'product',
    productName: 'Nama Produk Anda',
    productDescription: 'Deskripsi produk yang menarik dan meyakinkan pembeli untuk segera checkout.',
    productPrice: 199000,
    productComparePrice: 399000,
    totalSold: 2847,
    productImages: [],
    variants: [],
    ctaFormId: '',
    ctaButtonText: '🛒 BELI SEKARANG',
    ctaSubtext: 'Stok terbatas! Pesan sebelum kehabisan',
    trustBadges: defaultTrustBadges,
    reviews: defaultReviews,
    showReviews: true,
    socialProof: defaultSocialProof,
    urgency: defaultUrgency,
    displaySettings: defaultDisplaySettings,
    trackingSettings: defaultTrackingSettings,
    accentColor: '#dc2626',
    backgroundColor: '#ffffff',
    footerText: '© 2025 All rights reserved.',
    isPublished: false,
};

// ==================== MAIN COMPONENT ====================
const ProductPageEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [data, setData] = useState<ProductPageData>(defaultData);
    const [loading, setLoading] = useState(!!id && id !== 'baru');
    const [saving, setSaving] = useState(false);
    const [forms, setForms] = useState<Form[]>([]);
    const [globalPixels, setGlobalPixels] = useState<GlobalPixelSettings>({ meta: [], google: [], tiktok: [], snack: [] });
    const [activeTab, setActiveTab] = useState<'product' | 'images' | 'variants' | 'marketing' | 'settings'>('product');
    const [marketingSection, setMarketingSection] = useState<'urgency' | 'social' | 'reviews' | 'trust'>('urgency');
    const [settingsSection, setSettingsSection] = useState<'general' | 'display' | 'pixels'>('general');
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        fetchForms();
        fetchGlobalPixels();
        if (id && id !== 'baru') fetchPage();
    }, [id]);

    const fetchForms = async () => {
        const { data: formsData } = await supabase.from('forms').select('id, title, slug').order('title');
        setForms(formsData || []);
    };

    const fetchGlobalPixels = async () => {
        try {
            const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
            if (settingsData) {
                // Data format from TrackingPage: { id, meta: { pixels: [], active }, google: { pixels: [], active }, ... }
                setGlobalPixels({
                    meta: (settingsData.meta?.pixels || []).map((p: any) => ({ id: p.id, name: p.name })),
                    google: (settingsData.google?.pixels || []).map((p: any) => ({ id: p.id, name: p.name })),
                    tiktok: (settingsData.tiktok?.pixels || []).map((p: any) => ({ id: p.id, name: p.name })),
                    snack: (settingsData.snack?.pixels || []).map((p: any) => ({ id: p.id, name: p.name })),
                });
            }
        } catch (error) {
            console.error('Error fetching global pixels:', error);
        }
    };

    const fetchPage = async () => {
        try {
            const { data: pageData, error } = await supabase.from('landing_pages').select('*').eq('id', id).single();
            if (error) throw error;
            if (pageData) {
                setData({
                    ...defaultData,
                    ...pageData,
                    productImages: pageData.productImages || [],
                    variants: pageData.variants || [],
                    trustBadges: pageData.trustBadges || defaultTrustBadges,
                    reviews: pageData.reviews || defaultReviews,
                    socialProof: pageData.socialProof || defaultSocialProof,
                    urgency: pageData.urgency || defaultUrgency,
                    displaySettings: pageData.displaySettings || defaultDisplaySettings,
                    trackingSettings: pageData.trackingSettings || defaultTrackingSettings,
                });
            }
        } catch (error) {
            console.error('Error fetching page:', error);
            showToast('Gagal memuat halaman', 'error');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

    const handleSave = async () => {
        if (!data.title.trim()) { showToast('Judul halaman wajib diisi', 'error'); return; }
        if (!data.productName.trim()) { showToast('Nama produk wajib diisi', 'error'); return; }

        setSaving(true);
        try {
            const slug = data.slug || generateSlug(data.title);
            const payload: any = {
                title: data.title, slug, type: 'product',
                productName: data.productName, productDescription: data.productDescription,
                productPrice: data.productPrice, productComparePrice: data.productComparePrice || null,
                totalSold: data.totalSold, productImages: data.productImages, variants: data.variants,
                ctaFormId: data.ctaFormId && data.ctaFormId.trim() !== '' ? data.ctaFormId : null,
                ctaButtonText: data.ctaButtonText, ctaSubtext: data.ctaSubtext,
                trustBadges: data.trustBadges, reviews: data.reviews, showReviews: data.showReviews,
                socialProof: data.socialProof, urgency: data.urgency,
                displaySettings: data.displaySettings, trackingSettings: data.trackingSettings,
                accentColor: data.accentColor, backgroundColor: data.backgroundColor,
                footerText: data.footerText, isPublished: data.isPublished,
                updatedAt: new Date().toISOString(),
            };
            if (!id || id === 'baru') payload.createdAt = new Date().toISOString();

            const result = id && id !== 'baru'
                ? await supabase.from('landing_pages').update(payload).eq('id', id)
                : await supabase.from('landing_pages').insert(payload).select().single();

            if (result.error) throw result.error;
            showToast('Product page berhasil disimpan!', 'success');
            if (!id || id === 'baru') navigate('/landing-page');
        } catch (error: any) {
            console.error('Error saving page:', error);
            showToast(`Gagal menyimpan: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        const fileName = `landing/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
        return publicUrl;
    };

    const addProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await handleImageUpload(file);
            const newImage: ProductImage = { id: Date.now().toString(), url, isMain: data.productImages.length === 0 };
            setData(prev => ({ ...prev, productImages: [...prev.productImages, newImage] }));
            showToast('Gambar berhasil diupload', 'success');
        } catch (error) {
            showToast('Gagal upload gambar', 'error');
        }
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    const mainImage = data.productImages.find(img => img.isMain) || data.productImages[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // ==================== PREVIEW MODE ====================
    if (previewMode) {
        return <ProductPagePreview data={data} forms={forms} onBack={() => setPreviewMode(false)} />;
    }

    // ==================== EDITOR MODE ====================
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/landing-page')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData(prev => ({ ...prev, title: e.target.value, slug: prev.slug || generateSlug(e.target.value) }))}
                            placeholder="Judul Halaman..."
                            className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                        />
                        <p className="text-sm text-slate-500">Slug: /{data.slug || 'auto-generate'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={data.isPublished} onChange={e => setData(prev => ({ ...prev, isPublished: e.target.checked }))} className="rounded" />
                        Publish
                    </label>
                    <button onClick={() => setPreviewMode(true)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                        <EyeIcon className="w-4 h-4" /> Preview
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        <CheckIcon className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-6 overflow-x-auto">
                <div className="flex gap-1">
                    {(['product', 'images', 'variants', 'marketing', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            {tab === 'product' ? '📦 Produk' : tab === 'images' ? '🖼️ Gambar' : tab === 'variants' ? '🎨 Varian' : tab === 'marketing' ? '🚀 Marketing' : '⚙️ Pengaturan'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6">
                {/* Product Tab */}
                {activeTab === 'product' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold mb-4">Informasi Produk</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nama Produk</label>
                                    <input type="text" value={data.productName} onChange={e => setData(prev => ({ ...prev, productName: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Deskripsi</label>
                                    <textarea value={data.productDescription} onChange={e => setData(prev => ({ ...prev, productDescription: e.target.value }))} rows={4} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Harga Jual</label>
                                        <input type="number" value={data.productPrice} onChange={e => setData(prev => ({ ...prev, productPrice: parseInt(e.target.value) || 0 }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Harga Coret</label>
                                        <input type="number" value={data.productComparePrice || ''} onChange={e => setData(prev => ({ ...prev, productComparePrice: parseInt(e.target.value) || undefined }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="Opsional" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Total Terjual</label>
                                        <input type="number" value={data.totalSold} onChange={e => setData(prev => ({ ...prev, totalSold: parseInt(e.target.value) || 0 }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                            <h3 className="font-semibold mb-4">Tombol CTA</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Form Order</label>
                                    <select value={data.ctaFormId} onChange={e => setData(prev => ({ ...prev, ctaFormId: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600">
                                        <option value="">-- Pilih Form --</option>
                                        {forms.map(form => (<option key={form.id} value={form.id}>{form.title}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Teks Tombol</label>
                                    <input type="text" value={data.ctaButtonText} onChange={e => setData(prev => ({ ...prev, ctaButtonText: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sub-teks (di bawah tombol)</label>
                                    <input type="text" value={data.ctaSubtext} onChange={e => setData(prev => ({ ...prev, ctaSubtext: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Images Tab */}
                {activeTab === 'images' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                        <h3 className="font-semibold mb-4">Galeri Gambar</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {data.productImages.map(img => (
                                <div key={img.id} className="relative group">
                                    <div className={`aspect-square rounded-lg overflow-hidden border-2 ${img.isMain ? 'border-red-500' : 'border-slate-200'}`}>
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                        {!img.isMain && (
                                            <button onClick={() => setData(prev => ({ ...prev, productImages: prev.productImages.map(i => ({ ...i, isMain: i.id === img.id })) }))} className="p-2 bg-white rounded-lg text-green-600">
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => setData(prev => ({ ...prev, productImages: prev.productImages.filter(i => i.id !== img.id) }))} className="p-2 bg-white rounded-lg text-red-600">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {img.isMain && <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">Utama</span>}
                                </div>
                            ))}
                            <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
                                <UploadIcon className="w-8 h-8 text-slate-400" />
                                <span className="text-sm text-slate-500 mt-2">Upload</span>
                                <input type="file" accept="image/*" onChange={addProductImage} className="hidden" />
                            </label>
                        </div>
                    </div>
                )}

                {/* Variants Tab */}
                {activeTab === 'variants' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Varian Produk</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setData(prev => ({ ...prev, variants: [...prev.variants, { id: Date.now().toString(), name: 'Warna', type: 'color', options: [] }] }))} className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200">+ Warna</button>
                                <button onClick={() => setData(prev => ({ ...prev, variants: [...prev.variants, { id: Date.now().toString(), name: 'Ukuran', type: 'size', options: [] }] }))} className="px-3 py-1 bg-slate-100 rounded text-sm hover:bg-slate-200">+ Ukuran</button>
                            </div>
                        </div>
                        {data.variants.length === 0 && <p className="text-center py-8 text-slate-500">Belum ada varian</p>}
                        {data.variants.map(variant => (
                            <div key={variant.id} className="border rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <input type="text" value={variant.name} onChange={e => setData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variant.id ? { ...v, name: e.target.value } : v) }))} className="font-medium bg-transparent border-b border-transparent hover:border-slate-300 focus:border-red-500 focus:outline-none" />
                                    <button onClick={() => setData(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== variant.id) }))} className="text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-2">
                                    {variant.options.map((option, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {variant.type === 'color' && <input type="color" value={option.colorHex || '#000'} onChange={e => setData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variant.id ? { ...v, options: v.options.map((o, idx) => idx === i ? { ...o, colorHex: e.target.value } : o) } : v) }))} className="w-10 h-10 rounded cursor-pointer" />}
                                            <input type="text" value={option.label} onChange={e => setData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variant.id ? { ...v, options: v.options.map((o, idx) => idx === i ? { ...o, label: e.target.value } : o) } : v) }))} placeholder="Label..." className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                                            <button onClick={() => setData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variant.id ? { ...v, options: v.options.filter((_, idx) => idx !== i) } : v) }))} className="p-2 text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setData(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variant.id ? { ...v, options: [...v.options, { value: Date.now().toString(), label: '', colorHex: '#000' }] } : v) }))} className="w-full py-2 border-2 border-dashed rounded-lg text-slate-500 hover:border-red-500">+ Tambah Opsi</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Marketing Tab - Combined Urgency, Social Proof, Reviews, Trust */}
                {activeTab === 'marketing' && (
                    <div className="space-y-6">
                        {/* Sub-tabs for Marketing */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm">
                            <div className="flex gap-1 flex-wrap">
                                {(['urgency', 'social', 'reviews', 'trust'] as const).map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setMarketingSection(section)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${marketingSection === section ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        {section === 'urgency' ? '⏰ Urgency' : section === 'social' ? '👥 Social Proof' : section === 'reviews' ? '⭐ Reviews' : '✅ Trust'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Urgency Section */}
                        {marketingSection === 'urgency' && (
                            <>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold">⏰ Countdown Timer</h3>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.urgency.countdownActive} onChange={e => setData(prev => ({ ...prev, urgency: { ...prev.urgency, countdownActive: e.target.checked } }))} className="rounded" />
                                            <span className="text-sm">Aktif</span>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Durasi (menit)</label>
                                        <input type="number" value={data.urgency.countdownMinutes} onChange={e => setData(prev => ({ ...prev, urgency: { ...prev.urgency, countdownMinutes: parseInt(e.target.value) || 15 } }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold">📦 Stok Terbatas</h3>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.urgency.stockActive} onChange={e => setData(prev => ({ ...prev, urgency: { ...prev.urgency, stockActive: e.target.checked } }))} className="rounded" />
                                            <span className="text-sm">Aktif</span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Stok Awal</label>
                                            <input type="number" value={data.urgency.stockInitial} onChange={e => setData(prev => ({ ...prev, urgency: { ...prev.urgency, stockInitial: parseInt(e.target.value) || 50 } }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Stok Minimum</label>
                                            <input type="number" value={data.urgency.stockMin} onChange={e => setData(prev => ({ ...prev, urgency: { ...prev.urgency, stockMin: parseInt(e.target.value) || 5 } }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Social Proof Section */}
                        {marketingSection === 'social' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">👥 Social Proof</h3>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={data.socialProof.active} onChange={e => setData(prev => ({ ...prev, socialProof: { ...prev.socialProof, active: e.target.checked } }))} className="rounded" />
                                        <span className="text-sm">Aktif</span>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Live Viewers Min</label>
                                            <input type="number" value={data.socialProof.liveViewersMin} onChange={e => setData(prev => ({ ...prev, socialProof: { ...prev.socialProof, liveViewersMin: parseInt(e.target.value) || 10 } }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Live Viewers Max</label>
                                            <input type="number" value={data.socialProof.liveViewersMax} onChange={e => setData(prev => ({ ...prev, socialProof: { ...prev.socialProof, liveViewersMax: parseInt(e.target.value) || 50 } }))} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Nama Pembeli (satu per baris)</label>
                                        <textarea value={data.socialProof.recentPurchaseNames} onChange={e => setData(prev => ({ ...prev, socialProof: { ...prev.socialProof, recentPurchaseNames: e.target.value } }))} rows={4} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Kota (satu per baris)</label>
                                        <textarea value={data.socialProof.recentPurchaseCities} onChange={e => setData(prev => ({ ...prev, socialProof: { ...prev.socialProof, recentPurchaseCities: e.target.value } }))} rows={4} className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 font-mono text-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        {marketingSection === 'reviews' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">⭐ Reviews</h3>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={data.showReviews} onChange={e => setData(prev => ({ ...prev, showReviews: e.target.checked }))} className="rounded" />
                                            <span className="text-sm">Tampilkan</span>
                                        </label>
                                        <button onClick={() => setData(prev => ({ ...prev, reviews: [...prev.reviews, { id: Date.now().toString(), name: '', rating: 5, comment: '', date: 'Baru saja', verified: true }] }))} className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm">+ Review</button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {data.reviews.map((review, idx) => (
                                        <div key={review.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                    <input type="text" value={review.name} onChange={e => setData(prev => ({ ...prev, reviews: prev.reviews.map((r, i) => i === idx ? { ...r, name: e.target.value } : r) }))} placeholder="Nama" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                                                    <select value={review.rating} onChange={e => setData(prev => ({ ...prev, reviews: prev.reviews.map((r, i) => i === idx ? { ...r, rating: parseInt(e.target.value) } : r) }))} className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600">
                                                        {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                                                    </select>
                                                    <input type="text" value={review.date} onChange={e => setData(prev => ({ ...prev, reviews: prev.reviews.map((r, i) => i === idx ? { ...r, date: e.target.value } : r) }))} placeholder="Tanggal" className="p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                                                </div>
                                                <button onClick={() => setData(prev => ({ ...prev, reviews: prev.reviews.filter((_, i) => i !== idx) }))} className="ml-2 p-2 text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                            <textarea value={review.comment} onChange={e => setData(prev => ({ ...prev, reviews: prev.reviews.map((r, i) => i === idx ? { ...r, comment: e.target.value } : r) }))} placeholder="Komentar..." rows={2} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trust Section */}
                        {marketingSection === 'trust' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold mb-4">✅ Trust Badges</h3>
                                <div className="space-y-4">
                                    {data.trustBadges.map((badge, idx) => (
                                        <div key={badge.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                            <input type="text" value={badge.icon} onChange={e => setData(prev => ({ ...prev, trustBadges: prev.trustBadges.map((b, i) => i === idx ? { ...b, icon: e.target.value } : b) }))} className="w-16 p-2 text-center text-2xl border rounded dark:bg-slate-600" />
                                            <div className="flex-1 space-y-2">
                                                <input type="text" value={badge.title} onChange={e => setData(prev => ({ ...prev, trustBadges: prev.trustBadges.map((b, i) => i === idx ? { ...b, title: e.target.value } : b) }))} placeholder="Judul" className="w-full p-2 border rounded dark:bg-slate-600" />
                                                <input type="text" value={badge.description} onChange={e => setData(prev => ({ ...prev, trustBadges: prev.trustBadges.map((b, i) => i === idx ? { ...b, description: e.target.value } : b) }))} placeholder="Deskripsi" className="w-full p-2 border rounded dark:bg-slate-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Tab - Combined General, Display, Pixels */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        {/* Sub-tabs for Settings */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-2 shadow-sm">
                            <div className="flex gap-1 flex-wrap">
                                {(['general', 'display', 'pixels'] as const).map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setSettingsSection(section)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${settingsSection === section ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        {section === 'general' ? '⚙️ Umum' : section === 'display' ? '📱 Tampilan' : '📊 Pixel'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* General Settings Section */}
                        {settingsSection === 'general' && (
                            <>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                    <h3 className="font-semibold mb-4">Warna</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Warna Aksen (CTA)</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={data.accentColor} onChange={e => setData(prev => ({ ...prev, accentColor: e.target.value }))} className="w-12 h-12 rounded cursor-pointer" />
                                                <input type="text" value={data.accentColor} onChange={e => setData(prev => ({ ...prev, accentColor: e.target.value }))} className="flex-1 p-2 border rounded dark:bg-slate-700" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Background</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={data.backgroundColor} onChange={e => setData(prev => ({ ...prev, backgroundColor: e.target.value }))} className="w-12 h-12 rounded cursor-pointer" />
                                                <input type="text" value={data.backgroundColor} onChange={e => setData(prev => ({ ...prev, backgroundColor: e.target.value }))} className="flex-1 p-2 border rounded dark:bg-slate-700" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                    <h3 className="font-semibold mb-4">Lainnya</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Custom Slug</label>
                                            <input type="text" value={data.slug} onChange={e => setData(prev => ({ ...prev, slug: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700" placeholder="custom-url" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Footer</label>
                                            <input type="text" value={data.footerText} onChange={e => setData(prev => ({ ...prev, footerText: e.target.value }))} className="w-full p-3 border rounded-lg dark:bg-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Display Settings Section */}
                        {settingsSection === 'display' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold mb-4">📱 Pengaturan Tampilan</h3>
                                <p className="text-sm text-slate-500 mb-4">Pilih perangkat mana yang dapat melihat halaman produk ini.</p>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={data.displaySettings?.showOnDesktop ?? true}
                                            onChange={e => setData(prev => ({ ...prev, displaySettings: { ...prev.displaySettings, showOnDesktop: e.target.checked } }))}
                                            className="w-5 h-5 rounded text-red-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">🖥️</span>
                                                <span className="font-medium">Desktop / PC</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Tampilkan di layar komputer dan laptop (lebar &gt; 1024px)</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={data.displaySettings?.showOnTablet ?? true}
                                            onChange={e => setData(prev => ({ ...prev, displaySettings: { ...prev.displaySettings, showOnTablet: e.target.checked } }))}
                                            className="w-5 h-5 rounded text-red-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">📱</span>
                                                <span className="font-medium">Tablet</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Tampilkan di tablet (lebar 768px - 1024px)</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={data.displaySettings?.showOnMobile ?? true}
                                            onChange={e => setData(prev => ({ ...prev, displaySettings: { ...prev.displaySettings, showOnMobile: e.target.checked } }))}
                                            className="w-5 h-5 rounded text-red-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">📲</span>
                                                <span className="font-medium">Mobile</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Tampilkan di ponsel (lebar &lt; 768px)</p>
                                        </div>
                                    </label>
                                </div>
                                {!(data.displaySettings?.showOnDesktop ?? true) && !(data.displaySettings?.showOnTablet ?? true) && !(data.displaySettings?.showOnMobile ?? true) && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400">⚠️ Perhatian: Halaman tidak akan ditampilkan di perangkat mana pun karena semua opsi dinonaktifkan.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pixels Settings Section */}
                        {settingsSection === 'pixels' && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold mb-2">📊 Tracking Pixel</h3>
                                <p className="text-sm text-slate-500 mb-4">Konfigurasi pixel tracking untuk halaman produk ini. Pixel global diambil dari Pengaturan &gt; Tracking Pixels.</p>
                                
                                {/* PageView Events */}
                                <div className="mb-6">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">PageView</span>
                                        Event saat halaman dibuka
                                    </h4>
                                    <div className="space-y-3">
                                        {['meta', 'google', 'tiktok', 'snack'].map(platform => {
                                            const platformPixels = globalPixels[platform as keyof GlobalPixelSettings] || [];
                                            const platformConfig = data.trackingSettings?.pageView?.find(p => p.platform === platform);
                                            return (
                                                <div key={platform} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold ${platform === 'meta' ? 'bg-blue-600' : platform === 'google' ? 'bg-red-500' : platform === 'tiktok' ? 'bg-black' : 'bg-orange-500'}`}>
                                                                {platform === 'meta' ? 'M' : platform === 'google' ? 'G' : platform === 'tiktok' ? 'T' : 'S'}
                                                            </span>
                                                            <span className="font-medium capitalize">{platform === 'meta' ? 'Meta (Facebook)' : platform === 'google' ? 'Google Ads' : platform === 'tiktok' ? 'TikTok' : 'Snack Video'}</span>
                                                        </div>
                                                    </div>
                                                    {platformPixels.length === 0 ? (
                                                        <p className="text-sm text-slate-400 italic">Tidak ada pixel {platform} yang dikonfigurasi di pengaturan global</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="text-sm text-slate-600 dark:text-slate-400">Pilih Pixel ID:</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {platformPixels.map((pixel: GlobalPixel) => (
                                                                    <label key={pixel.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={platformConfig?.pixelIds?.includes(pixel.id) || false}
                                                                            onChange={e => {
                                                                                const currentSettings = data.trackingSettings?.pageView || [];
                                                                                const existingIndex = currentSettings.findIndex(p => p.platform === platform);
                                                                                let newPixelIds: string[];
                                                                                if (e.target.checked) {
                                                                                    newPixelIds = [...(platformConfig?.pixelIds || []), pixel.id];
                                                                                } else {
                                                                                    newPixelIds = (platformConfig?.pixelIds || []).filter(id => id !== pixel.id);
                                                                                }
                                                                                const newSettings = [...currentSettings];
                                                                                if (existingIndex >= 0) {
                                                                                    newSettings[existingIndex] = { ...newSettings[existingIndex], pixelIds: newPixelIds };
                                                                                } else {
                                                                                    newSettings.push({ platform: platform as any, pixelIds: newPixelIds, events: ['PageView'] });
                                                                                }
                                                                                setData(prev => ({ ...prev, trackingSettings: { ...prev.trackingSettings, pageView: newSettings } }));
                                                                            }}
                                                                            className="w-4 h-4 rounded"
                                                                        />
                                                                        <span className="text-sm">{pixel.name || pixel.id}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {platformConfig?.pixelIds?.length ? (
                                                                <div className="mt-2">
                                                                    <label className="text-sm text-slate-600 dark:text-slate-400">Events:</label>
                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                        {PIXEL_EVENTS[platform as keyof typeof PIXEL_EVENTS]?.map(event => (
                                                                            <label key={event} className="flex items-center gap-1 px-2 py-1 border rounded text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={platformConfig?.events?.includes(event) || false}
                                                                                    onChange={e => {
                                                                                        const currentSettings = data.trackingSettings?.pageView || [];
                                                                                        const idx = currentSettings.findIndex(p => p.platform === platform);
                                                                                        if (idx >= 0) {
                                                                                            const newEvents = e.target.checked
                                                                                                ? [...(currentSettings[idx].events || []), event]
                                                                                                : (currentSettings[idx].events || []).filter(ev => ev !== event);
                                                                                            const newSettings = [...currentSettings];
                                                                                            newSettings[idx] = { ...newSettings[idx], events: newEvents };
                                                                                            setData(prev => ({ ...prev, trackingSettings: { ...prev.trackingSettings, pageView: newSettings } }));
                                                                                        }
                                                                                    }}
                                                                                    className="w-3 h-3 rounded"
                                                                                />
                                                                                <span>{event}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Button Click Events */}
                                <div>
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">ButtonClick</span>
                                        Event saat tombol CTA diklik
                                    </h4>
                                    <div className="space-y-3">
                                        {['meta', 'google', 'tiktok', 'snack'].map(platform => {
                                            const platformPixels = globalPixels[platform as keyof GlobalPixelSettings] || [];
                                            const platformConfig = data.trackingSettings?.buttonClick?.find(p => p.platform === platform);
                                            return (
                                                <div key={platform} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold ${platform === 'meta' ? 'bg-blue-600' : platform === 'google' ? 'bg-red-500' : platform === 'tiktok' ? 'bg-black' : 'bg-orange-500'}`}>
                                                                {platform === 'meta' ? 'M' : platform === 'google' ? 'G' : platform === 'tiktok' ? 'T' : 'S'}
                                                            </span>
                                                            <span className="font-medium capitalize">{platform === 'meta' ? 'Meta (Facebook)' : platform === 'google' ? 'Google Ads' : platform === 'tiktok' ? 'TikTok' : 'Snack Video'}</span>
                                                        </div>
                                                    </div>
                                                    {platformPixels.length === 0 ? (
                                                        <p className="text-sm text-slate-400 italic">Tidak ada pixel {platform} yang dikonfigurasi di pengaturan global</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="text-sm text-slate-600 dark:text-slate-400">Pilih Pixel ID:</label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {platformPixels.map((pixel: GlobalPixel) => (
                                                                    <label key={pixel.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={platformConfig?.pixelIds?.includes(pixel.id) || false}
                                                                            onChange={e => {
                                                                                const currentSettings = data.trackingSettings?.buttonClick || [];
                                                                                const existingIndex = currentSettings.findIndex(p => p.platform === platform);
                                                                                let newPixelIds: string[];
                                                                                if (e.target.checked) {
                                                                                    newPixelIds = [...(platformConfig?.pixelIds || []), pixel.id];
                                                                                } else {
                                                                                    newPixelIds = (platformConfig?.pixelIds || []).filter(id => id !== pixel.id);
                                                                                }
                                                                                const newSettings = [...currentSettings];
                                                                                if (existingIndex >= 0) {
                                                                                    newSettings[existingIndex] = { ...newSettings[existingIndex], pixelIds: newPixelIds };
                                                                                } else {
                                                                                    newSettings.push({ platform: platform as any, pixelIds: newPixelIds, events: ['InitiateCheckout'] });
                                                                                }
                                                                                setData(prev => ({ ...prev, trackingSettings: { ...prev.trackingSettings, buttonClick: newSettings } }));
                                                                            }}
                                                                            className="w-4 h-4 rounded"
                                                                        />
                                                                        <span className="text-sm">{pixel.name || pixel.id}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                            {platformConfig?.pixelIds?.length ? (
                                                                <div className="mt-2">
                                                                    <label className="text-sm text-slate-600 dark:text-slate-400">Events:</label>
                                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                                        {PIXEL_EVENTS[platform as keyof typeof PIXEL_EVENTS]?.map(event => (
                                                                            <label key={event} className="flex items-center gap-1 px-2 py-1 border rounded text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={platformConfig?.events?.includes(event) || false}
                                                                                    onChange={e => {
                                                                                        const currentSettings = data.trackingSettings?.buttonClick || [];
                                                                                        const idx = currentSettings.findIndex(p => p.platform === platform);
                                                                                        if (idx >= 0) {
                                                                                            const newEvents = e.target.checked
                                                                                                ? [...(currentSettings[idx].events || []), event]
                                                                                                : (currentSettings[idx].events || []).filter(ev => ev !== event);
                                                                                            const newSettings = [...currentSettings];
                                                                                            newSettings[idx] = { ...newSettings[idx], events: newEvents };
                                                                                            setData(prev => ({ ...prev, trackingSettings: { ...prev.trackingSettings, buttonClick: newSettings } }));
                                                                                        }
                                                                                    }}
                                                                                    className="w-3 h-3 rounded"
                                                                                />
                                                                                <span>{event}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ==================== PREVIEW COMPONENT ====================
const ProductPagePreview: React.FC<{ data: ProductPageData; forms: Form[]; onBack: () => void }> = ({ data, forms, onBack }) => {
    const [countdown, setCountdown] = useState(data.urgency.countdownMinutes * 60);
    const [currentStock, setCurrentStock] = useState(data.urgency.stockInitial);
    const [liveViewers, setLiveViewers] = useState(Math.floor(Math.random() * (data.socialProof.liveViewersMax - data.socialProof.liveViewersMin + 1)) + data.socialProof.liveViewersMin);
    const [showPopup, setShowPopup] = useState(false);
    const [popupData, setPopupData] = useState({ name: '', city: '' });
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

    const mainImage = data.productImages[selectedImage] || data.productImages[0];
    const accentColor = data.accentColor || '#dc2626';

    // Countdown Timer
    useEffect(() => {
        if (!data.urgency.countdownActive) return;
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : data.urgency.countdownMinutes * 60));
        }, 1000);
        return () => clearInterval(timer);
    }, [data.urgency.countdownActive, data.urgency.countdownMinutes]);

    // Stock countdown
    useEffect(() => {
        if (!data.urgency.stockActive) return;
        const timer = setInterval(() => {
            setCurrentStock(prev => {
                if (prev <= data.urgency.stockMin) return data.urgency.stockInitial;
                return prev - 1;
            });
        }, 8000 + Math.random() * 7000);
        return () => clearInterval(timer);
    }, [data.urgency.stockActive]);

    // Live viewers
    useEffect(() => {
        if (!data.socialProof.active) return;
        const timer = setInterval(() => {
            setLiveViewers(Math.floor(Math.random() * (data.socialProof.liveViewersMax - data.socialProof.liveViewersMin + 1)) + data.socialProof.liveViewersMin);
        }, 5000);
        return () => clearInterval(timer);
    }, [data.socialProof.active]);

    // Recent purchase popup
    useEffect(() => {
        if (!data.socialProof.active) return;
        const names = data.socialProof.recentPurchaseNames.split('\n').filter(n => n.trim());
        const cities = data.socialProof.recentPurchaseCities.split('\n').filter(c => c.trim());
        if (names.length === 0 || cities.length === 0) return;

        const showNextPopup = () => {
            const name = names[Math.floor(Math.random() * names.length)];
            const city = cities[Math.floor(Math.random() * cities.length)];
            setPopupData({ name, city });
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 4000);
        };

        const timer = setInterval(showNextPopup, 8000);
        setTimeout(showNextPopup, 3000);
        return () => clearInterval(timer);
    }, [data.socialProof.active]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

    const getFormLink = (formId: string) => {
        const form = forms.find(f => f.id === formId);
        return form ? `/#/f/${form.slug || form.id}` : '#';
    };

    const savings = (data.productComparePrice || 0) - data.productPrice;
    const discountPercent = data.productComparePrice ? Math.round((1 - data.productPrice / data.productComparePrice) * 100) : 0;

    return (
        <div className="min-h-screen" style={{ backgroundColor: data.backgroundColor }}>
            {/* Preview Header */}
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-50">
                <span className="text-sm">Mode Preview</span>
                <button onClick={onBack} className="px-4 py-1 bg-white text-slate-900 rounded text-sm font-medium">Kembali ke Editor</button>
            </div>

            {/* Urgency Banner */}
            {data.urgency.countdownActive && (
                <div className="text-white text-center py-3 px-4" style={{ backgroundColor: accentColor }}>
                    <p className="font-bold text-sm animate-pulse">🔥 PROMO TERBATAS! Berakhir dalam <span className="font-mono">{formatTime(countdown)}</span></p>
                </div>
            )}

            {/* Recent Purchase Popup */}
            {showPopup && data.socialProof.active && (
                <div className="fixed bottom-20 left-4 z-40 animate-slide-up">
                    <div className="bg-white rounded-lg shadow-2xl p-4 max-w-xs border-l-4" style={{ borderColor: accentColor }}>
                        <p className="text-sm"><span className="font-bold">{popupData.name}</span> dari <span className="font-medium">{popupData.city}</span></p>
                        <p className="text-xs text-slate-500">Baru saja membeli produk ini 🛒</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left - Images */}
                    <div>
                        <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                            {mainImage ? (
                                <img src={mainImage.url} alt={data.productName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon className="w-24 h-24" />
                                </div>
                            )}
                            {/* Live Viewers Badge */}
                            {data.socialProof.active && (
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    {liveViewers} orang sedang melihat
                                </div>
                            )}
                            {/* Discount Badge */}
                            {discountPercent > 0 && (
                                <div className="absolute top-4 right-4 text-white px-3 py-2 rounded-lg font-bold" style={{ backgroundColor: accentColor }}>
                                    -{discountPercent}%
                                </div>
                            )}
                        </div>
                        {/* Thumbnails */}
                        {data.productImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {data.productImages.map((img, idx) => (
                                    <button key={img.id} onClick={() => setSelectedImage(idx)} className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImage === idx ? 'border-red-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right - Product Info */}
                    <div>
                        {/* Total Sold */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-500">★★★★★</span>
                            <span className="text-sm text-slate-500">({data.totalSold.toLocaleString()} terjual)</span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{data.productName}</h1>

                        {/* Price */}
                        <div className="mb-4">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold" style={{ color: accentColor }}>{formatPrice(data.productPrice)}</span>
                                {data.productComparePrice && data.productComparePrice > data.productPrice && (
                                    <span className="text-xl text-slate-400 line-through">{formatPrice(data.productComparePrice)}</span>
                                )}
                            </div>
                            {savings > 0 && (
                                <p className="text-green-600 font-medium mt-1">💰 Hemat {formatPrice(savings)}!</p>
                            )}
                        </div>

                        {/* Stock Warning */}
                        {data.urgency.stockActive && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-yellow-800 font-medium flex items-center gap-2">
                                    <span className="animate-bounce">⚠️</span>
                                    Stok terbatas! Hanya tersisa <span className="font-bold text-red-600">{currentStock}</span> item
                                </p>
                                <div className="mt-2 bg-yellow-200 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(currentStock / data.urgency.stockInitial) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        {/* Variants */}
                        {data.variants.map(variant => (
                            <div key={variant.id} className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">{variant.name}:</label>
                                <div className="flex flex-wrap gap-2">
                                    {variant.options.map((option, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.id]: i }))}
                                            className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${(selectedVariants[variant.id] || 0) === i ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {variant.type === 'color' && option.colorHex && (
                                                <span className="inline-block w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: option.colorHex }} />
                                            )}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* CTA Button */}
                        <a
                            href={data.ctaFormId ? getFormLink(data.ctaFormId) : '#'}
                            className="block w-full py-4 rounded-xl text-white font-bold text-lg text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] mb-2"
                            style={{ backgroundColor: accentColor }}
                        >
                            {data.ctaButtonText}
                        </a>
                        {data.ctaSubtext && (
                            <p className="text-center text-sm text-slate-500 mb-4">{data.ctaSubtext}</p>
                        )}

                        {/* Trust Badges */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {data.trustBadges.map(badge => (
                                <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <span className="text-2xl">{badge.icon}</span>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{badge.title}</p>
                                        <p className="text-xs text-slate-500">{badge.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">📝 Deskripsi Produk</h2>
                    <p className="text-slate-600 whitespace-pre-wrap">{data.productDescription}</p>
                </div>

                {/* Reviews */}
                {data.showReviews && data.reviews.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">⭐ Ulasan Pembeli</h2>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(n => <span key={n} className="text-yellow-400 text-xl">★</span>)}
                                <span className="ml-2 text-slate-500">({data.reviews.length} ulasan)</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {data.reviews.map(review => (
                                <div key={review.id} className="border-b pb-4 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                {review.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium flex items-center gap-2">
                                                    {review.name}
                                                    {review.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Verified</span>}
                                                </p>
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <span key={n} className={n <= review.rating ? 'text-yellow-400' : 'text-slate-300'}>★</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-400">{review.date}</span>
                                    </div>
                                    <p className="text-slate-600">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Mobile CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 md:hidden z-40">
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-xs text-slate-500 line-through">{data.productComparePrice ? formatPrice(data.productComparePrice) : ''}</p>
                        <p className="font-bold text-lg" style={{ color: accentColor }}>{formatPrice(data.productPrice)}</p>
                    </div>
                    <a
                        href={data.ctaFormId ? getFormLink(data.ctaFormId) : '#'}
                        className="flex-1 py-3 rounded-lg text-white font-bold text-center"
                        style={{ backgroundColor: accentColor }}
                    >
                        {data.ctaButtonText}
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 bg-slate-900 text-slate-400 text-center mt-8 mb-16 md:mb-0">
                <p>{data.footerText}</p>
            </footer>

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default ProductPageEditor;
