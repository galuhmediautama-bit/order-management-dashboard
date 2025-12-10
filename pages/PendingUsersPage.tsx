import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { paginateArray, PAGE_SIZES } from '../utils/pagination';

const PendingUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const { showToast } = useToast();
    const navigate = useNavigate();

    // --- Pagination State ---
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES.SMALL); // default 10 per page
    const [page, setPage] = useState<number>(1);

    const paginationResult = useMemo(() => {
        if (!users || users.length === 0) {
            return {
                data: [],
                page: 1,
                pageSize,
                total: 0,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
        }

        // pageSize === 0 means show all
        const effectivePageSize = pageSize === 0 ? Math.max(1, users.length) : pageSize;
        return paginateArray(users, page, effectivePageSize);
    }, [users, page, pageSize]);

    const paginatedUsers = paginationResult.data;
    const totalPages = paginationResult.totalPages;

    // Reset to first page when pageSize changes
    useEffect(() => {
        setPage(1);
    }, [pageSize, users]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('users').select('*').eq('status', 'Tidak Aktif');
            if (error) {
                console.error('Error fetching pending users:', error);
                showToast('Gagal mengambil pengguna pending', 'error');
                setUsers([]);
            } else {
                setUsers((data || []).map(d => ({ ...d } as User)));
            }
        } catch (e) {
            console.error(e);
            showToast('Terjadi kesalahan saat mengambil data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const approveUser = async (id: string) => {
        // SECURITY: Check if user is trying to approve Super Admin
        const user = users.find(u => u.id === id);
        if (user?.role === 'Super Admin' && user?.email !== 'galuhmediautama@gmail.com') {
            showToast('⛔ FORBIDDEN: Only galuhmediautama@gmail.com can have Super Admin role!', 'error');
            return;
        }
        
        const { error } = await supabase.from('users').update({ status: 'Aktif' }).eq('id', id);
        if (error) {
            console.error('Approve error:', error);
            showToast('Gagal mengapprove pengguna', 'error');
        } else {
            showToast('Pengguna disetujui', 'success');
            fetchPending();
        }
    };

    const bulkApprove = async () => {
        const ids = Object.keys(selected).filter(k => selected[k]);
        if (ids.length === 0) return showToast('Pilih minimal satu pengguna', 'warning');
        
        // SECURITY: Check if any selected user has Super Admin role (except galuhmediautama@gmail.com)
        const invalidUsers = users.filter(u => 
            ids.includes(u.id) && 
            u.role === 'Super Admin' && 
            u.email !== 'galuhmediautama@gmail.com'
        );
        
        if (invalidUsers.length > 0) {
            showToast('⛔ FORBIDDEN: Cannot approve users with Super Admin role!', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const { error } = await supabase.from('users').update({ status: 'Aktif' }).in('id', ids);
            if (error) {
                console.error('Bulk approve error:', error);
                showToast('Gagal mengapprove beberapa pengguna', 'error');
            } else {
                showToast(`${ids.length} pengguna telah disetujui`, 'success');
                setSelected({});
                fetchPending();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Pengguna Menunggu Approval</h1>
                    <p className="text-sm text-gray-500">Review dan setujui pendaftar baru.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/settings')} className="px-3 py-1 border rounded">Kembali ke Pengguna</button>
                    <button onClick={bulkApprove} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve Terpilih</button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded shadow p-4">
                {loading ? (
                    <div>Memuat...</div>
                ) : users.length === 0 ? (
                    <div className="text-center text-gray-500">Tidak ada pengguna menunggu approval.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-3 py-2"><input type="checkbox" onChange={(e) => {
                                    const checked = e.target.checked;
                                    const s: Record<string, boolean> = {};
                                    paginatedUsers.forEach(u => s[u.id] = checked);
                                    setSelected(s);
                                }} /></th>
                                <th className="px-3 py-2">Nama</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">WhatsApp</th>
                                <th className="px-3 py-2">Alamat</th>
                                <th className="px-3 py-2">Peran</th>
                                <th className="px-3 py-2">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.map(u => (
                                <tr key={u.id} className="border-b dark:border-gray-700">
                                    <td className="px-3 py-2"><input type="checkbox" checked={!!selected[u.id]} onChange={(e) => setSelected(s => ({ ...s, [u.id]: e.target.checked }))} /></td>
                                    <td className="px-3 py-2">{u.name}</td>
                                    <td className="px-3 py-2">{u.email}</td>
                                    <td className="px-3 py-2">{u.phone || '-'}</td>
                                    <td className="px-3 py-2 text-xs">{u.address || '-'}</td>
                                    <td className="px-3 py-2">{u.role}</td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => approveUser(u.id)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination Controls */}
                {users.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600 dark:text-slate-400">Tampilkan:</label>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(parseInt(e.target.value, 10))}
                                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-green-500 outline-none text-sm"
                            >
                                <option value={PAGE_SIZES.SMALL}>10</option>
                                <option value={PAGE_SIZES.MEDIUM}>25</option>
                                <option value={PAGE_SIZES.LARGE}>50</option>
                                <option value={PAGE_SIZES.EXTRA_LARGE}>100</option>
                                <option value={0}>Semua</option>
                            </select>
                            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-semibold text-sm">Total: {users.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))} 
                                disabled={page <= 1} 
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                Prev
                            </button>
                            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-semibold text-sm">
                                Halaman {page} / {totalPages}
                            </div>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                                disabled={page >= totalPages} 
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingUsersPage;
