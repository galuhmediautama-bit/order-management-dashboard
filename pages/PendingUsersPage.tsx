import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';
import { Link, useNavigate } from 'react-router-dom';

const PendingUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const { showToast } = useToast();
    const navigate = useNavigate();

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
                                    users.forEach(u => s[u.id] = checked);
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
                            {users.map(u => (
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
            </div>
        </div>
    );
};

export default PendingUsersPage;
