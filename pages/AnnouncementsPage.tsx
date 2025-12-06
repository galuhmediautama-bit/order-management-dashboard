import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Announcement, AnnouncementType, AnnouncementDisplayMode, AnnouncementSettings } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import ImageIcon from '../components/icons/ImageIcon';
import { useToast } from '../contexts/ToastContext';
import { uploadFileAndGetURL } from '../fileUploader';
import ToggleSwitch from '../components/ToggleSwitch';

const defaultAnnouncementSettings: AnnouncementSettings = {
    popup: {
        enabled: true,
        frequency: 'per_session',
        cooldownMinutes: 30,
        maxShowsPerDay: 3,
    },
    lineBar: {
        enabled: true,
        dismissBehavior: 'hide_for_hours',
        hideDurationHours: 12,
    },
};

const AnnouncementsPage: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState<Partial<Announcement>>({
        title: '',
        message: '',
        type: 'info',
        displayMode: 'popup',
        isActive: true,
        imageUrl: '',
        linkUrl: '',
    });
    const [showTitle, setShowTitle] = useState(true);
    const [showMessage, setShowMessage] = useState(true);
    const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings>(defaultAnnouncementSettings);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchAnnouncements();
        fetchAnnouncementSettings();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('announcements').select('*').order('order', { ascending: true });
            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            showToast('Gagal memuat pengumuman', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnnouncementSettings = async () => {
        setSettingsLoading(true);
        try {
            const { data, error } = await supabase.from('settings').select('*').eq('id', 'announcementSettings').single();
            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching announcement settings:', error);
            }
            if (data) {
                const normalized: AnnouncementSettings = {
                    popup: {
                        enabled: data.announcementPopupEnabled ?? defaultAnnouncementSettings.popup.enabled,
                        frequency: data.announcementPopupFrequency ?? defaultAnnouncementSettings.popup.frequency,
                        cooldownMinutes: data.announcementPopupCooldownMinutes ?? defaultAnnouncementSettings.popup.cooldownMinutes,
                        maxShowsPerDay: data.announcementPopupMaxShowsPerDay ?? defaultAnnouncementSettings.popup.maxShowsPerDay,
                    },
                    lineBar: {
                        enabled: data.announcementLineBarEnabled ?? defaultAnnouncementSettings.lineBar.enabled,
                        dismissBehavior: data.announcementLineBarDismissBehavior ?? defaultAnnouncementSettings.lineBar.dismissBehavior,
                        hideDurationHours: data.announcementLineBarHideDurationHours ?? defaultAnnouncementSettings.lineBar.hideDurationHours,
                    },
                };
                setAnnouncementSettings(normalized);
            } else {
                setAnnouncementSettings(defaultAnnouncementSettings);
            }
        } catch (err) {
            console.error('Unexpected error loading announcement settings:', err);
            setAnnouncementSettings(defaultAnnouncementSettings);
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleOpenModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            const isLinebar = announcement.displayMode === 'linebar';
            setFormData({
                ...announcement,
                displayMode: announcement.displayMode || 'popup',
                imageUrl: isLinebar ? '' : (announcement.imageUrl || ''),
                linkUrl: announcement.linkUrl || '',
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
            const endDate = thirtyDaysLater.toISOString().split('T')[0];
            
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                message: '',
                type: 'info',
                displayMode: 'popup',
                isActive: true,
                imageUrl: '',
                linkUrl: '',
                startDate: today,
                endDate: endDate,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            message: '',
            type: 'info',
            displayMode: 'popup',
            isActive: true,
            imageUrl: '',
            linkUrl: '',
        });
        setShowTitle(true);
        setShowMessage(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (formData.displayMode === 'linebar') {
            showToast('Mode baris tidak mendukung gambar', 'error');
            return;
        }

        setUploadingImage(true);
        try {
            const url = await uploadFileAndGetURL(file);
            setFormData({ ...formData, imageUrl: url });
            showToast('Gambar berhasil diunggah', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Gagal mengunggah gambar', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if ((showTitle && !formData.title?.trim()) || (showMessage && !formData.message?.trim())) {
            showToast('Isi judul dan pesan yang ditampilkan', 'error');
            return;
        }

        // Validate displayMode matches settings
        if (!['popup', 'linebar'].includes(formData.displayMode || '')) {
            showToast('Tampilan pengumuman tidak valid', 'error');
            return;
        }

        try {
            const saveData = {
                title: showTitle ? formData.title?.trim() : '',
                message: showMessage ? formData.message?.trim() : '',
                type: formData.type || 'info',
                displayMode: formData.displayMode || 'popup',
                isActive: formData.isActive ?? true,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                imageUrl: formData.displayMode === 'popup' ? (formData.imageUrl || null) : null,
                linkUrl: formData.displayMode === 'linebar' ? (formData.linkUrl?.trim() || null) : null,
            };

            // Save global announcement settings inline with graceful fallback if columns are missing
            let payload: Record<string, any> = {
                id: 'announcementSettings',
                announcementPopupEnabled: announcementSettings.popup.enabled,
                announcementPopupFrequency: announcementSettings.popup.frequency,
                announcementPopupCooldownMinutes: announcementSettings.popup.cooldownMinutes ?? null,
                announcementPopupMaxShowsPerDay: announcementSettings.popup.maxShowsPerDay ?? null,
                announcementLineBarEnabled: announcementSettings.lineBar.enabled,
                announcementLineBarDismissBehavior: announcementSettings.lineBar.dismissBehavior,
                announcementLineBarHideDurationHours: announcementSettings.lineBar.hideDurationHours ?? null,
            };

            const stripMissingFieldAndRetry = async () => {
                const maxAttempts = Object.keys(payload).length + 5; // remove as many as needed, with guard
                let attempt = 0;
                while (attempt < maxAttempts) {
                    const { error } = await supabase.from('settings').upsert(payload);
                    if (!error) return;

                    const msg = error?.message || '';
                    const match = msg.match(/'([^']+)' column/);
                    const missingField = match?.[1];

                    // If we detect a missing field that we still send, drop it and retry
                    if (missingField && payload.hasOwnProperty(missingField)) {
                        delete payload[missingField];
                        attempt += 1;
                        continue;
                    }

                    // If missingField not in payload, or message doesn't identify a column, try stripping non-id fields progressively
                    const keys = Object.keys(payload).filter((k) => k !== 'id');
                    if (keys.length > 0) {
                        delete payload[keys[0]];
                        attempt += 1;
                        continue;
                    }

                    throw new Error(`Gagal menyimpan pengaturan pengumuman: ${msg}`);
                }
                throw new Error('Gagal menyimpan pengaturan pengumuman: percobaan maksimum tercapai');
            };

            try {
                await stripMissingFieldAndRetry();
            } catch (settingsError: any) {
                console.error('Save announcement settings error:', settingsError);
                throw settingsError;
            }

            if (editingAnnouncement) {
                // Update existing
                const { error } = await supabase
                    .from('announcements')
                    .update({
                        ...saveData,
                        updatedAt: new Date().toISOString(),
                    })
                    .eq('id', editingAnnouncement.id);

                if (error) {
                    console.error('Update error:', error);
                    throw new Error(`Update gagal: ${error.message}`);
                }
                showToast('Pengumuman berhasil diupdate', 'success');
            } else {
                // Create new
                const { error } = await supabase.from('announcements').insert({
                    ...saveData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    order: announcements.length + 1,
                });

                if (error) {
                    console.error('Insert error:', error);
                    throw new Error(`Buat gagal: ${error.message}`);
                }
                showToast('Pengumuman berhasil dibuat', 'success');
            }

            handleCloseModal();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            const message = error instanceof Error ? error.message : 'Gagal menyimpan pengumuman';
            showToast(message, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Yakin ingin menghapus pengumuman ini?')) return;

        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
            showToast('Pengumuman berhasil dihapus', 'success');
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            showToast('Gagal menghapus pengumuman', 'error');
        }
    };

    const getTypeColor = (type: AnnouncementType) => {
        const colors = {
            info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
            error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
        };
        return colors[type];
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 shadow-sm border border-indigo-100/50 dark:border-indigo-800/30">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                            📢 Kelola Pengumuman
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Buat dan kelola pengumuman yang akan ditampilkan kepada pengguna</p>
                    </div>
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:from-indigo-700 hover:to-cyan-700 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all whitespace-nowrap text-sm md:text-base"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>Tambah Pengumuman</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-16 text-center">
                    <div className="text-7xl mb-4 opacity-50">📭</div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">Belum ada pengumuman</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Klik "Tambah Pengumuman" untuk membuat pengumuman pertama Anda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                            {/* Image */}
                            {announcement.displayMode === 'popup' && announcement.imageUrl && (
                                <div className="w-full h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                                    <img 
                                        src={announcement.imageUrl} 
                                        alt={announcement.title}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            
                            {/* Header */}
                            <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${getTypeColor(announcement.type)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-base line-clamp-2 text-slate-900 dark:text-white">{announcement.title}</h3>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${getTypeColor(announcement.type)}`}>
                                                {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{announcement.displayMode === 'popup' ? '📱 Pop-up' : '📌 Baris'}</span>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${announcement.isActive ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <div className={`w-2.5 h-2.5 rounded-full ${announcement.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                {announcement.message && <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-3 leading-relaxed">{announcement.message}</p>}
                                {announcement.linkUrl && (
                                    <a
                                        href={announcement.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 underline-offset-4 hover:underline"
                                    >
                                        Buka tautan
                                    </a>
                                )}
                                
                                {(announcement.startDate || announcement.endDate) && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-2 pb-3 border-t border-slate-200 dark:border-slate-700">
                                        {announcement.startDate && <div>📅 Mulai: <span className="font-medium">{new Date(announcement.startDate).toLocaleDateString('id-ID')}</span></div>}
                                        {announcement.endDate && <div>📅 Berakhir: <span className="font-medium">{new Date(announcement.endDate).toLocaleDateString('id-ID')}</span></div>}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(announcement)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(announcement.id)}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Mode Tampil (wajib pilih dulu) */}
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih mode tampil</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'popup', label: 'Pop-up', desc: 'Dengan gambar opsional' },
                                        { key: 'linebar', label: 'Baris', desc: 'Tanpa gambar, bisa tautan' },
                                    ].map((option) => {
                                        const isActive = formData.displayMode === option.key;
                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        displayMode: option.key as AnnouncementDisplayMode,
                                                        imageUrl: option.key === 'linebar' ? '' : prev.imageUrl,
                                                    }));
                                                }}
                                                className={`text-left p-3 rounded-xl border-2 transition-all ${isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{option.label}</span>
                                                    {isActive && <CheckIcon className="w-4 h-4 text-indigo-600" />}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{option.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Judul Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tampilkan Judul</label>
                                <ToggleSwitch checked={showTitle} onChange={setShowTitle} />
                            </div>

                            {/* Judul */}
                            {showTitle && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Judul</label>
                                    <input
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Masukkan judul pengumuman"
                                        className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            )}

                            {/* Pesan Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tampilkan Pesan</label>
                                <ToggleSwitch checked={showMessage} onChange={setShowMessage} />
                            </div>

                            {/* Pesan */}
                            {showMessage && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Pesan</label>
                                    <textarea
                                        value={formData.message || ''}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Masukkan pesan pengumuman"
                                        rows={4}
                                        className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                                    />
                                </div>
                            )}

                            {/* Gambar (hanya untuk pop-up) */}
                            {formData.displayMode === 'popup' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Gambar (opsional)</label>
                                    <div className="space-y-3">
                                        {formData.imageUrl && (
                                            <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                                <img 
                                                    src={formData.imageUrl} 
                                                    alt="Preview" 
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploadingImage}
                                                className="hidden"
                                            />
                                            {uploadingImage ? (
                                                <>
                                                    <SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mengunggah...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-5 h-5 text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Klik untuk unggah gambar</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Tautan (khusus baris) */}
                            {formData.displayMode === 'linebar' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tautan (opsional)</label>
                                    <input
                                        type="url"
                                        value={formData.linkUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                        placeholder="https://contoh.com"
                                        className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            )}

                            {/* Tipe */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tipe</label>
                                <select
                                    value={formData.type || 'info'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                >
                                    <option value="info">ℹ️ Informasi</option>
                                    <option value="success">✅ Sukses</option>
                                    <option value="warning">⚠️ Peringatan</option>
                                    <option value="error">❌ Error</option>
                                </select>
                            </div>

                            {/* Pengaturan Pengumuman (Global) */}
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pengaturan Pengumuman</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Berlaku global untuk semua pengumuman</p>
                                    </div>
                                    {settingsLoading && <SpinnerIcon className="w-4 h-4 animate-spin text-indigo-500" />}
                                </div>

                                {/* Popup Settings */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pop-up aktif</span>
                                        <ToggleSwitch
                                            checked={announcementSettings.popup.enabled}
                                            onChange={(v) => setAnnouncementSettings(prev => ({ ...prev, popup: { ...prev.popup, enabled: v } }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="col-span-1 sm:col-span-1">
                                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">Frekuensi</label>
                                            <select
                                                value={announcementSettings.popup.frequency}
                                                onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, popup: { ...prev.popup, frequency: e.target.value as AnnouncementSettings['popup']['frequency'] } }))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            >
                                                <option value="always">Selalu</option>
                                                <option value="per_session">Per Sesi</option>
                                                <option value="cooldown">Cooldown</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">Cooldown (menit)</label>
                                            <input
                                                type="number"
                                                value={announcementSettings.popup.cooldownMinutes ?? ''}
                                                onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, popup: { ...prev.popup, cooldownMinutes: Number(e.target.value) || 0 } }))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                min={0}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">Maks. tampil/hari</label>
                                            <input
                                                type="number"
                                                value={announcementSettings.popup.maxShowsPerDay ?? ''}
                                                onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, popup: { ...prev.popup, maxShowsPerDay: Number(e.target.value) || 0 } }))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Bar Settings */}
                                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Baris aktif</span>
                                        <ToggleSwitch
                                            checked={announcementSettings.lineBar.enabled}
                                            onChange={(v) => setAnnouncementSettings(prev => ({ ...prev, lineBar: { ...prev.lineBar, enabled: v } }))}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">Perilaku tutup</label>
                                            <select
                                                value={announcementSettings.lineBar.dismissBehavior}
                                                onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, lineBar: { ...prev.lineBar, dismissBehavior: e.target.value as AnnouncementSettings['lineBar']['dismissBehavior'] } }))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            >
                                                <option value="hide_for_session">Sembunyikan untuk sesi</option>
                                                <option value="hide_for_hours">Sembunyikan beberapa jam</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">Durasi sembunyi (jam)</label>
                                            <input
                                                type="number"
                                                value={announcementSettings.lineBar.hideDurationHours ?? ''}
                                                onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, lineBar: { ...prev.lineBar, hideDurationHours: Number(e.target.value) || 0 } }))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tanggal Mulai (opsional)</label>
                                <input
                                    type="date"
                                    value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Tanggal Berakhir (opsional)</label>
                                <input
                                    type="date"
                                    value={formData.endDate ? new Date(formData.endDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            {/* Aktif Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Status Aktif</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Pengumuman akan ditampilkan jika aktif</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckIcon className="w-4 h-4" />
                                {editingAnnouncement ? 'Update' : 'Buat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;
