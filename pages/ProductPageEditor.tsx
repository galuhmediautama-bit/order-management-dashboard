import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import ShoppingBagIcon from '../components/icons/ShoppingBagIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import CheckIcon from '../components/icons/CheckIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';

interface ProductItem {
  id: string;
  formId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  isVisible: boolean;
}

interface ProductPageData {
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface Form {
  id: string;
  title: string;
  slug?: string;
  variants?: Array<{
    name: string;
    price: number;
    image?: string;
  }>;
}

const defaultData: ProductPageData = {
  title: '',
  slug: '',
  type: 'product',
  headerImage: '',
  headerTitle: 'Katalog Produk',
  headerSubtitle: 'Temukan produk favorit Anda',
  products: [],
  gridColumns: 3,
  showPrice: true,
  buttonText: 'Beli Sekarang',
  backgroundColor: '#f8fafc',
  footerText: '© 2025 All rights reserved.',
  isPublished: false,
};

const ProductPageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<ProductPageData>(defaultData);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'products' | 'settings'>('header');
  const [showAddProduct, setShowAddProduct] = useState(false);

  useEffect(() => {
    fetchForms();
    if (id && id !== 'baru') {
      fetchPage();
    }
  }, [id]);

  const fetchForms = async () => {
    const { data: formsData, error } = await supabase
      .from('forms')
      .select('id, title, slug, variants')
      .order('title');
    
    if (error) {
      console.error('Error fetching forms:', error);
    }
    console.log('Forms loaded:', formsData?.length || 0);
    setForms(formsData || []);
  };

