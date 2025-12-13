import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../firebase';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import ImageIcon from '../components/icons/ImageIcon';
import LandingPagePixelScript from '../components/LandingPagePixelScript';

// New Elementor-style types
type WidgetType = 'heading' | 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'list' | 'testimonial' | 'video' | 'countdown' | 'features' | 'pricing' | 'faq' | 'gallery';

interface Widget {
    id: string;
    type: WidgetType;
    content: any;
    style: {
        padding?: string;
        margin?: string;
        backgroundColor?: string;
        textColor?: string;
        alignment?: 'left' | 'center' | 'right';
        fontSize?: string;
        fontWeight?: string;
        borderRadius?: string;
        width?: string;
    };
}

interface Section {
    id: string;
    type: 'full' | 'two-col' | 'three-col';
    backgroundColor?: string;
    backgroundImage?: string;
    padding?: string;
    widgets: Widget[];
}

interface SalesPageData {
    id: string;
    title: string;
    slug: string;
    type: 'sales';
    sections?: Section[];
    // Old format fields (for backward compatibility)
    heroImage?: string;
    heroTitle?: string;
    heroSubtitle?: string;
    contentBlocks?: any[];
    ctaButtonText?: string;
    ctaFormId: string;
    globalStyles?: {
        primaryColor: string;
        secondaryColor: string;
        fontFamily: string;
        backgroundColor: string;
    };
    pageWidth?: string;
    trackingSettings?: TrackingSettings;
    footerText: string;
    isPublished: boolean;
}

// Old catalog format
interface ProductItem {
    id: string;
    formId: string;
    productName: string;
    productImage: string;
    productPrice: number;
    isVisible: boolean;
}

// New Teespring-style format
interface ProductImage {
    id: string;
    url: string;
    isMain: boolean;
}

interface ProductVariant {
    id: string;
    name: string;
    type: 'color' | 'size' | 'style';
    options: {
        value: string;
        label: string;
        image?: string;
        colorHex?: string;
    }[];
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
    // Display settings per device
    showOnDesktop?: boolean;
    showOnTablet?: boolean;
    showOnMobile?: boolean;
}

interface UrgencySettings {
    countdownActive: boolean;
    countdownMinutes: number;
    stockActive: boolean;
    stockInitial: number;
    stockMin: number;
}

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

interface GlobalPixelSettings {
    meta: { pixels: { id: string; name: string }[]; active: boolean };
    google: { pixels: { id: string; name: string }[]; active: boolean };
    tiktok: { pixels: { id: string; name: string }[]; active: boolean };
    snack: { pixels: { id: string; name: string }[]; active: boolean };
}

interface ProductPageData {
    id: string;
    title: string;
    slug: string;
    type: 'product';
    // Old catalog format
    headerImage?: string;
    headerTitle?: string;
    headerSubtitle?: string;
    products?: ProductItem[];
    gridColumns?: 2 | 3 | 4;
    showPrice?: boolean;
    buttonText?: string;
    // New Teespring-style format
    productName?: string;
    productDescription?: string;
    productPrice?: number;
    productComparePrice?: number;
    totalSold?: number;
    productImages?: ProductImage[];
    variants?: ProductVariant[];
    ctaFormId?: string;
    ctaButtonText?: string;
    ctaSubtext?: string;
    trustBadges?: TrustBadge[];
    reviews?: Review[];
    showReviews?: boolean;
    socialProof?: SocialProofSettings;
    urgency?: UrgencySettings;
    displaySettings?: DisplaySettings;
    trackingSettings?: TrackingSettings;
    accentColor?: string;
    backgroundColor: string;
    footerText: string;
    isPublished: boolean;
}

type LandingPageData = SalesPageData | ProductPageData;

interface FormProductOption {
    id: number;
    name: string;
    values: string[];
    displayStyle?: 'dropdown' | 'radio' | 'modern';
}

interface Form {
    id: string;
    title: string;
    slug?: string;
    productOptions?: FormProductOption[];
}

