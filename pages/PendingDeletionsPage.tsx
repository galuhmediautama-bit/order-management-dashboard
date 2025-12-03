import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import TrashIcon from '../components/icons/TrashIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import ClockIcon from '../components/icons/ClockIcon';

interface PendingDeletion {
    id: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalPrice: number;
    requestedBy: string;
    requestedByEmail: string;
    requestedAt: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
}

const PendingDeletionsPage: React.FC = () => {
    const { t } = useLanguage();
    const [deletions, setDeletions] = useState<PendingDeletion[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        fetchCurrentUser();
        fetchDeletions();
    }, [filter]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
            setCurrentUser(data);
        }
    };

    const fetchDeletions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('pending_deletions')
                .select('*')
                .order('requestedAt', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            setDeletions(data || []);
        } catch (error) {
            console.error('Error fetching deletions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (deletion: PendingDeletion) => {
        if (!currentUser || currentUser.role !== 'Super admin') {
            alert('Hanya Super Admin yang dapat menyetujui penghapusan!');
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin MENGHAPUS PERMANEN pesanan #${deletion.orderNumber}?\n\nData tidak dapat dikembalikan!`)) {
            return;
        }

        setProcessing(deletion.id);
        try {
            // Delete the actual order
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', deletion.orderId);

            if (deleteError) throw deleteError;

            // Update deletion status
            const { error: updateError } = await supabase
                .from('pending_deletions')
                .update({ 
                    status: 'approved',
                    approvedBy: currentUser.email,
                    approvedAt: new Date().toISOString()
                })
                .eq('id', deletion.id);

            if (updateError) throw updateError;

            alert('✅ Pesanan berhasil dihapus permanen!');
            fetchDeletions();
        } catch (error: any) {
            console.error('Error approving deletion:', error);
            alert('❌ Gagal menghapus pesanan: ' + error.message);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (deletion: PendingDeletion) => {
        if (!currentUser || currentUser.role !== 'Super admin') {
            alert('Hanya Super Admin yang dapat menolak penghapusan!');
            return;
        }

        const reason = prompt('Alasan penolakan (opsional):');

        setProcessing(deletion.id);
        try {
            // Update deletion status
            const { error } = await supabase
                .from('pending_deletions')
                .update({ 
                    status: 'rejected',
                    rejectedBy: currentUser.email,
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: reason || undefined
                })
                .eq('id', deletion.id);

            if (error) throw error;

            alert('✅ Permintaan penghapusan ditolak!');
            fetchDeletions();
        } catch (error: any) {
            console.error('Error rejecting deletion:', error);
            alert('❌ Gagal menolak: ' + error.message);
        } finally {
            setProcessing(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (currentUser && currentUser.role !== 'Super admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md">
                    <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        Akses Ditolak
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Hanya Super Admin yang dapat mengakses halaman ini.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg">
                        <TrashIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                            Pending Deletions
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Kelola permintaan penghapusan pesanan (Super Admin Only)
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    {[
                        { key: 'pending', label: 'Pending', icon: '⏳' },
                        { key: 'approved', label: 'Approved', icon: '✅' },
                        { key: 'rejected', label: 'Rejected', icon: '❌' },
                        { key: 'all', label: 'All', icon: '📋' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                                filter === tab.key
                                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <SpinnerIcon className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && deletions.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <TrashIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Tidak ada permintaan
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        Tidak ada permintaan penghapusan dengan status "{filter}"
                    </p>
                </div>
            )}

            {/* Deletions List */}
            {!loading && deletions.length > 0 && (
                <div className="space-y-4">
                    {deletions.map(deletion => (
                        <div
                            key={deletion.id}
                            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                                deletion.status === 'pending' 
                                    ? 'border-orange-200 dark:border-orange-900/50' 
                                    : deletion.status === 'approved'
                                    ? 'border-green-200 dark:border-green-900/50'
                                    : 'border-red-200 dark:border-red-900/50'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Order Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                            #{deletion.orderNumber}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            deletion.status === 'pending'
                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                : deletion.status === 'approved'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                        }`}>
                                            {deletion.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                                            <p className="font-semibold text-slate-900 dark:text-white">{deletion.customerName}</p>
                                            <p className="text-slate-600 dark:text-slate-400">{deletion.customerPhone}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Total:</span>
                                            <p className="font-bold text-lg text-green-600 dark:text-green-400">
                                                {formatCurrency(deletion.totalPrice)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Requested by:</span>
                                            <p className="font-semibold text-slate-900 dark:text-white">{deletion.requestedBy}</p>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{deletion.requestedByEmail}</p>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 dark:text-slate-400">Requested at:</span>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                <ClockIcon className="w-4 h-4 inline mr-1" />
                                                {formatDate(deletion.requestedAt)}
                                            </p>
                                        </div>
                                        {deletion.reason && (
                                            <div className="md:col-span-2">
                                                <span className="text-slate-500 dark:text-slate-400">Reason:</span>
                                                <p className="text-slate-700 dark:text-slate-300 italic">"{deletion.reason}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {deletion.status === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(deletion)}
                                            disabled={processing === deletion.id}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {processing === deletion.id ? (
                                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircleFilledIcon className="w-4 h-4" />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(deletion)}
                                            disabled={processing === deletion.id}
                                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {processing === deletion.id ? (
                                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircleIcon className="w-4 h-4" />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingDeletionsPage;
