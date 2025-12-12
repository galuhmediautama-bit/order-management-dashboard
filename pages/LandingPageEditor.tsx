import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import GlobeIcon from '../components/icons/GlobeIcon';
import EyeIcon from '../components/icons/EyeIcon';
import PencilIcon from '../components/icons/PencilIcon';
import ImageIcon from '../components/icons/ImageIcon';
import CheckIcon from '../components/icons/CheckIcon';
import UploadIcon from '../components/icons/UploadIcon';

interface LandingPageSettings {
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    heroButtonText: string;
    heroButtonLink: string;
    features: {
        title: string;
        description: string;
        icon: string;
    }[];
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButtonText: string;
    ctaButtonLink: string;
    footerText: string;
    isPublished: boolean;
}

const defaultSettings: LandingPageSettings = {
    heroTitle: 'Selamat Datang di Order Management',
    heroSubtitle: 'Kelola pesanan, tracking, dan laporan bisnis Anda dalam satu platform.',
    heroImage: '',
    heroButtonText: 'Mulai Sekarang',
    heroButtonLink: '/#/login',
    features: [
        { title: 'Manajemen Pesanan', description: 'Kelola pesanan dengan mudah dan efisien', icon: '📦' },
        { title: 'Laporan Real-time', description: 'Pantau performa bisnis secara langsung', icon: '📊' },
        { title: 'Multi-User', description: 'Kolaborasi tim dengan berbagai peran', icon: '👥' },
    ],
    ctaTitle: 'Siap Meningkatkan Bisnis Anda?',
    ctaSubtitle: 'Bergabung sekarang dan rasakan kemudahan mengelola bisnis.',
    ctaButtonText: 'Daftar Gratis',
    ctaButtonLink: '/#/login',
    footerText: '© 2025 Order Management Dashboard. All rights reserved.',
    isPublished: false,
};