const LandingPageViewer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<LandingPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forms, setForms] = useState<Form[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const [globalPixels, setGlobalPixels] = useState<GlobalPixelSettings | null>(null);

    useEffect(() => {
        if (slug) {
            fetchPage();
            fetchForms();
            fetchGlobalPixels();
        } else {
            setLoading(false);
            setError('Slug tidak ditemukan');
        }
    }, [slug, retryCount]);

    // Fetch global pixels for tracking
    const fetchGlobalPixels = async () => {
        try {
            const { data } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
            if (data) setGlobalPixels(data);
        } catch (e) { console.error('Error fetching global pixels:', e); }
    };

    // Timeout safety - if loading takes too long, show error with retry option
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) {
                console.error('Loading timeout - page took too long to load');
                setLoading(false);
                setError('Koneksi timeout. Silakan coba lagi.');
            }
        }, 15000); // 15 second timeout

        return () => clearTimeout(timeout);
    }, [loading, retryCount]);

    const fetchPage = async () => {
        setLoading(true);
        setError(null);

        try {
            // First try to get published page
            let { data: pageData, error: fetchError } = await supabase
                .from('landing_pages')
                .select('*')
                .eq('slug', slug)
                .eq('isPublished', true)
                .maybeSingle();

            if (fetchError) {
                console.error('Supabase error:', fetchError);
                throw new Error(fetchError.message);
            }

            // If not found and user might be previewing, try without isPublished filter
            if (!pageData) {
                const result = await supabase
                    .from('landing_pages')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();

                if (result.error) {
                    console.error('Supabase error (retry):', result.error);
                    throw new Error(result.error.message);
                }

                if (result.data) {
                    pageData = result.data;
                    // Show preview notice for unpublished pages
                    if (!pageData.isPublished) {
                        console.log('Preview mode: Page is not published yet');
                    }
                }
            }

            if (!pageData) {
                setError('Halaman tidak ditemukan');
                setLoading(false);
                return;
            }
            setData(pageData as LandingPageData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching page:', err);
            setError(err instanceof Error ? err.message : 'Gagal memuat halaman. Silakan coba lagi.');
            setLoading(false);
        }
    };

    const fetchForms = async () => {
        const { data: formsData } = await supabase
            .from('forms')
            .select('id, title, slug, productOptions');
        setForms(formsData || []);
    };

    // Get form link with variant params
    const getFormLink = (formId: string, variantParams?: Record<string, string>) => {
        const form = forms.find(f => f.id === formId);
        const baseUrl = form ? `/#/f/${form.slug || form.id}` : `/#/f/${formId}`;

        if (variantParams && Object.keys(variantParams).length > 0) {
            const params = new URLSearchParams();
            Object.entries(variantParams).forEach(([key, value]) => {
                params.append(key, value);
            });
            return `${baseUrl}?${params.toString()}`;
        }
        return baseUrl;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-500">Memuat...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-700 mb-2">
                        {error?.includes('timeout') ? 'Koneksi Bermasalah' : 'Halaman Tidak Ditemukan'}
                    </h1>
                    <p className="text-slate-500 mb-4">{error || 'Halaman tidak ditemukan'}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => setRetryCount(c => c + 1)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            🔄 Coba Lagi
                        </button>
                        <a
                            href="/"
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                        >
                            Kembali ke beranda
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Render Sales Page (New Elementor format)
    if (data.type === 'sales') {
        const salesData = data as SalesPageData;
        const globalStyles = salesData.globalStyles || {
            primaryColor: '#6366f1',
            secondaryColor: '#f59e0b',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#ffffff',
        };
        // Get pageWidth from globalStyles (where it's stored) or from pageWidth field or default
        const pageWidth = (globalStyles as any).pageWidth || salesData.pageWidth || '1024px';

        // New format with sections
        if (salesData.sections && salesData.sections.length > 0) {
            return (
                <div className="min-h-screen" style={{ fontFamily: globalStyles.fontFamily, backgroundColor: globalStyles.backgroundColor }}>
                    {/* Pixel Script for Sales Page */}
                    {globalPixels && salesData.trackingSettings && (
                        <LandingPagePixelScript
                            globalPixels={globalPixels}
                            pageTrackingSettings={salesData.trackingSettings}
                        />
                    )}
                    {salesData.sections.map(section => (
                        <section
                            key={section.id}
                            style={{
                                backgroundColor: section.backgroundColor,
                                padding: section.padding,
                                backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="mx-auto" style={{ maxWidth: pageWidth }}>
                                {section.widgets.map(widget => (
                                    <WidgetRenderer
                                        key={widget.id}
                                        widget={widget}
                                        globalStyles={globalStyles}
                                        forms={forms}
                                        ctaFormId={salesData.ctaFormId}
                                        trackingSettings={salesData.trackingSettings}
                                        globalPixels={globalPixels}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                    <footer className="py-8 bg-slate-900 text-slate-400 text-center">
                        <p>{salesData.footerText}</p>
                    </footer>
                </div>
            );
        }

        // Old format (backward compatibility)
        return (
            <div className="min-h-screen bg-white">
                {/* Hero */}
                <section className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white">
                    <div className="max-w-4xl mx-auto px-6 text-center py-16">
                        {salesData.heroImage && (
                            <img src={salesData.heroImage} alt="Hero" className="w-48 h-48 mx-auto mb-6 rounded-2xl shadow-xl object-cover" />
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{salesData.heroTitle}</h1>
                        <p className="text-xl text-purple-100 mb-8">{salesData.heroSubtitle}</p>
                    </div>
                </section>

                {/* Content Blocks */}
                {salesData.contentBlocks && salesData.contentBlocks.length > 0 && (
                    <section className="py-16 px-6">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {salesData.contentBlocks.map((block: any) => (
                                <div key={block.id} className={`text-${block.alignment || 'left'}`}>
                                    {block.type === 'heading' && (
                                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{block.content}</h2>
                                    )}
                                    {block.type === 'text' && (
                                        <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>
                                    )}
                                    {block.type === 'image' && block.imageUrl && (
                                        <img src={block.imageUrl} alt="" className="rounded-xl shadow-lg max-w-full mx-auto" />
                                    )}
                                    {block.type === 'list' && (
                                        <ul className="space-y-2 text-lg text-slate-600">
                                            {block.content.split('\n').map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-purple-500">✓</span>
                                                    <span>{item.replace(/^[•\-\*]\s*/, '')}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center">
                    <div className="max-w-2xl mx-auto px-6">
                        <h2 className="text-3xl font-bold mb-6">Siap untuk Memesan?</h2>
                        {salesData.ctaFormId ? (
                            <a
                                href={getFormLink(salesData.ctaFormId)}
                                className="inline-block px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors text-lg shadow-lg"
                            >
                                {salesData.ctaButtonText || 'Pesan Sekarang'}
                            </a>
                        ) : (
                            <span className="inline-block px-8 py-4 bg-white/20 text-white font-bold rounded-xl cursor-not-allowed">
                                {salesData.ctaButtonText || 'Pesan Sekarang'}
                            </span>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 bg-slate-900 text-slate-400 text-center">
                    <p>{salesData.footerText}</p>
                </footer>
            </div>
        );
    }

    // Render Product Page
    if (data.type === 'product') {
        const productData = data as ProductPageData;

        // Check if it's new Teespring-style format (has productName) or old catalog format (has products array)
        const isTeespringStyle = productData.productName && !productData.products?.length;

        if (isTeespringStyle) {
            // New Teespring-style single product page with HIGH-CONVERTING features
            // Find the linked form to get its productOptions
            const linkedForm = productData.ctaFormId ? forms.find(f => f.id === productData.ctaFormId) : null;
            return <HighConvertingProductPage productData={productData} forms={forms} linkedForm={linkedForm} getFormLink={getFormLink} formatPrice={formatPrice} />;
        }

        // Old catalog format
        const visibleProducts = productData.products?.filter(p => p.isVisible) || [];

        return (
            <div className="min-h-screen" style={{ backgroundColor: productData.backgroundColor }}>
                {/* Header */}
                <header className="pb-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center">
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        {productData.headerImage && (
                            <img src={productData.headerImage} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-4 border-white/30" />
                        )}
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{productData.headerTitle}</h1>
                        <p className="text-emerald-100">{productData.headerSubtitle}</p>
                    </div>
                </header>

                {/* Product Grid */}
                <section className="py-12 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className={`grid gap-6 ${productData.gridColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' : productData.gridColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                            {visibleProducts.map(product => (
                                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="aspect-square bg-slate-100">
                                        {product.productImage ? (
                                            <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <ShoppingBagIcon className="w-16 h-16" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">{product.productName}</h3>
                                        {productData.showPrice && (
                                            <p className="text-emerald-600 font-bold mb-3">{formatPrice(product.productPrice)}</p>
                                        )}
                                        <a
                                            href={getFormLink(product.formId)}
                                            className="block w-full py-2 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                        >
                                            {productData.buttonText}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {visibleProducts.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Belum ada produk tersedia</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 bg-slate-900 text-slate-400 text-center">
                    <p>{productData.footerText}</p>
                </footer>
            </div>
        );
    }

    return null;
};
// Widget Renderer Component for new format
const WidgetRenderer: React.FC<{
    widget: Widget;
    globalStyles: { primaryColor: string; secondaryColor: string; fontFamily: string; backgroundColor: string };
    forms: Form[];
    ctaFormId: string;
    trackingSettings?: TrackingSettings;
    globalPixels?: GlobalPixelSettings | null;
}> = ({ widget, globalStyles, forms, ctaFormId, trackingSettings, globalPixels }) => {
    const style: React.CSSProperties = {
        padding: widget.style.padding,
        textAlign: widget.style.alignment as any,
        color: widget.style.textColor,
        fontSize: widget.style.fontSize,
        fontWeight: widget.style.fontWeight as any,
    };

    const getFormLink = (formId: string) => {
        const form = forms.find(f => f.id === formId);
        return form ? `/#/f/${form.slug || form.id}` : '#';
    };

    // Fire button click tracking events
    const fireButtonClickEvents = () => {
        if (!trackingSettings?.buttonClick || !globalPixels) return;
        
        trackingSettings.buttonClick.forEach((setting) => {
            const platformPixels = globalPixels[setting.platform]?.pixels || [];
            const activePixelIds = platformPixels
                .filter((p: { id: string }) => setting.pixelIds.includes(p.id))
                .map((p: { id: string }) => p.id);

            if (activePixelIds.length === 0) return;

            setting.events.forEach((eventName) => {
                activePixelIds.forEach((pixelId: string) => {
                    if (setting.platform === 'meta' && typeof (window as any).fbq === 'function') {
                        (window as any).fbq('trackSingle', pixelId, eventName);
                    } else if (setting.platform === 'google' && typeof (window as any).gtag === 'function') {
                        (window as any).gtag('event', eventName, { send_to: pixelId });
                    } else if (setting.platform === 'tiktok' && typeof (window as any).ttq === 'object') {
                        (window as any).ttq.instance(pixelId).track(eventName);
                    } else if (setting.platform === 'snack' && typeof (window as any).snaq === 'function') {
                        (window as any).snaq('track', eventName, { pixel_id: pixelId });
                    }
                });
            });
        });
    };

    switch (widget.type) {
        case 'heading':
            const headingClass = `${widget.content.level === 'h1' ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'} font-bold`;
            if (widget.content.level === 'h1') return <h1 style={style} className={headingClass}>{widget.content.text}</h1>;
            if (widget.content.level === 'h3') return <h3 style={style} className={headingClass}>{widget.content.text}</h3>;
            return <h2 style={style} className={headingClass}>{widget.content.text}</h2>;

        case 'text':
            return <p style={style} className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">{widget.content.text}</p>;

        case 'image':
            return (
                <div style={style}>
                    {widget.content.url ? (
                        <img src={widget.content.url} alt={widget.content.alt || ''} className="max-w-full rounded-lg shadow-lg mx-auto" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                    ) : (
                        <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-12 h-12" />
                        </div>
                    )}
                    {widget.content.caption && <p className="text-sm text-slate-500 mt-2">{widget.content.caption}</p>}
                </div>
            );

        case 'button':
            return (
                <div style={style}>
                    <a
                        href={ctaFormId ? getFormLink(ctaFormId) : widget.content.link || '#'}
                        onClick={fireButtonClickEvents}
                        className={`inline-block px-8 py-3 rounded-lg font-semibold transition-all ${widget.content.style === 'primary' ? 'text-white shadow-lg hover:shadow-xl' : 'border-2'}`}
                        style={{ backgroundColor: widget.content.style === 'primary' ? globalStyles.primaryColor : 'transparent', borderColor: globalStyles.primaryColor, color: widget.content.style === 'primary' ? '#fff' : globalStyles.primaryColor }}
                    >
                        {widget.content.text}
                    </a>
                </div>
            );

        case 'spacer':
            return <div style={{ height: widget.content.height || 40 }} />;

        case 'divider':
            return <hr style={{ borderColor: widget.content.color, borderStyle: widget.content.style, margin: widget.style.padding }} />;

        case 'list':
            return (
                <ul style={style} className="space-y-2">
                    {(widget.content.items || []).map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                            <span style={{ color: globalStyles.primaryColor }} className="mt-1">✓</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );

        case 'testimonial':
            return (
                <div style={style} className="bg-white p-6 rounded-xl shadow-lg max-w-xl mx-auto">
                    <p className="text-lg italic mb-4">"{widget.content.text}"</p>
                    <div className="flex items-center gap-3">
                        {widget.content.avatar ? (
                            <img src={widget.content.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl">👤</div>
                        )}
                        <div>
                            <p className="font-semibold">{widget.content.author}</p>
                            <p className="text-sm text-slate-500">{widget.content.role}</p>
                        </div>
                    </div>
                </div>
            );

        case 'video':
            if (!widget.content.url) return <div style={style} className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">Video URL belum diisi</div>;
            const videoId = widget.content.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
            return (
                <div style={style} className="aspect-video max-w-3xl mx-auto">
                    <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full rounded-lg" allowFullScreen />
                </div>
            );

        case 'features':
            return (
                <div style={style} className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {(widget.content.items || []).map((item: any, i: number) => (
                        <div key={i} className="text-center p-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3" style={{ backgroundColor: globalStyles.primaryColor + '20', color: globalStyles.primaryColor }}>
                                {item.icon}
                            </div>
                            <h4 className="font-semibold mb-2">{item.title}</h4>
                            <p className="text-sm text-slate-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            );

        case 'pricing':
            return (
                <div style={style} className="text-center">
                    {widget.content.label && <span className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-2" style={{ backgroundColor: globalStyles.secondaryColor, color: '#fff' }}>{widget.content.label}</span>}
                    {widget.content.originalPrice && <p className="text-slate-400 line-through">{widget.content.originalPrice}</p>}
                    <p className="text-4xl font-bold" style={{ color: globalStyles.primaryColor }}>{widget.content.price}</p>
                </div>
            );

        case 'faq':
            return (
                <div style={style} className="space-y-4 max-w-2xl mx-auto">
                    {(widget.content.items || []).map((item: any, i: number) => (
                        <details key={i} className="bg-slate-50 rounded-lg p-4">
                            <summary className="font-semibold cursor-pointer">{item.q}</summary>
                            <p className="mt-2 text-slate-600">{item.a}</p>
                        </details>
                    ))}
                </div>
            );

        case 'gallery':
            return (
                <div style={style} className={`grid grid-cols-${widget.content.columns || 3} gap-4 max-w-4xl mx-auto`}>
                    {(widget.content.images || []).map((img: string, i: number) => (
                        <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    ))}
                    {(!widget.content.images || widget.content.images.length === 0) && (
                        <div className="col-span-full text-center py-8 text-slate-400">Belum ada gambar</div>
                    )}
                </div>
            );

        default:
            return <div style={style}>Widget: {widget.type}</div>;
    }
};

// ==================== HIGH-CONVERTING PRODUCT PAGE COMPONENT ====================
// Default dummy reviews for demo
const DEFAULT_DUMMY_REVIEWS: Review[] = [
    {
        id: 'dummy-1',
        name: 'Andi Prasetyo',
        rating: 5,
        comment: 'Kualitas bagus banget! Bahannya adem dan nyaman dipakai. Pengiriman juga cepat, cuma 2 hari sampai. Recommended!',
        date: '2 hari lalu',
        verified: true,
        avatar: ''
    },
    {
        id: 'dummy-2',
        name: 'Siti Rahayu',
        rating: 5,
        comment: 'Sesuai ekspektasi! Ukurannya pas, warnanya juga sama persis kayak di foto. Packing rapi dan aman. Pasti order lagi!',
        date: '3 hari lalu',
        verified: true,
        avatar: ''
    },
    {
        id: 'dummy-3',
        name: 'Budi Santoso',
        rating: 4,
        comment: 'Produknya bagus, jahitannya rapi. Cuma pengiriman agak lama karena weekend. Overall puas dengan pembelian ini.',
        date: '5 hari lalu',
        verified: true,
        avatar: ''
    },
    {
        id: 'dummy-4',
        name: 'Dewi Lestari',
        rating: 5,
        comment: 'Udah kedua kalinya beli disini, selalu puas! Pelayanan CS nya juga ramah dan fast response. Top deh pokoknya!',
        date: '1 minggu lalu',
        verified: true,
        avatar: ''
    },
    {
        id: 'dummy-5',
        name: 'Rizky Firmansyah',
        rating: 5,
        comment: 'Gak nyesel beli disini. Harganya murah tapi kualitasnya premium. Bahannya tebal dan gak gampang luntur. Mantap!',
        date: '1 minggu lalu',
        verified: true,
        avatar: ''
    }
];

const HighConvertingProductPage: React.FC<{
    productData: ProductPageData;
    forms: Form[];
    linkedForm?: Form | null;
    getFormLink: (formId: string, variantParams?: Record<string, string>) => string;
    formatPrice: (price: number) => string;
}> = ({ productData, forms, linkedForm, getFormLink, formatPrice }) => {
    const urgency = productData.urgency || { countdownActive: false, countdownMinutes: 15, stockActive: false, stockInitial: 50, stockMin: 5 };
    const socialProof = productData.socialProof || { active: false, liveViewersMin: 15, liveViewersMax: 45, recentPurchaseNames: '', recentPurchaseCities: '', showOnDesktop: true, showOnTablet: true, showOnMobile: true };
    // Use saved reviews or fallback to dummy reviews
    const reviews = (productData.reviews && productData.reviews.length > 0) ? productData.reviews : DEFAULT_DUMMY_REVIEWS;
    const showReviews = productData.showReviews !== false;
    const displaySettings = productData.displaySettings || { showOnDesktop: true, showOnTablet: true, showOnMobile: true };
    const trackingSettings = productData.trackingSettings;

    // Use form's productOptions if linked form exists, otherwise fall back to product page variants
    const formProductOptions = linkedForm?.productOptions || [];
    const hasFormVariants = formProductOptions.length > 0;

    const [countdown, setCountdown] = useState(urgency.countdownMinutes * 60);
    const [currentStock, setCurrentStock] = useState(urgency.stockInitial);
    const [liveViewers, setLiveViewers] = useState(Math.floor(Math.random() * (socialProof.liveViewersMax - socialProof.liveViewersMin + 1)) + socialProof.liveViewersMin);
    const [showPopup, setShowPopup] = useState(false);
    const [popupData, setPopupData] = useState({ name: '', city: '' });
    const [selectedImage, setSelectedImage] = useState(0);
    // For form variants: key is option name (e.g., "Warna"), value is selected value (e.g., "Merah")
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [globalPixels, setGlobalPixels] = useState<GlobalPixelSettings | null>(null);
    const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Initialize selected variants from form productOptions (select first option by default)
    useEffect(() => {
        if (hasFormVariants) {
            const initialSelection: Record<string, string> = {};
            formProductOptions.forEach(opt => {
                if (opt.values.length > 0) {
                    initialSelection[opt.name] = opt.values[0];
                }
            });
            setSelectedVariants(initialSelection);
        }
    }, [hasFormVariants, linkedForm?.id]);

    // Build variant params for form URL
    const buildVariantParams = (): Record<string, string> => {
        if (!hasFormVariants) return {};
        return selectedVariants;
    };

    // Detect device type
    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            if (width < 768) setDeviceType('mobile');
            else if (width < 1024) setDeviceType('tablet');
            else setDeviceType('desktop');
        };
        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    // Check if social proof should show based on device
    const showSocialProof = socialProof.active && (
        (deviceType === 'desktop' && (socialProof.showOnDesktop ?? true)) ||
        (deviceType === 'tablet' && (socialProof.showOnTablet ?? true)) ||
        (deviceType === 'mobile' && (socialProof.showOnMobile ?? true))
    );

    // Fetch global pixels for tracking
    useEffect(() => {
        const fetchGlobalPixels = async () => {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
                if (data) setGlobalPixels(data);
            } catch (e) { console.error('Error fetching global pixels:', e); }
        };
        fetchGlobalPixels();
    }, []);

    // Fire pixel event helper for button clicks
    const firePixelEvent = (platform: string, pixelId: string, event: string) => {
        console.log(`🔥 Firing ${platform} pixel ${pixelId}: ${event}`);

        if (platform === 'meta' && typeof (window as any).fbq === 'function') {
            (window as any).fbq('trackSingle', pixelId, event, {
                content_name: productData.productName || 'Product',
                currency: 'IDR'
            });
        } else if (platform === 'google' && typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', event, { send_to: pixelId });
        } else if (platform === 'tiktok' && typeof (window as any).ttq === 'object') {
            (window as any).ttq.instance(pixelId).track(event);
        } else if (platform === 'snack' && typeof (window as any).snaptr === 'function') {
            (window as any).snaptr('track', event);
        }
    };

    // Handle CTA button click with pixel tracking
    const handleCtaClick = () => {
        if (!trackingSettings?.buttonClick || !globalPixels) return;

        trackingSettings.buttonClick.forEach(config => {
            if (!config.pixelIds?.length) return;
            const platformData = globalPixels[config.platform];
            if (!platformData?.active) return;

            config.pixelIds.forEach(pixelId => {
                config.events?.forEach(event => {
                    firePixelEvent(config.platform, pixelId, event);
                });
            });
        });
    };

    // Determine forced view mode based on display settings
    // If only mobile is enabled -> force mobile view on all devices
    // If only tablet is enabled -> force tablet view on all devices  
    // If only desktop is enabled -> force desktop view on all devices
    const forceMobileView = displaySettings.showOnMobile && !displaySettings.showOnDesktop && !displaySettings.showOnTablet;
    const forceTabletView = displaySettings.showOnTablet && !displaySettings.showOnDesktop && !displaySettings.showOnMobile;
    const forceDesktopView = displaySettings.showOnDesktop && !displaySettings.showOnMobile && !displaySettings.showOnTablet;

    const mainImage = productData.productImages?.[selectedImage] || productData.productImages?.[0];
    const accentColor = productData.accentColor || '#dc2626';

    // Countdown Timer
    useEffect(() => {
        if (!urgency.countdownActive) return;
        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : urgency.countdownMinutes * 60));
        }, 1000);
        return () => clearInterval(timer);
    }, [urgency.countdownActive, urgency.countdownMinutes]);

    // Stock countdown
    useEffect(() => {
        if (!urgency.stockActive) return;
        const timer = setInterval(() => {
            setCurrentStock(prev => {
                if (prev <= urgency.stockMin) return urgency.stockInitial;
                return prev - 1;
            });
        }, 8000 + Math.random() * 7000);
        return () => clearInterval(timer);
    }, [urgency.stockActive]);

    // Live viewers
    useEffect(() => {
        if (!socialProof.active) return;
        const timer = setInterval(() => {
            setLiveViewers(Math.floor(Math.random() * (socialProof.liveViewersMax - socialProof.liveViewersMin + 1)) + socialProof.liveViewersMin);
        }, 5000);
        return () => clearInterval(timer);
    }, [socialProof.active]);

    // Recent purchase popup
    useEffect(() => {
        if (!socialProof.active) return;
        const names = socialProof.recentPurchaseNames.split('\n').filter(n => n.trim());
        const cities = socialProof.recentPurchaseCities.split('\n').filter(c => c.trim());
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
    }, [socialProof.active]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const savings = (productData.productComparePrice || 0) - (productData.productPrice || 0);
    const discountPercent = productData.productComparePrice ? Math.round((1 - (productData.productPrice || 0) / productData.productComparePrice) * 100) : 0;

    // Wrapper for forcing mobile view on desktop
    const mobileViewWrapper = forceMobileView ? (
        <div className="min-h-screen flex justify-center" style={{ backgroundColor: '#f1f5f9' }}>
            <div className="w-full max-w-[430px] min-h-screen shadow-2xl" style={{ backgroundColor: productData.backgroundColor }}>
                {renderContent()}
            </div>
        </div>
    ) : null;

    function renderContent() {
        return (
            <>
                {/* Pixel Tracking Script */}
                {trackingSettings?.pageView && globalPixels && (
                    <LandingPagePixelScript
                        pageViewConfigs={trackingSettings.pageView}
                        globalPixels={globalPixels}
                        productName={productData.productName}
                    />
                )}

                {/* Urgency Banner */}
                {urgency.countdownActive && (
                    <div className="text-white text-center py-3 px-4" style={{ backgroundColor: accentColor }}>
                        <p className="font-bold text-sm animate-pulse">🔥 PROMO TERBATAS! Berakhir dalam <span className="font-mono">{formatTime(countdown)}</span></p>
                    </div>
                )}

                {/* Recent Purchase Popup */}
                {showPopup && showSocialProof && (
                    <div className={`fixed ${forceMobileView ? 'bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px]' : 'bottom-24 left-4 md:bottom-8'} z-50 animate-slide-up`}>
                        <div className="bg-white rounded-xl shadow-2xl p-4 border-l-4 border border-slate-100" style={{ borderLeftColor: accentColor }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {popupData.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                        <span className="font-bold">{popupData.name}</span> dari <span className="text-slate-600">{popupData.city}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">Baru saja membeli produk ini 🛒</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className={forceMobileView ? 'px-4 py-6' : 'max-w-6xl mx-auto px-4 py-6'}>
                    <div className={forceMobileView ? 'space-y-6' : 'grid md:grid-cols-2 gap-8'}>
                        {/* Left - Images */}
                        <div>
                            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                {mainImage ? (
                                    <img src={mainImage.url} alt={productData.productName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ImageIcon className="w-24 h-24" />
                                    </div>
                                )}
                                {discountPercent > 0 && (
                                    <div className="absolute top-4 left-4 text-white text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: accentColor }}>
                                        -{discountPercent}%
                                    </div>
                                )}
                            </div>
                            {/* Thumbnails */}
                            {productData.productImages && productData.productImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {productData.productImages.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-slate-900 scale-105' : 'border-slate-200'}`}
                                        >
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right - Product Info */}
                        <div className="space-y-4">
                            {/* Live viewers */}
                            {showSocialProof && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="flex items-center gap-1 text-green-600">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="font-medium">{liveViewers} orang</span>
                                    </span>
                                    <span className="text-slate-500">sedang melihat produk ini</span>
                                </div>
                            )}

                            <h1 className="text-2xl font-bold text-slate-900">{productData.productName}</h1>

                            {/* Rating & Sold */}
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-400">★★★★★</span>
                                    <span className="text-slate-600">(4.9)</span>
                                </div>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-600">{(productData.totalSold || 0).toLocaleString()}+ Terjual</span>
                            </div>

                            {/* Price */}
                            <div className="bg-red-50 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl font-bold" style={{ color: accentColor }}>{formatPrice(productData.productPrice || 0)}</span>
                                    {productData.productComparePrice && (
                                        <span className="text-lg text-slate-400 line-through">{formatPrice(productData.productComparePrice)}</span>
                                    )}
                                </div>
                                {savings > 0 && (
                                    <p className="text-sm text-green-600 mt-1">Hemat {formatPrice(savings)}!</p>
                                )}
                            </div>

                            {/* Stock Warning */}
                            {urgency.stockActive && (
                                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
                                    <span className="text-xl">⚠️</span>
                                    <span className="text-sm font-medium">Stok terbatas! Hanya tersisa <span className="font-bold">{currentStock}</span> unit</span>
                                </div>
                            )}

                            {/* Variants from Form (if linked form has productOptions) */}
                            {hasFormVariants && (
                                <div className="space-y-4">
                                    {formProductOptions.map(option => (
                                        <div key={option.id}>
                                            <p className="text-sm font-medium text-slate-700 mb-2">{option.name}:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {option.values.map((value, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedVariants(prev => ({ ...prev, [option.name]: value }))}
                                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedVariants[option.name] === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        {value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fallback: Local Variants (if no linked form) */}
                            {!hasFormVariants && productData.variants && productData.variants.length > 0 && (
                                <div className="space-y-4">
                                    {productData.variants.map(variant => (
                                        <div key={variant.id}>
                                            <p className="text-sm font-medium text-slate-700 mb-2">{variant.name}:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.options.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt.label }))}
                                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedVariants[variant.name] === opt.label ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        {variant.type === 'color' && opt.colorHex && (
                                                            <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: opt.colorHex }}></span>
                                                        )}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            <div className="prose prose-sm max-w-none text-slate-600">
                                <p className="whitespace-pre-wrap">{productData.productDescription}</p>
                            </div>

                            {/* CTA Button - Desktop */}
                            <div className={forceMobileView ? 'hidden' : 'hidden md:block'}>
                                <a
                                    href={productData.ctaFormId ? getFormLink(productData.ctaFormId, buildVariantParams()) : '#'}
                                    onClick={handleCtaClick}
                                    className="block w-full py-4 rounded-xl text-white font-bold text-lg text-center transition-transform hover:scale-[1.02]"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {productData.ctaButtonText || '🛒 BELI SEKARANG'}
                                </a>
                                {productData.ctaSubtext && (
                                    <p className="text-center text-sm text-slate-500 mt-2">{productData.ctaSubtext}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                {productData.trustBadges && productData.trustBadges.length > 0 && (
                    <div className={forceMobileView ? 'px-4 py-8 bg-slate-50' : 'max-w-6xl mx-auto px-4 py-8 bg-slate-50'}>
                        <div className={forceMobileView ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-2 md:grid-cols-4 gap-6'}>
                            {productData.trustBadges.map(badge => (
                                <div key={badge.id} className="text-center">
                                    <div className="text-3xl mb-2">{badge.icon}</div>
                                    <h4 className="font-semibold text-sm text-slate-900">{badge.title}</h4>
                                    <p className="text-xs text-slate-500">{badge.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reviews */}
                {showReviews && reviews.length > 0 && (
                    <div className={forceMobileView ? 'px-4 py-8' : 'max-w-6xl mx-auto px-4 py-8'}>
                        <h2 className="text-xl font-bold mb-6">Ulasan Pelanggan</h2>
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border">
                                    <div className="flex items-start gap-3">
                                        {review.avatar ? (
                                            <img src={review.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                {review.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900">{review.name}</span>
                                                {review.verified && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">✓ Terverifikasi</span>}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-yellow-400 my-1">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </div>
                                            <p className="text-sm text-slate-600">{review.comment}</p>
                                            {review.photo && (
                                                <img src={review.photo} alt="Review" className="mt-2 w-24 h-24 rounded-lg object-cover" />
                                            )}
                                            <p className="text-xs text-slate-400 mt-2">{review.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sticky Mobile CTA */}
                <div className={`fixed bottom-0 ${forceMobileView ? 'left-1/2 -translate-x-1/2 w-full max-w-[430px]' : 'left-0 right-0'} bg-white border-t shadow-lg p-4 ${forceMobileView ? '' : 'md:hidden'} z-40`}>
                    <div className="flex items-center gap-4">
                        <div>
                            {productData.productComparePrice && <p className="text-xs text-slate-500 line-through">{formatPrice(productData.productComparePrice)}</p>}
                            <p className="font-bold text-lg" style={{ color: accentColor }}>{formatPrice(productData.productPrice || 0)}</p>
                        </div>
                        <a
                            href={productData.ctaFormId ? getFormLink(productData.ctaFormId, buildVariantParams()) : '#'}
                            onClick={handleCtaClick}
                            className="flex-1 py-3 rounded-lg text-white font-bold text-center"
                            style={{ backgroundColor: accentColor }}
                        >
                            {productData.ctaButtonText || '🛒 BELI SEKARANG'}
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <footer className={`py-8 bg-slate-900 text-slate-400 text-center mt-8 ${forceMobileView ? 'mb-16' : 'mb-16 md:mb-0'}`}>
                    <p>{productData.footerText}</p>
                </footer>

                <style>{`
                    @keyframes slide-up {
                        from { transform: translateY(100%); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up { animation: slide-up 0.3s ease-out; }
                `}</style>
            </>
        );
    }

    // Return mobile view wrapper or normal view
    if (forceMobileView) {
        return mobileViewWrapper;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: productData.backgroundColor }}>
            {renderContent()}
        </div>
    );
};

export default LandingPageViewer;
