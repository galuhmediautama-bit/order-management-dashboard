import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../firebase';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import ImageIcon from '../components/icons/ImageIcon';

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
}

interface UrgencySettings {
    countdownActive: boolean;
    countdownMinutes: number;
    stockActive: boolean;
    stockInitial: number;
    stockMin: number;
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
    accentColor?: string;
    backgroundColor: string;
    footerText: string;
    isPublished: boolean;
}

type LandingPageData = SalesPageData | ProductPageData;

interface Form {
    id: string;
    title: string;
    slug?: string;
}

const LandingPageViewer: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [data, setData] = useState<LandingPageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forms, setForms] = useState<Form[]>([]);

    useEffect(() => {
        if (slug) {
            fetchPage();
            fetchForms();
        }
    }, [slug]);

    const fetchPage = async () => {
        try {
            // First try to get published page
            let { data: pageData, error } = await supabase
                .from('landing_pages')
                .select('*')
                .eq('slug', slug)
                .eq('isPublished', true)
                .maybeSingle();

            // If not found and user might be previewing, try without isPublished filter
            if (!pageData) {
                const result = await supabase
                    .from('landing_pages')
                    .select('*')
                    .eq('slug', slug)
                    .maybeSingle();
                
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
                return;
            }
            setData(pageData as LandingPageData);
        } catch (error) {
            console.error('Error fetching page:', error);
            setError('Halaman tidak ditemukan');
        } finally {
            setLoading(false);
        }
    };

    const fetchForms = async () => {
        const { data: formsData } = await supabase
            .from('forms')
            .select('id, title, slug');
        setForms(formsData || []);
    };

    const getFormLink = (formId: string) => {
        const form = forms.find(f => f.id === formId);
        if (form) {
            return `/#/f/${form.slug || form.id}`;
        }
        return `/#/f/${formId}`;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-700 mb-2">404</h1>
                    <p className="text-slate-500">{error || 'Halaman tidak ditemukan'}</p>
                    <a href="/" className="mt-4 inline-block text-indigo-600 hover:underline">Kembali ke beranda</a>
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

        // New format with sections
        if (salesData.sections && salesData.sections.length > 0) {
            return (
                <div className="min-h-screen" style={{ fontFamily: globalStyles.fontFamily, backgroundColor: globalStyles.backgroundColor }}>
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
                            <div className="max-w-6xl mx-auto">
                                {section.widgets.map(widget => (
                                    <WidgetRenderer
                                        key={widget.id}
                                        widget={widget}
                                        globalStyles={globalStyles}
                                        forms={forms}
                                        ctaFormId={salesData.ctaFormId}
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
            return <HighConvertingProductPage productData={productData} forms={forms} getFormLink={getFormLink} formatPrice={formatPrice} />;
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
}> = ({ widget, globalStyles, forms, ctaFormId }) => {
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
const HighConvertingProductPage: React.FC<{
    productData: ProductPageData;
    forms: Form[];
    getFormLink: (formId: string) => string;
    formatPrice: (price: number) => string;
}> = ({ productData, forms, getFormLink, formatPrice }) => {
    const urgency = productData.urgency || { countdownActive: false, countdownMinutes: 15, stockActive: false, stockInitial: 50, stockMin: 5 };
    const socialProof = productData.socialProof || { active: false, liveViewersMin: 15, liveViewersMax: 45, recentPurchaseNames: '', recentPurchaseCities: '' };
    const reviews = productData.reviews || [];
    const showReviews = productData.showReviews !== false;

    const [countdown, setCountdown] = useState(urgency.countdownMinutes * 60);
    const [currentStock, setCurrentStock] = useState(urgency.stockInitial);
    const [liveViewers, setLiveViewers] = useState(Math.floor(Math.random() * (socialProof.liveViewersMax - socialProof.liveViewersMin + 1)) + socialProof.liveViewersMin);
    const [showPopup, setShowPopup] = useState(false);
    const [popupData, setPopupData] = useState({ name: '', city: '' });
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

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

    return (
        <div className="min-h-screen" style={{ backgroundColor: productData.backgroundColor }}>
            {/* Urgency Banner */}
            {urgency.countdownActive && (
                <div className="text-white text-center py-3 px-4" style={{ backgroundColor: accentColor }}>
                    <p className="font-bold text-sm animate-pulse">🔥 PROMO TERBATAS! Berakhir dalam <span className="font-mono">{formatTime(countdown)}</span></p>
                </div>
            )}

            {/* Recent Purchase Popup */}
            {showPopup && socialProof.active && (
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
                                <img src={mainImage.url} alt={productData.productName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon className="w-24 h-24" />
                                </div>
                            )}
                            {/* Live Viewers Badge */}
                            {socialProof.active && (
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
                        {productData.productImages && productData.productImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {productData.productImages.map((img, idx) => (
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
                            <span className="text-sm text-slate-500">({(productData.totalSold || 0).toLocaleString()} terjual)</span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{productData.productName}</h1>

                        {/* Price */}
                        <div className="mb-4">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold" style={{ color: accentColor }}>{formatPrice(productData.productPrice || 0)}</span>
                                {productData.productComparePrice && productData.productComparePrice > (productData.productPrice || 0) && (
                                    <span className="text-xl text-slate-400 line-through">{formatPrice(productData.productComparePrice)}</span>
                                )}
                            </div>
                            {savings > 0 && (
                                <p className="text-green-600 font-medium mt-1">💰 Hemat {formatPrice(savings)}!</p>
                            )}
                        </div>

                        {/* Stock Warning */}
                        {urgency.stockActive && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-yellow-800 font-medium flex items-center gap-2">
                                    <span className="animate-bounce">⚠️</span>
                                    Stok terbatas! Hanya tersisa <span className="font-bold text-red-600">{currentStock}</span> item
                                </p>
                                <div className="mt-2 bg-yellow-200 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(currentStock / urgency.stockInitial) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        {/* Variants */}
                        {productData.variants?.map(variant => (
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
                            href={productData.ctaFormId ? getFormLink(productData.ctaFormId) : '#'}
                            className="block w-full py-4 rounded-xl text-white font-bold text-lg text-center shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] mb-2"
                            style={{ backgroundColor: accentColor }}
                        >
                            {productData.ctaButtonText || '🛒 BELI SEKARANG'}
                        </a>
                        {productData.ctaSubtext && (
                            <p className="text-center text-sm text-slate-500 mb-4">{productData.ctaSubtext}</p>
                        )}

                        {/* Trust Badges */}
                        {productData.trustBadges && productData.trustBadges.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                {productData.trustBadges.map(badge => (
                                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <span className="text-2xl">{badge.icon}</span>
                                        <div>
                                            <p className="font-medium text-slate-900 text-sm">{badge.title}</p>
                                            <p className="text-xs text-slate-500">{badge.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {productData.productDescription && (
                    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold mb-4">📝 Deskripsi Produk</h2>
                        <p className="text-slate-600 whitespace-pre-wrap">{productData.productDescription}</p>
                    </div>
                )}

                {/* Reviews */}
                {showReviews && reviews.length > 0 && (
                    <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">⭐ Ulasan Pembeli</h2>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(n => <span key={n} className="text-yellow-400 text-xl">★</span>)}
                                <span className="ml-2 text-slate-500">({reviews.length} ulasan)</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {reviews.map(review => (
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
                        {productData.productComparePrice && <p className="text-xs text-slate-500 line-through">{formatPrice(productData.productComparePrice)}</p>}
                        <p className="font-bold text-lg" style={{ color: accentColor }}>{formatPrice(productData.productPrice || 0)}</p>
                    </div>
                    <a
                        href={productData.ctaFormId ? getFormLink(productData.ctaFormId) : '#'}
                        className="flex-1 py-3 rounded-lg text-white font-bold text-center"
                        style={{ backgroundColor: accentColor }}
                    >
                        {productData.ctaButtonText || '🛒 BELI SEKARANG'}
                    </a>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 bg-slate-900 text-slate-400 text-center mt-8 mb-16 md:mb-0">
                <p>{productData.footerText}</p>
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

export default LandingPageViewer;