  const fetchPage = async () => {
    try {
      const { data: pageData, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (pageData) {
        setData(pageData as ProductPageData);
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      showToast('Gagal memuat data halaman', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    if (!data.title.trim()) {
      showToast('Judul halaman wajib diisi', 'error');
      return;
    }

    setSaving(true);
    try {
      const slug = data.slug || generateSlug(data.title);
      const payload = {
        ...data,
        slug,
        updatedAt: new Date().toISOString(),
        ...(id && id !== 'baru' ? {} : { createdAt: new Date().toISOString() }),
      };

      let result;
      if (id && id !== 'baru') {
        result = await supabase
          .from('landing_pages')
          .update(payload)
          .eq('id', id);
      } else {
        result = await supabase
          .from('landing_pages')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      showToast('Product page berhasil disimpan!', 'success');
      
      if (!id || id === 'baru') {
        navigate('/landing-page');
      }
    } catch (error) {
      console.error('Error saving page:', error);
      showToast('Gagal menyimpan halaman', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'headerImage' | 'productImage', productId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `landing/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      if (field === 'headerImage') {
        setData(prev => ({ ...prev, headerImage: publicUrl }));
      } else if (productId) {
        setData(prev => ({
          ...prev,
          products: prev.products.map(p =>
            p.id === productId ? { ...p, productImage: publicUrl } : p
          )
        }));
      }
      showToast('Gambar berhasil diupload!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Gagal upload gambar', 'error');
    }
  };

  const addProduct = (form: Form) => {
    const firstVariant = form.variants?.[0];
    const newProduct: ProductItem = {
      id: Date.now().toString(),
      formId: form.id,
      productName: form.title,
      productImage: firstVariant?.image || '',
      productPrice: firstVariant?.price || 0,
      isVisible: true,
    };
    setData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
    setShowAddProduct(false);
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const removeProduct = (id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Preview Mode
  if (previewMode) {
    const visibleProducts = data.products.filter(p => p.isVisible);
    return (
      <div className="min-h-screen" style={{ backgroundColor: data.backgroundColor }}>
        {/* Preview Bar */}
        <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white px-4 py-2 flex justify-between items-center z-50">
          <span className="text-sm font-medium">Preview: {data.title || 'Product Page'}</span>
          <button
            onClick={() => setPreviewMode(false)}
            className="px-3 py-1 bg-white text-emerald-600 rounded text-sm font-medium hover:bg-emerald-50"
          >
            Kembali ke Editor
          </button>
        </div>

        {/* Header */}
        <header className="pt-16 pb-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {data.headerImage && (
              <img src={data.headerImage} alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-4 border-white/30" />
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.headerTitle}</h1>
            <p className="text-emerald-100">{data.headerSubtitle}</p>
          </div>
        </header>

        {/* Product Grid */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className={`grid gap-6 ${data.gridColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' : data.gridColumns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {visibleProducts.map(product => {
                const form = forms.find(f => f.id === product.formId);
                return (
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
                      {data.showPrice && (
                        <p className="text-emerald-600 font-bold mb-3">{formatPrice(product.productPrice)}</p>
                      )}
                      <a
                        href={`/#/f/${form?.slug || form?.id}`}
                        className="block w-full py-2 bg-emerald-600 text-white text-center rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                      >
                        {data.buttonText}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleProducts.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada produk ditampilkan</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-slate-900 text-slate-400 text-center">
          <p>{data.footerText}</p>
        </footer>
      </div>
    );
  }

  // Editor Mode
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/landing-page')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <ShoppingBagIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {id && id !== 'baru' ? 'Edit Product Page' : 'Buat Product Page'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Katalog produk dengan tampilan grid</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckIcon className="w-4 h-4" />
            )}
            Simpan
          </button>
        </div>
      </div>

      {/* Title & Slug */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Halaman *</label>
            <input
              type="text"
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value, slug: generateSlug(e.target.value) }))}
              placeholder="Nama Product Page"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug URL</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">/lp/</span>
              <input
                type="text"
                value={data.slug}
                onChange={e => setData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                placeholder="slug-url"
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.isPublished}
              onChange={e => setData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">Publikasikan halaman ini</span>
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {(['header', 'products', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {tab === 'header' ? 'Header' : tab === 'products' ? 'Produk' : 'Pengaturan'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'header' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo / Gambar Header</label>
              <div className="flex items-center gap-4">
                {data.headerImage && (
                  <img src={data.headerImage} alt="Header" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Upload Gambar</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'headerImage')} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Header</label>
              <input
                type="text"
                value={data.headerTitle}
                onChange={e => setData(prev => ({ ...prev, headerTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle Header</label>
              <input
                type="text"
                value={data.headerSubtitle}
                onChange={e => setData(prev => ({ ...prev, headerSubtitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-4">
            {data.products.map((product, idx) => (
              <div key={product.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0">
                    {product.productImage ? (
                      <img src={product.productImage} alt="" className="w-full h-full rounded object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                        <ShoppingBagIcon className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={product.productName}
                      onChange={e => updateProduct(product.id, { productName: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white mb-2"
                      placeholder="Nama Produk"
                    />
                    <input
                      type="number"
                      value={product.productPrice}
                      onChange={e => updateProduct(product.id, { productPrice: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Harga"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={product.isVisible}
                        onChange={e => updateProduct(product.id, { isVisible: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-xs">Tampil</span>
                    </label>
                    <label className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded cursor-pointer text-xs">
                      <UploadIcon className="w-3 h-3" />
                      Foto
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'productImage', product.id)} className="hidden" />
                    </label>
                    <button onClick={() => removeProduct(product.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Product Button */}
            <button
              onClick={() => setShowAddProduct(true)}
              className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Produk dari Formulir
            </button>

            {/* Add Product Modal */}
            {showAddProduct && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[70vh] overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold">Pilih Formulir untuk Ditambahkan</h3>
                    <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
                    {forms.length === 0 ? (
                      <p className="text-center text-slate-500 py-4">Belum ada formulir. Buat formulir terlebih dahulu di menu Formulir.</p>
                    ) : forms.filter(f => !data.products.some(p => p.formId === f.id)).length === 0 ? (
                      <p className="text-center text-slate-500 py-4">Semua formulir ({forms.length}) sudah ditambahkan</p>
                    ) : (
                      forms.filter(f => !data.products.some(p => p.formId === f.id)).map(form => (
                        <button
                          key={form.id}
                          onClick={() => addProduct(form)}
                          className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors"
                        >
                          <span className="font-medium">{form.title}</span>
                          {form.variants && form.variants.length > 0 && (
                            <span className="text-sm text-slate-500 ml-2">({form.variants.length} varian)</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah Kolom Grid</label>
              <select
                value={data.gridColumns}
                onChange={e => setData(prev => ({ ...prev, gridColumns: parseInt(e.target.value) as 2 | 3 | 4 }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={2}>2 Kolom</option>
                <option value={3}>3 Kolom</option>
                <option value={4}>4 Kolom</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPrice"
                checked={data.showPrice}
                onChange={e => setData(prev => ({ ...prev, showPrice: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="showPrice" className="text-sm text-slate-700 dark:text-slate-300">Tampilkan harga produk</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Tombol Beli</label>
              <input
                type="text"
                value={data.buttonText}
                onChange={e => setData(prev => ({ ...prev, buttonText: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warna Latar Belakang</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={data.backgroundColor}
                  onChange={e => setData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={data.backgroundColor}
                  onChange={e => setData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Footer</label>
              <input
                type="text"
                value={data.footerText}
                onChange={e => setData(prev => ({ ...prev, footerText: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPageEditor;
