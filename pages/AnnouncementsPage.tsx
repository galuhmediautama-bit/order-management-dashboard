import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import type { Announcement, AnnouncementType, AnnouncementDisplayMode } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import { useToast } from '../contexts/ToastContext';

const AnnouncementsPage: React.FC = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState<Partial<Announcement>>({
        title: '',
        message: '',
        type: 'info',
        displayMode: 'both',
        isActive: true,
    });
    const { showToast } = useToast();

    useEffect(() => {
        fetchAnnouncements();
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

    const handleOpenModal = (announcement?: Announcement) => {
        if (announcement) {
            setEditingAnnouncement(announcement);
            setFormData(announcement);
        } else {
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                message: '',
                type: 'info',
                displayMode: 'both',
                isActive: true,
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
            displayMode: 'both',
            isActive: true,
        });
    };

    const handleSave = async () => {
        if (!formData.title?.trim() || !formData.message?.trim()) {
            showToast('Judul dan pesan harus diisi', 'error');
            return;
        }

        try {
            if (editingAnnouncement) {
                // Update existing
                const { error } = await supabase
                    .from('announcements')
                    .update({
                        title: formData.title,
                        message: formData.message,
                        type: formData.type,
                        displayMode: formData.displayMode,
                        isActive: formData.isActive,
                        startDate: formData.startDate,
                        endDate: formData.endDate,
                        updatedAt: new Date().toISOString(),
                    })
                    .eq('id', editingAnnouncement.id);

                if (error) throw error;
                showToast('Pengumuman berhasil diupdate', 'success');
            } else {
                // Create new
                const { error } = await supabase.from('announcements').insert({
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    displayMode: formData.displayMode,
                    isActive: formData.isActive,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    order: announcements.length + 1,
                });

                if (error) throw error;
                showToast('Pengumuman berhasil dibuat', 'success');
            }

            handleCloseModal();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            showToast('Gagal menyimpan pengumuman', 'error');
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">
                            📢 Kelola Pengumuman
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Buat dan kelola pengumuman yang akan ditampilkan kepada pengguna</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl hover:from-indigo-700 hover:to-cyan-700 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tambah Pengumuman</span>
                    </button>
                    <button
                        onClick={() => navigate('/pengaturan')}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-slate-600 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <SettingsIcon className="w-5 h-5" />
                        <span>Pengaturan</span>
                    </button>
                </div>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Belum ada pengumuman. Buat yang pertama!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {announcements.map(announcement => (
                        <div key={announcement.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <div className={`p-4 border-b border-slate-200 dark:border-slate-700 ${getTypeColor(announcement.type)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg line-clamp-2">{announcement.title}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(announcement.type)}`}>
                                                {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                                            </span>
                                            <span className="text-xs font-medium">{announcement.displayMode === 'both' ? 'Pop-up & Bar' : announcement.displayMode === 'popup' ? 'Pop-up' : 'Bar'}</span>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-lg ${announcement.isActive ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        <div className={`w-3 h-3 rounded-full ${announcement.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-3 mb-3">{announcement.message}</p>
                                
                                {(announcement.startDate || announcement.endDate) && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                        {announcement.startDate && <div>📅 Mulai: {new Date(announcement.startDate).toLocaleDateString('id-ID')}</div>}
                                        {announcement.endDate && <div>📅 Berakhir: {new Date(announcement.endDate).toLocaleDateString('id-ID')}</div>}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(announcement)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg font-semibold transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(announcement.id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-semibold transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>Hapus</span>
                                    </button>
                                </div>
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
                            {/* Judul */}
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

                            {/* Pesan */}
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

                            {/* Display Mode */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Mode Tampil</label>
                                <select
                                    value={formData.displayMode || 'both'}
                                    onChange={(e) => setFormData({ ...formData, displayMode: e.target.value as AnnouncementDisplayMode })}
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                >
                                    <option value="both">Pop-up & Baris Bar</option>
                                    <option value="popup">Hanya Pop-up</option>
                                    <option value="linebar">Hanya Baris Bar</option>
                                </select>
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
