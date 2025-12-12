import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../firebase';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'list' | 'cta';
  content: string;
  imageUrl?: string;
  alignment?: 'left' | 'center' | 'right';
}

interface SalesPageData {
  id: string;
  title: string;
  slug: string;
  type: 'sales';
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  contentBlocks: ContentBlock[];
  ctaButtonText: string;
  ctaFormId: string;
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

  // Render Sales Page
  if (data.type === 'sales') {
    const salesData = data as SalesPageData;
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
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {salesData.contentBlocks.map(block => (
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
                    {block.content.split('\n').map((item, i) => (
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

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">Siap untuk Memesan?</h2>
            {salesData.ctaFormId ? (
              <a
                href={getFormLink(salesData.ctaFormId)}
                className="inline-block px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors text-lg shadow-lg"
              >
                {salesData.ctaButtonText}
              </a>
            ) : (
              <span className="inline-block px-8 py-4 bg-white/20 text-white font-bold rounded-xl cursor-not-allowed">
                {salesData.ctaButtonText}
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

export default LandingPageViewer;
