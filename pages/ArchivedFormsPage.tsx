import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import { Form } from '../types';
import SearchIcon from '../components/icons/SearchIcon';
import ArchiveIcon from '../components/icons/ArchiveIcon';
import EyeIcon from '../components/icons/EyeIcon';
import { useToast } from '../contexts/ToastContext';

const ArchivedFormsPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [forms, setForms] = useState<Form[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchArchivedForms();
        }
    }, [currentUser]);

    const fetchCurrentUser = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.session.user.id)
                    .single();
                setCurrentUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    };

    const fetchArchivedForms = async () => {
        if (!currentUser) return;
        
        setIsLoading(true);
        try {
            let query = supabase
                .from('forms')
                .select('*')
                .eq('isDeleted', true)
                .order('deletedAt', { ascending: false });

            // Filter by brand for non-Super Admin users
            if (currentUser.role !== 'Super Admin' && currentUser.assignedBrandIds?.length > 0) {
                query = query.in('brandId', currentUser.assignedBrandIds);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            setForms(data || []);
        } catch (error) {
            console.error('Error fetching archived forms:', error);
            showToast('Gagal mengambil data arsip formulir', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (formId: string) => {
        if (!confirm('Apakah Anda yakin ingin mengembalikan formulir ini?')) return;

        try {
            const { error } = await supabase
                .from('forms')
                .update({
                    isDeleted: false,
                    deletedAt: null,
                    deletedBy: null,
                })
                .eq('id', formId);

            if (error) throw error;

            showToast('Formulir berhasil dikembalikan', 'success');
            fetchArchivedForms();
        } catch (error) {
            console.error('Error restoring form:', error);
            showToast('Gagal mengembalikan formulir', 'error');
        }
    };

    const handlePermanentDelete = async (formId: string) => {
        if (!confirm('PERINGATAN: Formulir akan dihapus permanen dan tidak bisa dikembalikan. Lanjutkan?')) return;

        try {
            const { error } = await supabase
                .from('forms')
                .delete()
                .eq('id', formId);

            if (error) throw error;

            showToast('Formulir berhasil dihapus permanen', 'success');
            fetchArchivedForms();
        } catch (error) {
            console.error('Error deleting form:', error);
            showToast('Gagal menghapus formulir', 'error');
        }
    };

    const filteredForms = forms.filter(form =>
        form.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.identifier?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Arsip Formulir
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Formulir yang telah dihapus ({filteredForms.length})
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari formulir..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : filteredForms.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <ArchiveIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                        {searchQuery ? 'Tidak ada formulir yang cocok dengan pencarian' : 'Belum ada formulir yang diarsipkan'}
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Nama Formulir
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Identifier
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Dihapus Pada
                                </th>
                                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                            {filteredForms.map((form) => (
                                <tr key={form.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                                        {form.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                        {form.identifier}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {formatDate(form.deletedAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => navigate(`/formulir/${form.id}`)}
                                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 rounded-lg transition"
                                                title="Lihat Detail"
                                            >
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleRestore(form.id)}
                                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 text-green-600 dark:text-green-400 rounded-lg transition"
                                                title="Kembalikan"
                                            >
                                                <ArchiveIcon className="w-5 h-5" />
                                            </button>
                                            {currentUser?.role === 'Super Admin' && (
                                                <button
                                                    onClick={() => handlePermanentDelete(form.id)}
                                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 text-red-600 dark:text-red-400 rounded-lg transition"
                                                    title="Hapus Permanen"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">Informasi Arsip:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                            <li>Formulir yang diarsipkan masih dapat dikembalikan</li>
                            <li>Klik tombol hijau untuk mengembalikan formulir</li>
                            {currentUser?.role === 'Super Admin' && (
                                <li className="text-red-600 dark:text-red-400">Super Admin dapat menghapus formulir secara permanen</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArchivedFormsPage;
