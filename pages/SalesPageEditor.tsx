import React, { useState, useEffect, useRef } from 'react';
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
import PencilIcon from '../components/icons/PencilIcon';
import ImageIcon from '../components/icons/ImageIcon';
import AlignLeftIcon from '../components/icons/AlignLeftIcon';
import AlignCenterIcon from '../components/icons/AlignCenterIcon';
import AlignRightIcon from '../components/icons/AlignRightIcon';

// Widget Types
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
  id?: string;
  title: string;
  slug: string;
  type: 'sales';
  sections: Section[];
  ctaFormId: string;
  globalStyles: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    backgroundColor: string;
  };
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

const widgetList: { type: WidgetType; icon: string; label: string }[] = [
  { type: 'heading', icon: 'H', label: 'Heading' },
  { type: 'text', icon: 'T', label: 'Text' },
  { type: 'image', icon: '🖼', label: 'Image' },
  { type: 'button', icon: '▢', label: 'Button' },
  { type: 'spacer', icon: '↕', label: 'Spacer' },
  { type: 'divider', icon: '—', label: 'Divider' },
  { type: 'list', icon: '☰', label: 'List' },
  { type: 'testimonial', icon: '💬', label: 'Testimonial' },
  { type: 'video', icon: '▶', label: 'Video' },
  { type: 'features', icon: '✓', label: 'Features' },
  { type: 'pricing', icon: '💰', label: 'Pricing' },
  { type: 'faq', icon: '?', label: 'FAQ' },
  { type: 'gallery', icon: '📷', label: 'Gallery' },
];

const defaultWidget = (type: WidgetType): Widget => {
  const base = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    type,
    style: { padding: '16px', alignment: 'center' as const },
  };

  switch (type) {
    case 'heading':
      return { ...base, content: { text: 'Judul Menarik Anda', level: 'h2' } };
    case 'text':
      return { ...base, content: { text: 'Tuliskan paragraf yang menjelaskan produk atau layanan Anda dengan detail yang menarik.' }, style: { ...base.style, alignment: 'left' } };
    case 'image':
      return { ...base, content: { url: '', alt: 'Image', caption: '' } };
    case 'button':
      return { ...base, content: { text: 'Beli Sekarang', link: '', style: 'primary' } };
    case 'spacer':
      return { ...base, content: { height: 40 } };
    case 'divider':
      return { ...base, content: { style: 'solid', color: '#e5e7eb' } };
    case 'list':
      return { ...base, content: { items: ['Keunggulan pertama', 'Keunggulan kedua', 'Keunggulan ketiga'], icon: 'check' }, style: { ...base.style, alignment: 'left' } };
    case 'testimonial':
      return { ...base, content: { text: 'Produk ini sangat membantu saya!', author: 'John Doe', role: 'Customer', avatar: '' } };
    case 'video':
      return { ...base, content: { url: '', type: 'youtube' } };
    case 'features':
      return { ...base, content: { items: [{ icon: '✓', title: 'Feature 1', desc: 'Deskripsi feature' }, { icon: '✓', title: 'Feature 2', desc: 'Deskripsi feature' }] } };
    case 'pricing':
      return { ...base, content: { price: 'Rp 299.000', originalPrice: 'Rp 599.000', label: 'PROMO' } };
    case 'faq':
      return { ...base, content: { items: [{ q: 'Pertanyaan 1?', a: 'Jawaban untuk pertanyaan 1' }] }, style: { ...base.style, alignment: 'left' } };
    case 'gallery':
      return { ...base, content: { images: [], columns: 3 } };
    default:
      return { ...base, content: {} };
  }
};

