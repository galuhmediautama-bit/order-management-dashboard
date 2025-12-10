import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CheckIcon from '../components/icons/CheckIcon';
import SearchIcon from '../components/icons/SearchIcon';
import FilterIcon from '../components/icons/FilterIcon';
import EyeIcon from '../components/icons/EyeIcon';
import XIcon from '../components/icons/XIcon';
import ExclamationTriangleIcon from '../components/icons/ExclamationTriangleIcon';

interface ErrorLog {
    id: string;
    userId: string | null;
    userEmail: string | null;
    userRole: string | null;
    errorMessage: string;
    errorStack: string | null;
    errorContext: string | null;
    errorType: 'runtime' | 'network' | 'validation' | 'authentication' | 'unknown';
    pageUrl: string | null;
    userAgent: string | null;
    additionalInfo: any;
    resolved: boolean;
    resolvedAt: string | null;
    resolvedBy: string | null;
    notes: string | null;
    createdAt: string;
}

const ErrorLogsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterResolved, setFilterResolved] = useState<string>('all');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    
    // Modal
    const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUser();
        fetchLogs();
    }, []);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
            setCurrentUser(data);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('error_logs')
                .select('*')
                .order('createdAt', { ascending: false })
                .limit(500);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching error logs:', error);
            showToast('Gagal memuat log error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                    log.errorMessage?.toLowerCase().includes(query) ||
                    log.userEmail?.toLowerCase().includes(query) ||
                    log.errorContext?.toLowerCase().includes(query) ||
                    log.pageUrl?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (filterType !== 'all' && log.errorType !== filterType) return false;

            // Resolved filter
            if (filterResolved === 'resolved' && !log.resolved) return false;
            if (filterResolved === 'unresolved' && log.resolved) return false;

            // Date range filter
            if (dateRange.start) {
                const logDate = new Date(log.createdAt);
                const startDate = new Date(dateRange.start);
                if (logDate < startDate) return false;
            }
            if (dateRange.end) {
                const logDate = new Date(log.createdAt);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                if (logDate > endDate) return false;
            }

            return true;
        });
    }, [logs, searchQuery, filterType, filterResolved, dateRange]);

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleMarkResolved = async (log: ErrorLog) => {
        if (!currentUser || currentUser.role !== 'Super Admin') {
            showToast('Hanya Super Admin yang dapat menandai error sebagai resolved', 'error');
            return;
        }

        setProcessingId(log.id);
        try {
            const { error } = await supabase
                .from('error_logs')
                .update({
                    resolved: !log.resolved,
                    resolvedAt: !log.resolved ? new Date().toISOString() : null,
                    resolvedBy: !log.resolved ? currentUser.id : null
                })
                .eq('id', log.id);

            if (error) throw error;

            setLogs(prev => prev.map(l => 
                l.id === log.id 
                    ? { 
                        ...l, 
                        resolved: !l.resolved,
                        resolvedAt: !l.resolved ? new Date().toISOString() : null,
                        resolvedBy: !l.resolved ? currentUser.id : null
                    } 
                    : l
            ));
            showToast(log.resolved ? 'Error ditandai belum resolved' : 'Error ditandai resolved', 'success');
        } catch (error) {
            console.error('Error updating log:', error);
            showToast('Gagal mengupdate status', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedLog || !currentUser) return;

        setProcessingId(selectedLog.id);
        try {
            const { error } = await supabase
                .from('error_logs')
                .update({ notes })
                .eq('id', selectedLog.id);

            if (error) throw error;

            setLogs(prev => prev.map(l => 
                l.id === selectedLog.id ? { ...l, notes } : l
            ));
            showToast('Catatan tersimpan', 'success');
            setShowDetailModal(false);
        } catch (error) {
            console.error('Error saving notes:', error);
            showToast('Gagal menyimpan catatan', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteLog = async (logId: string) => {
        if (!currentUser || currentUser.role !== 'Super Admin') {
            showToast('Hanya Super Admin yang dapat menghapus log', 'error');
            return;
        }

        if (!window.confirm('Apakah Anda yakin ingin menghapus log ini?')) return;

        setProcessingId(logId);
        try {
            const { error } = await supabase
                .from('error_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            setLogs(prev => prev.filter(l => l.id !== logId));
            showToast('Log berhasil dihapus', 'success');
        } catch (error) {
            console.error('Error deleting log:', error);
            showToast('Gagal menghapus log', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleClearAllResolved = async () => {
        if (!currentUser || currentUser.role !== 'Super Admin') {
            showToast('Hanya Super Admin yang dapat menghapus log', 'error');
            return;
        }

        if (!window.confirm('Apakah Anda yakin ingin menghapus semua log yang sudah resolved?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('error_logs')
                .delete()
                .eq('resolved', true);

            if (error) throw error;

            setLogs(prev => prev.filter(l => !l.resolved));
            showToast('Semua log resolved berhasil dihapus', 'success');
        } catch (error) {
            console.error('Error clearing resolved logs:', error);
            showToast('Gagal menghapus log resolved', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openDetailModal = (log: ErrorLog) => {
        setSelectedLog(log);
        setNotes(log.notes || '');
        setShowDetailModal(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getErrorTypeColor = (type: string) => {
        switch (type) {
            case 'runtime': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'network': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'validation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'authentication': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getErrorTypeLabel = (type: string) => {
        switch (type) {
            case 'runtime': return 'Runtime';
            case 'network': return 'Network';
            case 'validation': return 'Validasi';
            case 'authentication': return 'Auth';
            default: return 'Unknown';
        }
    };

    // Stats
    const stats = useMemo(() => {
        const total = logs.length;
        const unresolved = logs.filter(l => !l.resolved).length;
        const today = logs.filter(l => {
            const logDate = new Date(l.createdAt);
            const todayDate = new Date();
            return logDate.toDateString() === todayDate.toDateString();
        }).length;
        const runtime = logs.filter(l => l.errorType === 'runtime').length;
        return { total, unresolved, today, runtime };
    }, [logs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-7 h-7 text-red-500" />
                        Log Error Sistem
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Monitor dan kelola error dari semua pengguna
                    </p>
                </div>
                {currentUser?.role === 'Super Admin' && (
                    <button
                        onClick={handleClearAllResolved}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Hapus Semua Resolved
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Error</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Belum Resolved</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.unresolved}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hari Ini</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.today}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Runtime Errors</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.runtime}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari error message, email, context..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Semua Tipe</option>
                        <option value="runtime">Runtime</option>
                        <option value="network">Network</option>
                        <option value="validation">Validasi</option>
                        <option value="authentication">Authentication</option>
                        <option value="unknown">Unknown</option>
                    </select>

                    {/* Resolved Filter */}
                    <select
                        value={filterResolved}
                        onChange={(e) => { setFilterResolved(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Semua Status</option>
                        <option value="unresolved">Belum Resolved</option>
                        <option value="resolved">Sudah Resolved</option>
                    </select>

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setCurrentPage(1); }}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setCurrentPage(1); }}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <FilterIcon className="w-4 h-4" />}
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                        <ExclamationTriangleIcon className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-lg font-medium">Tidak ada error log</p>
                        <p className="text-sm">Sistem berjalan dengan baik!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Waktu</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tipe</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Context</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Error Message</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedLogs.map((log) => (
                                    <tr key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${log.resolved ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {formatDate(log.createdAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                <p className="text-slate-800 dark:text-white font-medium truncate max-w-[150px]">
                                                    {log.userEmail || 'Anonymous'}
                                                </p>
                                                {log.userRole && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{log.userRole}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getErrorTypeColor(log.errorType)}`}>
                                                {getErrorTypeLabel(log.errorType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[120px] block">
                                                {log.errorContext || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-slate-800 dark:text-white truncate max-w-[250px]" title={log.errorMessage}>
                                                {log.errorMessage}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.resolved ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckIcon className="w-3 h-3" />
                                                    Resolved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                                    Unresolved
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openDetailModal(log)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                    title="Lihat Detail"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                {currentUser?.role === 'Super Admin' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkResolved(log)}
                                                            disabled={processingId === log.id}
                                                            className={`p-1.5 rounded-lg transition-colors ${log.resolved ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                                            title={log.resolved ? 'Tandai Unresolved' : 'Tandai Resolved'}
                                                        >
                                                            {processingId === log.id ? (
                                                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckIcon className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLog(log.id)}
                                                            disabled={processingId === log.id}
                                                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Hapus Log"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} log
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                                Detail Error Log
                            </h3>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Waktu</label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">{formatDate(selectedLog.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipe Error</label>
                                    <p className="mt-1">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getErrorTypeColor(selectedLog.errorType)}`}>
                                            {getErrorTypeLabel(selectedLog.errorType)}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">User Email</label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">{selectedLog.userEmail || 'Anonymous'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">User Role</label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">{selectedLog.userRole || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Context / Component</label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1">{selectedLog.errorContext || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Page URL</label>
                                    <p className="text-sm text-slate-800 dark:text-white mt-1 break-all">{selectedLog.pageUrl || '-'}</p>
                                </div>
                            </div>

                            {/* Error Message */}
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Error Message</label>
                                <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-300 font-mono break-words">{selectedLog.errorMessage}</p>
                                </div>
                            </div>

                            {/* Stack Trace */}
                            {selectedLog.errorStack && (
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Stack Trace</label>
                                    <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg max-h-48 overflow-y-auto">
                                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">{selectedLog.errorStack}</pre>
                                    </div>
                                </div>
                            )}

                            {/* User Agent */}
                            {selectedLog.userAgent && (
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">User Agent</label>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-all">{selectedLog.userAgent}</p>
                                </div>
                            )}

                            {/* Additional Info */}
                            {selectedLog.additionalInfo && Object.keys(selectedLog.additionalInfo).length > 0 && (
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Additional Info</label>
                                    <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{JSON.stringify(selectedLog.additionalInfo, null, 2)}</pre>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {currentUser?.role === 'Super Admin' && (
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Catatan</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tambahkan catatan tentang error ini..."
                                        className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Tutup
                            </button>
                            {currentUser?.role === 'Super Admin' && (
                                <>
                                    <button
                                        onClick={() => handleMarkResolved(selectedLog)}
                                        disabled={processingId === selectedLog.id}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedLog.resolved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'}`}
                                    >
                                        {selectedLog.resolved ? 'Tandai Unresolved' : 'Tandai Resolved'}
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={processingId === selectedLog.id}
                                        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {processingId === selectedLog.id ? 'Menyimpan...' : 'Simpan Catatan'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ErrorLogsPage;
