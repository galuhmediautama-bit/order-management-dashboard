
import React, { useState, useEffect } from 'react';
import type { Order } from '../types';
import { supabase } from '../firebase';
import { capitalizeWords } from '../utils';
import TrashIcon from '../components/icons/TrashIcon';

const PermanentDeleteModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: (orderId: string) => void;
}> = ({ order, onClose, onConfirm }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-4">Hapus Pesanan Permanen</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Anda yakin ingin menghapus pesanan <span className="font-bold">{order.id.substring(0, 6)}...</span> secara permanen? Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg">Batal</button>
                <button onClick={() => onConfirm(order.id)} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">Ya, Hapus Permanen</button>
            </div>
        </div>
    </div>
);


const DeletionRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('orders').select('*').eq('status', 'Pending Deletion');
            const requestsList = (data || []).map(doc => {
                const dateString = doc.date; // Supabase usually returns ISO string
                return { ...doc, date: dateString } as Order;
            });
            setRequests(requestsList);
        } catch (error) {
            console.error("Error fetching deletion requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleRestore = async (orderId: string) => {
        try {
            await supabase.from('orders').update({ status: 'Pending' }).eq('id', orderId);
            setRequests(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            console.error("Error restoring order:", error);
        }
    };

    const handlePermanentDelete = async (orderId: string) => {
        try {
            await supabase.from('orders').delete().eq('id', orderId);
            setRequests(prev => prev.filter(o => o.id !== orderId));
        } catch (error) {
            console.error("Error permanently deleting order:", error);
        } finally {
            setOrderToDelete(null);
        }
    };
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Permintaan Hapus Pesanan</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Tinjau, pulihkan, atau hapus pesanan secara permanen.</p>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Memuat permintaan...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Tidak ada permintaan hapus pesanan.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Order ID</th>
                                    <th className="px-6 py-3 font-medium">Pelanggan</th>
                                    <th className="px-6 py-3 font-medium">Tanggal Pesanan</th>
                                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {requests.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400" title={order.id}>{order.id.substring(0, 6)}...</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{capitalizeWords(order.customer)}</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{order.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-4">
                                                <button onClick={() => handleRestore(order.id)} className="text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">Pulihkan</button>
                                                <button onClick={() => setOrderToDelete(order)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Hapus Permanen</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {orderToDelete && (
                <PermanentDeleteModal 
                    order={orderToDelete} 
                    onClose={() => setOrderToDelete(null)} 
                    onConfirm={handlePermanentDelete} 
                />
            )}
        </div>
    );
};

export default DeletionRequestsPage;
