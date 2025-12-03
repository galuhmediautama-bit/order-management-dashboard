
import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import MetaIcon from '../components/icons/MetaIcon';
import GoogleIcon from '../components/icons/GoogleIcon';
import TikTokIcon from '../components/icons/TikTokIcon';
import SnackVideoIcon from '../components/icons/SnackVideoIcon';
import ToggleSwitch from '../components/ToggleSwitch';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';

type Platform = 'meta' | 'google' | 'tiktok' | 'snack';

interface Pixel {
    name: string;
    id: string;
    key: number; // For React list management
}

interface PlatformSetting {
    pixels: Pixel[];
    active: boolean;
}

interface PixelSettings {
    meta: PlatformSetting;
    google: PlatformSetting;
    tiktok: PlatformSetting;
    snack: PlatformSetting;
}

const PLATFORM_CONFIG: Record<Platform, { name: string; icon: React.FC<{className?: string}>; colorClass: string; borderClass: string }> = {
    meta: { 
        name: 'Meta Pixel', 
        icon: MetaIcon,
        colorClass: 'text-blue-600 dark:text-blue-400',
        borderClass: 'border-blue-500'
    },
    google: { 
        name: 'Google Analytics', 
        icon: GoogleIcon,
        colorClass: 'text-green-600 dark:text-green-400',
        borderClass: 'border-green-500'
    },
    tiktok: { 
        name: 'TikTok Pixel', 
        icon: TikTokIcon,
        colorClass: 'text-slate-900 dark:text-white',
        borderClass: 'border-slate-800 dark:border-slate-400'
    },
    snack: { 
        name: 'Snack Video', 
        icon: SnackVideoIcon,
        colorClass: 'text-yellow-600 dark:text-yellow-400',
        borderClass: 'border-yellow-500'
    },
};

const TrackingPage: React.FC = () => {
    const [settings, setSettings] = useState<PixelSettings>({
        meta: { pixels: [], active: false },
        google: { pixels: [], active: false },
        tiktok: { pixels: [], active: false },
        snack: { pixels: [], active: false },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
            if (data) {
                const migratedSettings: PixelSettings = { ...settings };

                (Object.keys(PLATFORM_CONFIG) as Platform[]).forEach(platform => {
                    const platformData = data[platform];
                    if (platformData) {
                        // Check for old format ({ id: string, active: boolean }) and migrate
                        if (typeof platformData.id === 'string' && !Array.isArray(platformData.pixels)) {
                            migratedSettings[platform] = {
                                pixels: platformData.id ? [{ name: 'Pixel Utama', id: platformData.id, key: Date.now() }] : [],
                                active: platformData.active || false
                            };
                        } else { // Handle new format
                             migratedSettings[platform] = {
                                pixels: (platformData.pixels || []).map((p: any) => ({ ...p, key: Math.random() })),
                                active: platformData.active || false
                            };
                        }
                    }
                });
                setSettings(migratedSettings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const handleToggleChange = (platform: Platform, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            [platform]: { ...prev[platform], active: checked }
        }));
    };
    
    const handlePixelChange = (platform: Platform, index: number, field: 'name' | 'id', value: string) => {
        setSettings(prev => {
            const newPixels = [...prev[platform].pixels];
            newPixels[index] = { ...newPixels[index], [field]: value };
            return {
                ...prev,
                [platform]: {
                    ...prev[platform],
                    pixels: newPixels
                }
            };
        });
    };

    const addPixel = (platform: Platform) => {
        setSettings(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                pixels: [...prev[platform].pixels, { name: '', id: '', key: Date.now() }]
            }
        }));
    };

    const removePixel = (platform: Platform, index: number) => {
        setSettings(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                pixels: prev[platform].pixels.filter((_, i) => i !== index)
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Create a deep copy and remove the client-side 'key' property before saving
            const settingsToSave = JSON.parse(JSON.stringify(settings));
            (Object.keys(settingsToSave) as Platform[]).forEach(platform => {
                if (settingsToSave[platform].pixels) {
                    settingsToSave[platform].pixels.forEach((p: any) => delete p.key);
                }
            });
            await supabase.from('settings').upsert({ id: 'trackingPixels', ...settingsToSave });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving tracking settings: ", error);
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="text-center p-8">Memuat pengaturan piksel...</div>
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pelacakan Pixel</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola ID pixel pelacakan untuk platform iklan Anda. Tambahkan banyak pixel untuk multi-track.</p>
                </div>
                <div className="flex items-center gap-4">
                    {saveSuccess && <p className="text-sm text-green-600 font-medium animate-pulse">Berhasil disimpan!</p>}
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 text-sm font-medium shadow-sm transition-all flex items-center gap-2">
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map(platform => {
                    const config = PLATFORM_CONFIG[platform];
                    const Icon = config.icon;
                    const platformSettings = settings[platform];
                    const isActive = platformSettings.active;
                    const pixelCount = platformSettings.pixels.length;

                    return (
                         <div key={platform} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 ${config.borderClass} flex flex-col h-full`}>
                             {/* Card Header */}
                             <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-700 ${config.colorClass}`}>
                                        <Icon className="w-6 h-6"/>
                                     </div>
                                     <div>
                                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{config.name}</h2>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                            {isActive ? `${pixelCount} ID Aktif` : 'Non-Aktif'}
                                        </span>
                                     </div>
                                 </div>
                                 <ToggleSwitch
                                     checked={isActive}
                                     onChange={(checked) => handleToggleChange(platform, checked)}
                                 />
                             </div>

                             {/* Card Content */}
                             <div className={`flex-1 p-5 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                                 
                                 {/* Column Headers */}
                                 {platformSettings.pixels.length > 0 && (
                                     <div className="flex gap-2 mb-2 px-1">
                                         <span className="w-1/3 text-xs font-semibold text-slate-500 uppercase">Label / Nama</span>
                                         <span className="w-2/3 text-xs font-semibold text-slate-500 uppercase">Pixel ID</span>
                                         <span className="w-8"></span>
                                     </div>
                                 )}

                                 {/* Pixel List Container (Scrollable) */}
                                 <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                    {platformSettings.pixels.map((pixel, index) => (
                                        <div key={pixel.key} className="flex items-center gap-2 group">
                                            <input
                                                type="text"
                                                value={pixel.name}
                                                onChange={(e) => handlePixelChange(platform, index, 'name', e.target.value)}
                                                placeholder="Label (Opsional)"
                                                className="w-1/3 p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-shadow"
                                            />
                                            <input
                                                type="text"
                                                value={pixel.id}
                                                onChange={(e) => handlePixelChange(platform, index, 'id', e.target.value)}
                                                placeholder={`ID ${config.name}`}
                                                className="flex-grow p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono transition-shadow"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => removePixel(platform, index)} 
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Hapus Pixel"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {platformSettings.pixels.length === 0 && (
                                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada Pixel ID yang ditambahkan.</p>
                                        </div>
                                    )}
                                 </div>

                                 {/* Add Button */}
                                 <button
                                    type="button"
                                    onClick={() => addPixel(platform)}
                                    className="mt-4 w-full py-2.5 border-2 border-dashed border-indigo-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/50 hover:border-indigo-300 transition-all text-sm font-medium flex items-center justify-center gap-2"
                                 >
                                     <PlusIcon className="w-4 h-4" />
                                     Tambah Pixel Baru
                                 </button>
                             </div>
                         </div>
                    )
                })}
            </div>
        </div>
    );
};

export default TrackingPage;