const LandingPageEditor: React.FC = () => {
    const { websiteSettings } = useContext(SettingsContext);
    const { showToast } = useToast();
    const [settings, setSettings] = useState<LandingPageSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'cta' | 'footer'>('hero');
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'landing_page')
                .single();

            if (data?.value) {
                setSettings({ ...defaultSettings, ...data.value });
            }
        } catch (error) {
            console.error('Error fetching landing page settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: 'landing_page',
                    value: settings,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'key' });

            if (error) throw error;
            showToast('Pengaturan landing page berhasil disimpan!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Gagal menyimpan pengaturan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage') => {
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

            setSettings(prev => ({ ...prev, [field]: publicUrl }));
            showToast('Gambar berhasil diupload!', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Gagal upload gambar', 'error');
        }
    };

    const updateFeature = (index: number, field: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? { ...f, [field]: value } : f)
        }));
    };

    const addFeature = () => {
        setSettings(prev => ({
            ...prev,
            features: [...prev.features, { title: 'Fitur Baru', description: 'Deskripsi fitur', icon: '✨' }]
        }));
    };

    const removeFeature = (index: number) => {
        setSettings(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
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
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900">
                {/* Fixed Preview Bar */}
                <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white px-4 py-2 flex justify-between items-center z-50">
                    <span className="text-sm font-medium">Mode Preview Landing Page</span>
                    <button
                        onClick={() => setPreviewMode(false)}
                        className="px-3 py-1 bg-white text-indigo-600 rounded text-sm font-medium hover:bg-indigo-50"
                    >
                        Kembali ke Editor
                    </button>
                </div>

                {/* Hero Section */}
                <section className="pt-16 min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        {settings.heroImage && (
                            <img src={settings.heroImage} alt="Hero" className="w-32 h-32 mx-auto mb-6 rounded-2xl shadow-xl" />
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{settings.heroTitle}</h1>
                        <p className="text-xl text-indigo-100 mb-8">{settings.heroSubtitle}</p>
                        <a
                            href={settings.heroButtonLink}
                            className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                        >
                            {settings.heroButtonText}
                        </a>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-slate-50 dark:bg-slate-800">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">Fitur Unggulan</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {settings.features.map((feature, index) => (
                                <div key={index} className="bg-white dark:bg-slate-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                    <span className="text-4xl mb-4 block">{feature.icon}</span>
                                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">{feature.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-indigo-600 text-white">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <h2 className="text-3xl font-bold mb-4">{settings.ctaTitle}</h2>
                        <p className="text-xl text-indigo-100 mb-8">{settings.ctaSubtitle}</p>
                        <a
                            href={settings.ctaButtonLink}
                            className="inline-block px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            {settings.ctaButtonText}
                        </a>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 bg-slate-900 text-slate-400 text-center">
                    <p>{settings.footerText}</p>
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
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <GlobeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Landing Page</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola tampilan halaman utama website</p>
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
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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

            {/* Status Badge */}
            <div className="mb-6 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${settings.isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {settings.isPublished ? '✓ Terpublikasi' : '⏸ Draft'}
                </span>
                <button
                    onClick={() => setSettings(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    {settings.isPublished ? 'Jadikan Draft' : 'Publikasikan'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(['hero', 'features', 'cta', 'footer'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        {tab === 'hero' ? 'Hero Section' : tab === 'features' ? 'Fitur' : tab === 'cta' ? 'Call to Action' : 'Footer'}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                {activeTab === 'hero' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Hero</label>
                            <input
                                type="text"
                                value={settings.heroTitle}
                                onChange={e => setSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle Hero</label>
                            <textarea
                                value={settings.heroSubtitle}
                                onChange={e => setSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar Hero</label>
                            <div className="flex items-center gap-4">
                                {settings.heroImage && (
                                    <img src={settings.heroImage} alt="Hero" className="w-20 h-20 rounded-lg object-cover" />
                                )}
                                <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                                    <UploadIcon className="w-4 h-4" />
                                    <span className="text-sm">Upload Gambar</span>
                                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'heroImage')} className="hidden" />
                                </label>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Tombol</label>
                                <input
                                    type="text"
                                    value={settings.heroButtonText}
                                    onChange={e => setSettings(prev => ({ ...prev, heroButtonText: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Tombol</label>
                                <input
                                    type="text"
                                    value={settings.heroButtonLink}
                                    onChange={e => setSettings(prev => ({ ...prev, heroButtonLink: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-4">
                        {settings.features.map((feature, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Fitur {index + 1}</span>
                                    <button
                                        onClick={() => removeFeature(index)}
                                        className="text-red-500 hover:text-red-600 text-sm"
                                    >
                                        Hapus
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Icon (emoji)</label>
                                        <input
                                            type="text"
                                            value={feature.icon}
                                            onChange={e => updateFeature(index, 'icon', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl"
                                            maxLength={2}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs text-slate-500 mb-1">Judul</label>
                                        <input
                                            type="text"
                                            value={feature.title}
                                            onChange={e => updateFeature(index, 'title', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="block text-xs text-slate-500 mb-1">Deskripsi</label>
                                    <input
                                        type="text"
                                        value={feature.description}
                                        onChange={e => updateFeature(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addFeature}
                            className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                        >
                            + Tambah Fitur
                        </button>
                    </div>
                )}

                {activeTab === 'cta' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul CTA</label>
                            <input
                                type="text"
                                value={settings.ctaTitle}
                                onChange={e => setSettings(prev => ({ ...prev, ctaTitle: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtitle CTA</label>
                            <textarea
                                value={settings.ctaSubtitle}
                                onChange={e => setSettings(prev => ({ ...prev, ctaSubtitle: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Tombol</label>
                                <input
                                    type="text"
                                    value={settings.ctaButtonText}
                                    onChange={e => setSettings(prev => ({ ...prev, ctaButtonText: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link Tombol</label>
                                <input
                                    type="text"
                                    value={settings.ctaButtonLink}
                                    onChange={e => setSettings(prev => ({ ...prev, ctaButtonLink: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'footer' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Footer</label>
                            <input
                                type="text"
                                value={settings.footerText}
                                onChange={e => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LandingPageEditor;