const defaultData: SalesPageData = {
  title: '',
  slug: '',
  type: 'sales',
  sections: [
    {
      id: 'hero',
      type: 'full',
      backgroundColor: '#6366f1',
      padding: '80px 20px',
      widgets: [
        { ...defaultWidget('heading'), content: { text: 'Produk Terbaik untuk Anda', level: 'h1' }, style: { padding: '16px', alignment: 'center', textColor: '#ffffff', fontSize: '48px', fontWeight: 'bold' } },
        { ...defaultWidget('text'), content: { text: 'Solusi sempurna untuk kebutuhan Anda dengan kualitas premium' }, style: { padding: '8px', alignment: 'center', textColor: '#e0e7ff' } },
        { ...defaultWidget('button'), content: { text: 'Pesan Sekarang', link: '#order', style: 'primary' }, style: { padding: '24px', alignment: 'center' } },
      ],
    },
    {
      id: 'content',
      type: 'full',
      backgroundColor: '#ffffff',
      padding: '60px 20px',
      widgets: [
        { ...defaultWidget('heading'), content: { text: 'Mengapa Memilih Kami?', level: 'h2' }, style: { padding: '16px', alignment: 'center' } },
        { ...defaultWidget('features'), content: { items: [{ icon: '✓', title: 'Kualitas Premium', desc: 'Produk berkualitas tinggi' }, { icon: '✓', title: 'Harga Terjangkau', desc: 'Harga kompetitif' }, { icon: '✓', title: 'Garansi', desc: 'Garansi kepuasan' }] } },
      ],
    },
  ],
  ctaFormId: '',
  globalStyles: {
    primaryColor: '#6366f1',
    secondaryColor: '#f59e0b',
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#ffffff',
  },
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
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [leftPanel, setLeftPanel] = useState<'widgets' | 'settings'>('widgets');
  const [draggedWidget, setDraggedWidget] = useState<WidgetType | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchForms();
    if (id && id !== 'baru') {
      fetchPage();
    }
  }, [id]);

  const fetchForms = async () => {
    try {
      const { data: formsData, error } = await supabase
        .from('forms')
        .select('id, title, slug')
        .order('title');
      if (!error) setForms(formsData || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
  };

  const fetchPage = async () => {
    try {
      const { data: pageData, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && pageData) {
        // Migrate old format to new
        if ((pageData as any).contentBlocks && !(pageData as any).sections) {
          const migrated = migrateOldFormat(pageData);
          setData(migrated);
        } else {
          setData(pageData as SalesPageData);
        }
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      showToast('Gagal memuat data halaman', 'error');
    } finally {
      setLoading(false);
    }
  };

  const migrateOldFormat = (old: any): SalesPageData => {
    const widgets: Widget[] = [];
    if (old.heroTitle) {
      widgets.push({ ...defaultWidget('heading'), content: { text: old.heroTitle, level: 'h1' }, style: { padding: '16px', alignment: 'center', textColor: '#ffffff', fontSize: '48px', fontWeight: 'bold' } });
    }
    if (old.heroSubtitle) {
      widgets.push({ ...defaultWidget('text'), content: { text: old.heroSubtitle }, style: { padding: '8px', alignment: 'center', textColor: '#e0e7ff' } });
    }
    if (old.heroImage) {
      widgets.push({ ...defaultWidget('image'), content: { url: old.heroImage, alt: 'Hero' } });
    }

    const contentWidgets: Widget[] = (old.contentBlocks || []).map((block: any) => {
      if (block.type === 'heading') return { ...defaultWidget('heading'), id: block.id, content: { text: block.content, level: 'h2' } };
      if (block.type === 'text') return { ...defaultWidget('text'), id: block.id, content: { text: block.content } };
      if (block.type === 'image') return { ...defaultWidget('image'), id: block.id, content: { url: block.imageUrl } };
      if (block.type === 'list') return { ...defaultWidget('list'), id: block.id, content: { items: block.content.split('\n').map((i: string) => i.replace(/^[•\-\*]\s*/, '')), icon: 'check' } };
      return { ...defaultWidget('text'), id: block.id, content: { text: block.content } };
    });

    return {
      ...defaultData,
      id: old.id,
      title: old.title,
      slug: old.slug,
      ctaFormId: old.ctaFormId || '',
      footerText: old.footerText || '© 2025 All rights reserved.',
      isPublished: old.isPublished,
      sections: [
        { id: 'hero', type: 'full', backgroundColor: '#6366f1', padding: '80px 20px', widgets },
        { id: 'content', type: 'full', backgroundColor: '#ffffff', padding: '60px 20px', widgets: contentWidgets },
      ],
    };
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const handleSave = async () => {
    if (!data.title.trim()) {
      showToast('Judul halaman wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const slug = data.slug || generateSlug(data.title);
      const payload = { ...data, slug, updatedAt: new Date().toISOString() };
      if (!id || id === 'baru') payload.createdAt = new Date().toISOString();

      const result = id && id !== 'baru'
        ? await supabase.from('landing_pages').update(payload).eq('id', id)
        : await supabase.from('landing_pages').insert(payload).select().single();

      if (result.error) throw result.error;
      showToast('Sales page berhasil disimpan!', 'success');
      if (!id || id === 'baru') navigate('/landing-page');
    } catch (error) {
      console.error('Error saving page:', error);
      showToast('Gagal menyimpan halaman', 'error');
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

  const addSection = (type: 'full' | 'two-col' | 'three-col') => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      backgroundColor: '#ffffff',
      padding: '60px 20px',
      widgets: [],
    };
    setData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setSelectedSection(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
    }));
  };

  const deleteSection = (sectionId: string) => {
    setData(prev => ({ ...prev, sections: prev.sections.filter(s => s.id !== sectionId) }));
    setSelectedSection(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setData(prev => {
      const sections = [...prev.sections];
      const idx = sections.findIndex(s => s.id === sectionId);
      if (direction === 'up' && idx > 0) [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]];
      else if (direction === 'down' && idx < sections.length - 1) [sections[idx], sections[idx + 1]] = [sections[idx + 1], sections[idx]];
      return { ...prev, sections };
    });
  };

  const addWidget = (sectionId: string, type: WidgetType) => {
    const widget = defaultWidget(type);
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, widgets: [...s.widgets, widget] } : s),
    }));
    setSelectedWidget(widget.id);
  };

  const updateWidget = (sectionId: string, widgetId: string, updates: Partial<Widget>) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? {
        ...s,
        widgets: s.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w),
      } : s),
    }));
  };

  const deleteWidget = (sectionId: string, widgetId: string) => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, widgets: s.widgets.filter(w => w.id !== widgetId) } : s),
    }));
    setSelectedWidget(null);
  };

  const moveWidget = (sectionId: string, widgetId: string, direction: 'up' | 'down') => {
    setData(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.id !== sectionId) return s;
        const widgets = [...s.widgets];
        const idx = widgets.findIndex(w => w.id === widgetId);
        if (direction === 'up' && idx > 0) [widgets[idx - 1], widgets[idx]] = [widgets[idx], widgets[idx - 1]];
        else if (direction === 'down' && idx < widgets.length - 1) [widgets[idx], widgets[idx + 1]] = [widgets[idx + 1], widgets[idx]];
        return { ...s, widgets };
      }),
    }));
  };

  const getSelectedWidgetData = () => {
    if (!selectedWidget) return null;
    for (const section of data.sections) {
      const widget = section.widgets.find(w => w.id === selectedWidget);
      if (widget) return { sectionId: section.id, widget };
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  // Preview Mode - Full screen
  if (previewMode) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white px-4 py-2 flex justify-between items-center z-50">
          <span className="text-sm font-medium">Preview: {data.title || 'Sales Page'}</span>
          <button onClick={() => setPreviewMode(false)} className="px-3 py-1 bg-white text-purple-600 rounded text-sm font-medium hover:bg-purple-50">
            Kembali ke Editor
          </button>
        </div>
        <div className="pt-10">
          {data.sections.map(section => (
            <section
              key={section.id}
              style={{ backgroundColor: section.backgroundColor, padding: section.padding, backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              <div className="max-w-6xl mx-auto">
                {section.widgets.map(widget => <WidgetRenderer key={widget.id} widget={widget} globalStyles={data.globalStyles} forms={forms} ctaFormId={data.ctaFormId} />)}
              </div>
            </section>
          ))}
          <footer className="py-8 bg-slate-900 text-slate-400 text-center">
            <p>{data.footerText}</p>
          </footer>
        </div>
      </div>
    );
  }

  const selectedWidgetData = getSelectedWidgetData();

  // Editor Mode - Elementor style
  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/landing-page')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
              <ShoppingCartIcon className="w-5 h-5 text-purple-600" />
            </div>
            <input
              type="text"
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value, slug: generateSlug(e.target.value) }))}
              placeholder="Judul Sales Page"
              className="bg-transparent border-none text-lg font-semibold focus:outline-none text-slate-900 dark:text-white w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={data.isPublished} onChange={e => setData(prev => ({ ...prev, isPublished: e.target.checked }))} className="rounded" />
            <span className="text-slate-600 dark:text-slate-300">Publish</span>
          </label>
          <button onClick={() => setPreviewMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 text-sm">
            <EyeIcon className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Widgets / Settings */}
        <div className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setLeftPanel('widgets'); setSelectedWidget(null); }}
              className={`flex-1 py-3 text-sm font-medium ${leftPanel === 'widgets' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500'}`}
            >
              Widgets
            </button>
            <button
              onClick={() => setLeftPanel('settings')}
              className={`flex-1 py-3 text-sm font-medium ${leftPanel === 'settings' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-slate-500'}`}
            >
              Settings
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {leftPanel === 'widgets' && !selectedWidgetData && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 uppercase font-medium">Drag widget ke canvas</p>
                <div className="grid grid-cols-3 gap-2">
                  {widgetList.map(w => (
                    <button
                      key={w.type}
                      draggable
                      onDragStart={() => setDraggedWidget(w.type)}
                      onDragEnd={() => setDraggedWidget(null)}
                      className="p-3 bg-slate-50 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-center transition-colors border border-transparent hover:border-purple-300"
                    >
                      <span className="text-xl">{w.icon}</span>
                      <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">{w.label}</p>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 uppercase font-medium mb-2">Tambah Section</p>
                  <div className="space-y-2">
                    <button onClick={() => addSection('full')} className="w-full p-2 bg-slate-50 dark:bg-slate-700 hover:bg-purple-50 rounded text-sm text-left flex items-center gap-2">
                      <span className="w-8 h-4 bg-slate-300 rounded"></span> Full Width
                    </button>
                    <button onClick={() => addSection('two-col')} className="w-full p-2 bg-slate-50 dark:bg-slate-700 hover:bg-purple-50 rounded text-sm text-left flex items-center gap-2">
                      <span className="flex gap-0.5"><span className="w-4 h-4 bg-slate-300 rounded"></span><span className="w-4 h-4 bg-slate-300 rounded"></span></span> 2 Kolom
                    </button>
                  </div>
                </div>
              </div>
            )}

            {leftPanel === 'widgets' && selectedWidgetData && (
              <WidgetEditor
                widget={selectedWidgetData.widget}
                sectionId={selectedWidgetData.sectionId}
                onUpdate={(updates) => updateWidget(selectedWidgetData.sectionId, selectedWidgetData.widget.id, updates)}
                onDelete={() => deleteWidget(selectedWidgetData.sectionId, selectedWidgetData.widget.id)}
                onClose={() => setSelectedWidget(null)}
                onImageUpload={handleImageUpload}
                forms={forms}
                ctaFormId={data.ctaFormId}
                onCtaFormChange={(formId) => setData(prev => ({ ...prev, ctaFormId: formId }))}
              />
            )}

            {leftPanel === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug URL</label>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-slate-400">/lp/</span>
                    <input
                      type="text"
                      value={data.slug}
                      onChange={e => setData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                      className="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warna Utama</label>
                  <input type="color" value={data.globalStyles.primaryColor} onChange={e => setData(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, primaryColor: e.target.value } }))} className="w-full h-10 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Tombol ke Formulir</label>
                  <select value={data.ctaFormId} onChange={e => setData(prev => ({ ...prev, ctaFormId: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                    <option value="">-- Pilih Formulir --</option>
                    {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Footer Text</label>
                  <input type="text" value={data.footerText} onChange={e => setData(prev => ({ ...prev, footerText: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas / Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-900 p-6">
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-hidden min-h-[600px]">
            {data.sections.map((section, sIdx) => (
              <div
                key={section.id}
                onClick={() => { setSelectedSection(section.id); setSelectedWidget(null); }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => { if (draggedWidget) { addWidget(section.id, draggedWidget); setDraggedWidget(null); } }}
                className={`relative group ${selectedSection === section.id ? 'ring-2 ring-purple-500' : ''}`}
                style={{ backgroundColor: section.backgroundColor, padding: section.padding, backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : undefined, backgroundSize: 'cover' }}
              >
                {/* Section controls */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 z-10">
                  <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }} className="p-1 bg-white/90 rounded shadow text-xs" disabled={sIdx === 0}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }} className="p-1 bg-white/90 rounded shadow text-xs" disabled={sIdx === data.sections.length - 1}>↓</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="p-1 bg-red-500 text-white rounded shadow text-xs">✕</button>
                </div>

                {/* Section settings */}
                {selectedSection === section.id && (
                  <div className="absolute top-2 left-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg p-2 z-10 flex gap-2">
                    <input type="color" value={section.backgroundColor || '#ffffff'} onChange={e => updateSection(section.id, { backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" title="Background color" />
                  </div>
                )}

                {/* Widgets */}
                {section.widgets.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-300 rounded-lg">
                    <p>Drag widget kesini atau klik untuk menambah</p>
                    <div className="flex justify-center gap-2 mt-3">
                      {widgetList.slice(0, 4).map(w => (
                        <button key={w.type} onClick={() => addWidget(section.id, w.type)} className="p-2 bg-slate-100 hover:bg-purple-100 rounded text-sm">
                          {w.icon} {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  section.widgets.map((widget, wIdx) => (
                    <div
                      key={widget.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedWidget(widget.id); setLeftPanel('widgets'); }}
                      className={`relative group/widget ${selectedWidget === widget.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      {/* Widget controls */}
                      <div className="absolute -top-3 -right-3 opacity-0 group-hover/widget:opacity-100 flex gap-1 z-10">
                        <button onClick={(e) => { e.stopPropagation(); moveWidget(section.id, widget.id, 'up'); }} className="p-1 bg-white rounded shadow text-xs" disabled={wIdx === 0}>↑</button>
                        <button onClick={(e) => { e.stopPropagation(); moveWidget(section.id, widget.id, 'down'); }} className="p-1 bg-white rounded shadow text-xs" disabled={wIdx === section.widgets.length - 1}>↓</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteWidget(section.id, widget.id); }} className="p-1 bg-red-500 text-white rounded shadow text-xs">✕</button>
                      </div>
                      <WidgetRenderer widget={widget} globalStyles={data.globalStyles} isEditor forms={forms} ctaFormId={data.ctaFormId} />
                    </div>
                  ))
                )}
              </div>
            ))}

            {/* Add section button */}
            <button onClick={() => addSection('full')} className="w-full py-8 border-2 border-dashed border-slate-300 hover:border-purple-500 text-slate-400 hover:text-purple-600 transition-colors">
              + Tambah Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Widget Renderer Component
const WidgetRenderer: React.FC<{ widget: Widget; globalStyles: SalesPageData['globalStyles']; isEditor?: boolean; forms: Form[]; ctaFormId: string }> = ({ widget, globalStyles, isEditor, forms, ctaFormId }) => {
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
      const HeadingTag = widget.content.level || 'h2';
      const headingClass = `${widget.content.level === 'h1' ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'} font-bold`;
      if (HeadingTag === 'h1') return <h1 style={style} className={headingClass}>{widget.content.text}</h1>;
      if (HeadingTag === 'h3') return <h3 style={style} className={headingClass}>{widget.content.text}</h3>;
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
      const ButtonEl = isEditor ? 'button' : 'a';
      return (
        <div style={style}>
          <ButtonEl
            {...(!isEditor && { href: ctaFormId ? getFormLink(ctaFormId) : widget.content.link || '#' })}
            className={`inline-block px-8 py-3 rounded-lg font-semibold transition-all ${widget.content.style === 'primary' ? 'text-white shadow-lg hover:shadow-xl' : 'border-2'}`}
            style={{ backgroundColor: widget.content.style === 'primary' ? globalStyles.primaryColor : 'transparent', borderColor: globalStyles.primaryColor, color: widget.content.style === 'primary' ? '#fff' : globalStyles.primaryColor }}
          >
            {widget.content.text}
          </ButtonEl>
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
        <div style={style} className="bg-white dark:bg-slate-700 p-6 rounded-xl shadow-lg max-w-xl mx-auto">
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
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
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
            <details key={i} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{item.q}</summary>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{item.a}</p>
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

// Widget Editor Panel
const WidgetEditor: React.FC<{
  widget: Widget;
  sectionId: string;
  onUpdate: (updates: Partial<Widget>) => void;
  onDelete: () => void;
  onClose: () => void;
  onImageUpload: (file: File) => Promise<string>;
  forms: Form[];
  ctaFormId: string;
  onCtaFormChange: (formId: string) => void;
}> = ({ widget, onUpdate, onDelete, onClose, onImageUpload, forms, ctaFormId, onCtaFormChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await onImageUpload(file);
      onUpdate({ content: { ...widget.content, [field]: url } });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{widget.type}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>

      {/* Content editing based on widget type */}
      {widget.type === 'heading' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Teks</label>
            <input type="text" value={widget.content.text} onChange={e => onUpdate({ content: { ...widget.content, text: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Level</label>
            <select value={widget.content.level} onChange={e => onUpdate({ content: { ...widget.content, level: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700">
              <option value="h1">H1 - Judul Utama</option>
              <option value="h2">H2 - Sub Judul</option>
              <option value="h3">H3 - Judul Kecil</option>
            </select>
          </div>
        </>
      )}

      {widget.type === 'text' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Teks</label>
          <textarea value={widget.content.text} onChange={e => onUpdate({ content: { ...widget.content, text: e.target.value } })} rows={4} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
        </div>
      )}

      {widget.type === 'image' && (
        <>
          {widget.content.url && <img src={widget.content.url} alt="" className="w-full h-32 object-cover rounded" />}
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded cursor-pointer text-sm">
            <UploadIcon className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Gambar'}
            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'url')} className="hidden" disabled={uploading} />
          </label>
          <input type="text" value={widget.content.caption || ''} onChange={e => onUpdate({ content: { ...widget.content, caption: e.target.value } })} placeholder="Caption (opsional)" className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
        </>
      )}

      {widget.type === 'button' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Teks Tombol</label>
            <input type="text" value={widget.content.text} onChange={e => onUpdate({ content: { ...widget.content, text: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Link ke Formulir</label>
            <select value={ctaFormId} onChange={e => onCtaFormChange(e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700">
              <option value="">-- Pilih Formulir --</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Style</label>
            <select value={widget.content.style} onChange={e => onUpdate({ content: { ...widget.content, style: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700">
              <option value="primary">Primary (Filled)</option>
              <option value="outline">Outline</option>
            </select>
          </div>
        </>
      )}

      {widget.type === 'spacer' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tinggi (px)</label>
          <input type="number" value={widget.content.height} onChange={e => onUpdate({ content: { ...widget.content, height: parseInt(e.target.value) || 40 } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
        </div>
      )}

      {widget.type === 'list' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">Items (satu per baris)</label>
          <textarea value={(widget.content.items || []).join('\n')} onChange={e => onUpdate({ content: { ...widget.content, items: e.target.value.split('\n') } })} rows={5} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
        </div>
      )}

      {widget.type === 'testimonial' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Testimonial</label>
            <textarea value={widget.content.text} onChange={e => onUpdate({ content: { ...widget.content, text: e.target.value } })} rows={3} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nama</label>
              <input type="text" value={widget.content.author} onChange={e => onUpdate({ content: { ...widget.content, author: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Role</label>
              <input type="text" value={widget.content.role} onChange={e => onUpdate({ content: { ...widget.content, role: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
            </div>
          </div>
        </>
      )}

      {widget.type === 'video' && (
        <div>
          <label className="block text-xs text-slate-500 mb-1">YouTube URL</label>
          <input type="text" value={widget.content.url} onChange={e => onUpdate({ content: { ...widget.content, url: e.target.value } })} placeholder="https://youtube.com/watch?v=..." className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
        </div>
      )}

      {widget.type === 'pricing' && (
        <>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Harga</label>
            <input type="text" value={widget.content.price} onChange={e => onUpdate({ content: { ...widget.content, price: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Harga Asli (coret)</label>
            <input type="text" value={widget.content.originalPrice || ''} onChange={e => onUpdate({ content: { ...widget.content, originalPrice: e.target.value } })} className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Label Badge</label>
            <input type="text" value={widget.content.label || ''} onChange={e => onUpdate({ content: { ...widget.content, label: e.target.value } })} placeholder="PROMO" className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700" />
          </div>
        </>
      )}

      {/* Common Style Settings */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
        <p className="text-xs text-slate-500 mb-2 font-medium">Style</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Alignment</label>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map(align => (
                <button key={align} onClick={() => onUpdate({ style: { ...widget.style, alignment: align as any } })} className={`flex-1 p-2 rounded ${widget.style.alignment === align ? 'bg-purple-100 text-purple-600' : 'bg-slate-100'}`}>
                  {align === 'left' ? <AlignLeftIcon className="w-4 h-4 mx-auto" /> : align === 'center' ? <AlignCenterIcon className="w-4 h-4 mx-auto" /> : <AlignRightIcon className="w-4 h-4 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Warna Teks</label>
            <input type="color" value={widget.style.textColor || '#000000'} onChange={e => onUpdate({ style: { ...widget.style, textColor: e.target.value } })} className="w-full h-8 rounded cursor-pointer" />
          </div>
        </div>
      </div>

      <button onClick={onDelete} className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 flex items-center justify-center gap-2">
        <TrashIcon className="w-4 h-4" /> Hapus Widget
      </button>
    </div>
  );
};

export default SalesPageEditor;
