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

interface ProductItem {
    id: string;
    formId: string;
    productName: string;
    productImage: string;
    productPrice: number;
    isVisible: boolean;
}

interface ProductPageData {
    id: string;
    title: string;
    slug: string;
    type: 'product';
    headerImage: string;
    headerTitle: string;
    headerSubtitle: string;
    products: ProductItem[];
    gridColumns: 2 | 3 | 4;
    showPrice: boolean;
    buttonText: string;
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
            const { data: pageData, error } = await supabase
                .from('landing_pages')
                .select('*')
                .eq('slug', slug)
                .eq('isPublished', true)
                .single();

            if (error) throw error;
            if (!pageData) {
                setError('Halaman tidak ditemukan');
                return;
            }
            setData(pageData as LandingPageData);
        } catch (error) {
            console.error('Error fetching page:', error);
            setError('Halaman tidak ditemukan atau belum dipublikasikan');
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
        const visibleProducts = productData.products.filter(p => p.isVisible);

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

export default LandingPageViewer;
