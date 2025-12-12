import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import CheckIcon from '../components/icons/CheckIcon';
import UploadIcon from '../components/icons/UploadIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import ArrowLeftIcon from '../components/icons/ArrowLeftIcon';

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'heading' | 'list' | 'cta';
  content: string;
  imageUrl?: string;
  alignment?: 'left' | 'center' | 'right';
}

interface SalesPageData {
  id?: string;
  title: string;
  slug: string;
  type: 'sales';
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  contentBlocks: ContentBlock[];
  ctaButtonText: string;
  ctaFormId: string; // Link to formulir
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

const defaultData: SalesPageData = {
  title: '',
  slug: '',
  type: 'sales',
  heroImage: '',
  heroTitle: 'Judul Produk Anda',
  heroSubtitle: 'Deskripsi singkat yang menarik tentang produk',
  contentBlocks: [
    { id: '1', type: 'heading', content: 'Mengapa Memilih Produk Ini?', alignment: 'center' },
    { id: '2', type: 'text', content: 'Jelaskan keunggulan dan manfaat produk Anda di sini. Ceritakan bagaimana produk ini dapat membantu pelanggan menyelesaikan masalah mereka.', alignment: 'left' },
  ],
  ctaButtonText: 'Pesan Sekarang',
  ctaFormId: '',
  footerText: '© 2025 All rights reserved.',
  isPublished: false,
};

const SalesPageEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<SalesPageData>(defaultData);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'content' | 'cta'>('hero');

  useEffect(() => {
    fetchForms();
    if (id && id !== 'baru') {
      fetchPage();
    }
  }, [id]);

  const fetchForms = async () => {
    const { data: formsData } = await supabase
      .from('forms')
      .select('id, title, slug')
      .order('title');
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
        setData(pageData as SalesPageData);
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

      showToast('Sales page berhasil disimpan!', 'success');
      
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage' | 'blockImage', blockId?: string) => {
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

      if (field === 'heroImage') {
        setData(prev => ({ ...prev, heroImage: publicUrl }));
      } else if (blockId) {
        setData(prev => ({
          ...prev,
          contentBlocks: prev.contentBlocks.map(b =>
            b.id === blockId ? { ...b, imageUrl: publicUrl } : b
          )
        }));
      }
      showToast('Gambar berhasil diupload!', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Gagal upload gambar', 'error');
    }
  };

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'heading' ? 'Judul Baru' : type === 'list' ? '• Item 1\n• Item 2\n• Item 3' : 'Teks konten baru...',
      alignment: 'left',
    };
    setData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }));
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const removeBlock = (id: string) => {
    setData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(b => b.id !== id)
    }));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    setData(prev => {
      const blocks = [...prev.contentBlocks];
      const idx = blocks.findIndex(b => b.id === id);
      if (direction === 'up' && idx > 0) {
        [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
      } else if (direction === 'down' && idx < blocks.length - 1) {
        [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
      }
      return { ...prev, contentBlocks: blocks };
    });
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
    const selectedForm = forms.find(f => f.id === data.ctaFormId);
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Preview Bar */}
        <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white px-4 py-2 flex justify-between items-center z-50">
          <span className="text-sm font-medium">Preview: {data.title || 'Sales Page'}</span>
          <button
            onClick={() => setPreviewMode(false)}
            className="px-3 py-1 bg-white text-purple-600 rounded text-sm font-medium hover:bg-purple-50"
          >
            Kembali ke Editor
          </button>
        </div>

        {/* Hero */}
        <section className="pt-16 min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            {data.heroImage && (
              <img src={data.heroImage} alt="Hero" className="w-48 h-48 mx-auto mb-6 rounded-2xl shadow-xl object-cover" />
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{data.heroTitle}</h1>
            <p className="text-xl text-purple-100 mb-8">{data.heroSubtitle}</p>
          </div>
        </section>

        {/* Content Blocks */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {data.contentBlocks.map(block => (
              <div key={block.id} className={`text-${block.alignment || 'left'}`}>
                {block.type === 'heading' && (
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{block.content}</h2>
                )}
                {block.type === 'text' && (
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{block.content}</p>
                )}
                {block.type === 'image' && block.imageUrl && (
                  <img src={block.imageUrl} alt="" className="rounded-xl shadow-lg max-w-full mx-auto" />
                )}
                {block.type === 'list' && (
                  <ul className="space-y-2 text-lg text-slate-600 dark:text-slate-300">
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
            {selectedForm ? (
              <a
                href={`/#/f/${selectedForm.slug || selectedForm.id}`}
                className="inline-block px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors text-lg shadow-lg"
              >
                {data.ctaButtonText}
              </a>
            ) : (
              <button className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl cursor-not-allowed">
                {data.ctaButtonText} (Pilih formulir)
              </button>
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <ShoppingCartIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {id && id !== 'baru' ? 'Edit Sales Page' : 'Buat Sales Page'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Halaman penjualan dengan penjelasan detail</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
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
              onChange={e => setData(prev => ({ ...prev, title: e.target.value, slug: prev.slug || generateSlug(e.target.value) }))}
              placeholder="Nama Sales Page"
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
        {(['hero', 'content', 'cta'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {tab === 'hero' ? 'Hero Section' : tab === 'content' ? 'Konten' : 'Tombol Beli'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar Produk</label>
              <div className="flex items-center gap-4">
                {data.heroImage && (
                  <img src={data.heroImage} alt="Hero" className="w-24 h-24 rounded-lg object-cover" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                  <UploadIcon className="w-4 h-4" />
                  <span className="text-sm">Upload Gambar</span>
                  <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'heroImage')} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Hero</label>
              <input
                type="text"
                value={data.heroTitle}
                onChange={e => setData(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle Hero</label>
              <textarea
                value={data.heroSubtitle}
                onChange={e => setData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            {data.contentBlocks.map((block, idx) => (
              <div key={block.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-slate-500 uppercase">{block.type}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30">
                      <ChevronDownIcon className="w-4 h-4 rotate-180" />
                    </button>
                    <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === data.contentBlocks.length - 1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30">
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeBlock(block.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {block.type === 'image' ? (
                  <div className="flex items-center gap-4">
                    {block.imageUrl && <img src={block.imageUrl} alt="" className="w-20 h-20 rounded object-cover" />}
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-600 rounded cursor-pointer">
                      <UploadIcon className="w-4 h-4" />
                      <span className="text-sm">Upload</span>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'blockImage', block.id)} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <textarea
                    value={block.content}
                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                    rows={block.type === 'heading' ? 1 : 3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            ))}

            {/* Add Block Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-600">
              <span className="text-sm text-slate-500 w-full mb-2">Tambah blok:</span>
              <button onClick={() => addBlock('heading')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600">+ Judul</button>
              <button onClick={() => addBlock('text')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600">+ Teks</button>
              <button onClick={() => addBlock('image')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600">+ Gambar</button>
              <button onClick={() => addBlock('list')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600">+ Daftar</button>
            </div>
          </div>
        )}

        {activeTab === 'cta' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Tombol Beli</label>
              <input
                type="text"
                value={data.ctaButtonText}
                onChange={e => setData(prev => ({ ...prev, ctaButtonText: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link ke Formulir *</label>
              <select
                value={data.ctaFormId}
                onChange={e => setData(prev => ({ ...prev, ctaFormId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">-- Pilih Formulir --</option>
                {forms.map(form => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Tombol beli akan mengarah ke formulir pemesanan yang dipilih</p>
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

export default SalesPageEditor;
