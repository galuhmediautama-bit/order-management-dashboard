
import React, { useState, useMemo, useEffect } from 'react';
import type { Customer, Order } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import SearchIcon from '../components/icons/SearchIcon';
import XIcon from '../components/icons/XIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import CustomerScoreBadge from '../components/CustomerScoreBadge';
import ClipboardListIcon from '../components/icons/ClipboardListIcon';
import StatusBadge from '../components/StatusBadge';
import DownloadIcon from '../components/icons/DownloadIcon';
import FilterIcon from '../components/icons/FilterIcon';
import UserIcon from '../components/icons/UserIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { supabase } from '../firebase';
import { capitalizeWords } from '../utils';
import { paginateArray, PAGE_SIZES } from '../utils/pagination';
import { useToast } from '../contexts/ToastContext';
import AddressInput, { type AddressData } from '../components/AddressInput';


const calculateCODScore = (customer: Customer): { score: string; rate: number | null; display: string } => {
    const totalCOD = customer.totalCODOrders ?? 0;
    const successfulCOD = customer.successfulCODOrders ?? 0;

    // No Data: belum ada COD history
    if (totalCOD === 0) {
        return { score: 'No Data', rate: null, display: 'No Data' };
    }

    const successRate = (successfulCOD / totalCOD) * 100;

    // Kategori scoring berdasarkan success rate
    if (successRate >= 98) {
        return { score: 'A', rate: successRate, display: `A (${successRate.toFixed(1)}%)` };
    } else if (successRate >= 90) {
        return { score: 'B', rate: successRate, display: `B (${successRate.toFixed(1)}%)` };
    } else if (successRate >= 80) {
        return { score: 'C', rate: successRate, display: `C (${successRate.toFixed(1)}%)` };
    } else if (successRate >= 50) {
        return { score: 'D', rate: successRate, display: `D (${successRate.toFixed(1)}%)` };
    } else {
        return { score: 'E', rate: successRate, display: `E (${successRate.toFixed(1)}%)` };
    }
};

const calculateCustomerScore = (customer: Customer): number => {
    // Legacy numeric score for VIP calculation (kept for backwards compatibility)
    let score = 3.0;

    if (customer.totalSpent > 2000000) score += 1;
    else if (customer.totalSpent > 500000) score += 0.5;

    if (customer.orderCount > 7) score += 1;
    else if (customer.orderCount > 3) score += 0.5;

    const rejectionRate = customer.orderCount > 0 ? customer.rejectedOrders / customer.orderCount : 0;
    if (rejectionRate > 0.5) score -= 2.5;
    else if (rejectionRate > 0.2) score -= 1.5;
    else if (customer.rejectedOrders > 0) score -= 0.5;

    const joinDate = new Date(customer.joinDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (joinDate < oneYearAgo) score += 0.5;

    return Math.max(1, Math.min(5, score));
};


const CustomerModal: React.FC<{
    customer: Customer | null;
    onClose: () => void;
    onSave: (customer: Customer) => void;
}> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Customer>(
        customer || { id: '', name: '', email: '', phone: '', address: '', rejectedOrders: 0, orderCount: 0, totalSpent: 0, joinDate: new Date().toISOString().split('T')[0] }
    );
    const [addressData, setAddressData] = useState<AddressData>({
        province: '',
        city: '',
        district: '',
        postalCode: '',
        detailAddress: '',
        fullAddress: customer?.address || ''
    });
    const isEditing = !!customer?.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.email) {
            onSave(formData);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                <form onSubmit={handleSave}>
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div><label className="text-base font-medium text-slate-700 dark:text-slate-300">Nama Lengkap*</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600" required /></div>
                        <div><label className="text-base font-medium text-slate-700 dark:text-slate-300">Email*</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600" required /></div>
                        <div><label className="text-base font-medium text-slate-700 dark:text-slate-300">Nomor Telepon</label><input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                        <div><AddressInput value={addressData} onChange={(data) => { setAddressData(data); setFormData({ ...formData, address: data.fullAddress }); }} /></div>
                        <div><label className="text-base font-medium text-slate-700 dark:text-slate-300">Pesanan Ditolak</label><input type="number" name="rejectedOrders" value={formData.rejectedOrders || 0} onChange={handleChange} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OrderHistoryModal: React.FC<{
    customer: Customer;
    orders: Order[];
    onClose: () => void;
}> = ({ customer, orders, onClose }) => {
    const customerOrders = useMemo(() => {
        return orders.filter(order => order.customer === customer.name);
    }, [customer, orders]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Riwayat Pesanan: {capitalizeWords(customer.name)}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {customerOrders.length > 0 ? (
                        <table className="w-full text-base text-left">
                            <thead className="text-sm text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Order ID</th>
                                    <th className="px-4 py-3 font-medium">Tanggal</th>
                                    <th className="px-4 py-3 font-medium">Produk</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {customerOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-3 font-mono text-sm text-indigo-600 dark:text-indigo-400">#{order.id.substring(0, 8)}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(order.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{order.productName}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">Rp {order.totalPrice?.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">Belum ada riwayat pesanan.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [viewHistoryCustomer, setViewHistoryCustomer] = useState<Customer | null>(null);
    const [scoreFilter, setScoreFilter] = useState<'all' | 'a' | 'b' | 'c' | 'd' | 'e' | 'nodata'>('all');
    const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const { showToast } = useToast();

    const fetchCustomersAndOrders = async () => {
        setLoading(true);
        try {
            // Fetch Orders to aggregate customer data
            const { data: ordersData } = await supabase.from('orders').select('*');
            const ordersList = (ordersData || []) as Order[];
            setOrders(ordersList);

            // Fetch explicitly saved customers (if any)
            // In this architecture, customers might be derived from orders or a separate table.
            // Assuming we use a 'customers' table for explicit management, but fallback to orders aggregation.

            // For now, let's aggregate from orders as "Implicit Customers" + "Explicit Customers from Table"
            // Or just use the 'customers' table if you have one.
            // Let's assume we have a 'customers' table.
            const { data: customersData, error } = await supabase.from('customers').select('*');

            let customersList: Customer[] = [];

            if (!error && customersData) {
                customersList = customersData as Customer[];
            } else {
                // Aggregate from orders if table empty or error (as fallback for first run)
                const customerMap = new Map<string, Customer>();

                ordersList.forEach(order => {
                    // Use Name + Phone as unique key
                    const key = `${order.customer}-${order.customerPhone}`;
                    if (!customerMap.has(key)) {
                        customerMap.set(key, {
                            id: `cust_${key}`,
                            name: order.customer,
                            email: order.customerEmail,
                            phone: order.customerPhone,
                            address: order.shippingAddress,
                            orderCount: 0,
                            totalSpent: 0,
                            rejectedOrders: 0,
                            totalCODOrders: 0,
                            successfulCODOrders: 0,
                            joinDate: order.date
                        });
                    }

                    const cust = customerMap.get(key)!;
                    cust.orderCount += 1;
                    cust.totalSpent += (order.totalPrice || 0);
                    if (order.status === 'Canceled') cust.rejectedOrders += 1;

                    // Track COD orders
                    const isCOD = order.paymentMethod?.toLowerCase().includes('cod') || order.paymentMethod?.toLowerCase().includes('bayar di tempat');
                    if (isCOD) {
                        cust.totalCODOrders = (cust.totalCODOrders || 0) + 1;
                        if (order.status === 'Delivered') {
                            cust.successfulCODOrders = (cust.successfulCODOrders || 0) + 1;
                        }
                    }

                    if (new Date(order.date) < new Date(cust.joinDate)) cust.joinDate = order.date;
                });

                customersList = Array.from(customerMap.values());
            }

            setCustomers(customersList);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomersAndOrders();
    }, []);

    const filteredCustomers = useMemo(() => {
        let results = customers;

        // Score filter
        if (scoreFilter !== 'all') {
            results = results.filter(c => {
                const codScore = calculateCODScore(c).score.toLowerCase();
                return codScore === scoreFilter;
            });
        }

        // Search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            results = results.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                c.phone.includes(lower) ||
                c.email.toLowerCase().includes(lower)
            );
        }

        return results;
    }, [customers, searchTerm, scoreFilter]);

    // --- Pagination State ---
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES.SMALL); // default 10 per page
    const [page, setPage] = useState<number>(1);

    // Reset to first page when filters/search/pageSize change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, scoreFilter, pageSize, customers]);

    const paginationResult = useMemo(() => {
        if (!filteredCustomers || filteredCustomers.length === 0) {
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
        const effectivePageSize = pageSize === 0 ? Math.max(1, filteredCustomers.length) : pageSize;
        return paginateArray(filteredCustomers, page, effectivePageSize);
    }, [filteredCustomers, page, pageSize]);

    const paginatedCustomers = paginationResult.data;
    const totalPages = paginationResult.totalPages;

    // Statistics
    const stats = useMemo(() => {
        const scoreA = customers.filter(c => calculateCODScore(c).score === 'A').length;
        const scoreB = customers.filter(c => calculateCODScore(c).score === 'B').length;
        const totalCODOrders = customers.reduce((sum, c) => sum + (c.totalCODOrders || 0), 0);
        const successfulCOD = customers.reduce((sum, c) => sum + (c.successfulCODOrders || 0), 0);
        const overallSuccessRate = totalCODOrders > 0 ? (successfulCOD / totalCODOrders) * 100 : 0;

        return {
            total: customers.length,
            scoreA: scoreA,
            scoreB: scoreB,
            totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
            avgOrderValue: customers.length > 0
                ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.orderCount, 0)
                : 0,
            overallCODSuccessRate: overallSuccessRate
        };
    }, [customers]);

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const dataToExport = filteredCustomers.map(customer => {
                const codScore = calculateCODScore(customer);
                return {
                    'Nama': customer.name,
                    'Email': customer.email,
                    'Telepon': customer.phone,
                    'Alamat': customer.address,
                    'Total Belanja': customer.totalSpent,
                    'Jumlah Pesanan': customer.orderCount,
                    'Pesanan Ditolak': customer.rejectedOrders,
                    'Total COD': customer.totalCODOrders || 0,
                    'COD Berhasil': customer.successfulCODOrders || 0,
                    'COD Score': codScore.display,
                    'Success Rate': codScore.rate !== null ? `${codScore.rate.toFixed(1)}%` : 'N/A',
                    'Bergabung': new Date(customer.joinDate).toLocaleDateString('id-ID')
                };
            });

            const csv = [
                Object.keys(dataToExport[0] || {}).join(','),
                ...dataToExport.map(row => Object.values(row).map(v => `\"${v}\"`).join(','))
            ].join('\\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `database-pelanggan_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            showToast('Data berhasil diekspor!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Gagal mengekspor data', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCustomers.size === 0) return;

        if (!window.confirm(`Hapus ${selectedCustomers.size} pelanggan terpilih?`)) return;

        try {
            for (const customerId of selectedCustomers) {
                await supabase.from('customers').delete().eq('id', customerId);
            }
            setCustomers(prev => prev.filter(c => !selectedCustomers.has(c.id)));
            setSelectedCustomers(new Set());
            showToast(`${selectedCustomers.size} pelanggan berhasil dihapus`, 'success');
        } catch (error) {
            console.error('Bulk delete error:', error);
            showToast('Gagal menghapus pelanggan', 'error');
        }
    };

    const handleToggleSelect = (customerId: string) => {
        const newSet = new Set(selectedCustomers);
        if (newSet.has(customerId)) {
            newSet.delete(customerId);
        } else {
            newSet.add(customerId);
        }
        setSelectedCustomers(newSet);
    };

    const handleToggleSelectAll = () => {
        if (selectedCustomers.size === paginatedCustomers.length && paginatedCustomers.length > 0) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(paginatedCustomers.map(c => c.id)));
        }
    };

    const handleOpenModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSaveCustomer = async (customer: Customer) => {
        try {
            if (customer.id.startsWith('cust_')) {
                // Convert implicit to explicit
                const { id, ...data } = customer;
                await supabase.from('customers').insert(data);
            } else if (customer.id) {
                await supabase.from('customers').update(customer).eq('id', customer.id);
            } else {
                await supabase.from('customers').insert(customer);
            }
            fetchCustomersAndOrders();
            showToast('Pelanggan berhasil disimpan', 'success');
        } catch (error) {
            console.error("Error saving customer:", error);
            showToast('Gagal menyimpan pelanggan', 'error');
        } finally {
            setIsModalOpen(false);
            setEditingCustomer(null);
        }
    };

    const handleDeleteCustomer = async (customerId: string) => {
        if (window.confirm("Hapus pelanggan ini?")) {
            try {
                await supabase.from('customers').delete().eq('id', customerId);
                setCustomers(prev => prev.filter(c => c.id !== customerId));
                showToast('Pelanggan berhasil dihapus', 'success');
            } catch (error) {
                console.error("Error deleting customer:", error);
                showToast('Gagal menghapus pelanggan', 'error');
            }
        }
    };

    const handleViewHistory = (customer: Customer) => {
        setViewHistoryCustomer(customer);
        setIsHistoryOpen(true);
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-blue-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Database Pelanggan</h1>
                    </div>
                    <p className="ml-13 text-base text-slate-600 dark:text-slate-400">Kelola data pelanggan dan riwayat pesanan mereka.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting || filteredCustomers.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isExporting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                        <span>Ekspor CSV</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>Tambah Pelanggan</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold">{stats.total}</span>
                    </div>
                    <h3 className="text-sm font-medium text-blue-100 mt-2">Total Pelanggan</h3>
                    <p className="text-xs text-blue-200">Semua database</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        </div>
                        <span className="text-2xl font-bold">{stats.scoreA + stats.scoreB}</span>
                    </div>
                    <h3 className="text-sm font-medium text-purple-100 mt-2">Customers Terpercaya</h3>
                    <p className="text-xs text-purple-200">COD Score A & B</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <BanknotesIcon className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold">Rp {(stats.totalRevenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <h3 className="text-sm font-medium text-green-100 mt-2">Total Revenue</h3>
                    <p className="text-xs text-green-200">Lifetime value</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                        <span className="text-2xl font-bold">Rp {(stats.avgOrderValue / 1000).toFixed(0)}K</span>
                    </div>
                    <h3 className="text-sm font-medium text-amber-100 mt-2">Avg Order Value</h3>
                    <p className="text-xs text-amber-200">Per transaksi</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-4">
                    {/* Segmentasi */}
                    <div className="flex items-center gap-2 flex-1">
                        <FilterIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Segmentasi Pelanggan</span>
                        <div className="flex items-center gap-2 overflow-x-auto">
                            {[
                                { value: 'all', label: 'Semua', count: customers.length },
                                { value: 'a', label: 'A (98-100%)', count: customers.filter(c => calculateCODScore(c).score === 'A').length },
                                { value: 'b', label: 'B (90-97%)', count: customers.filter(c => calculateCODScore(c).score === 'B').length },
                                { value: 'c', label: 'C (80-89%)', count: customers.filter(c => calculateCODScore(c).score === 'C').length },
                                { value: 'd', label: 'D (50-79%)', count: customers.filter(c => calculateCODScore(c).score === 'D').length },
                                { value: 'e', label: 'E (0-49%)', count: customers.filter(c => calculateCODScore(c).score === 'E').length },
                                { value: 'nodata', label: 'No Data', count: customers.filter(c => calculateCODScore(c).score === 'No Data').length }
                            ].map(segment => {
                                const isActive = scoreFilter === segment.value;

                                return (
                                    <button
                                        key={segment.value}
                                        onClick={() => setScoreFilter(segment.value as any)}
                                        className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${isActive
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        {segment.label}
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-slate-600 text-indigo-600 dark:text-indigo-400'
                                            }`}>
                                            {segment.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pencarian */}
                    <div className="flex items-center gap-2 w-80">
                        <SearchIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Pencarian</span>
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau nomor telepon..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedCustomers.size > 0 && (
                <div className="bg-indigo-600 text-white rounded-2xl shadow-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">{selectedCustomers.size} pelanggan terpilih</span>
                            <button onClick={() => setSelectedCustomers(new Set())} className="text-sm underline hover:no-underline">
                                Batal Pilihan
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Hapus Terpilih
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-20">
                            <UserIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Tidak ada pelanggan ditemukan</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Coba ubah filter pencarian</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedCustomers.size === paginatedCustomers.length && paginatedCustomers.length > 0}
                                            onChange={handleToggleSelectAll}
                                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kontak</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Total Belanja</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">COD Score</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {paginatedCustomers.map(customer => {
                                    const isSelected = selectedCustomers.has(customer.id);

                                    return (
                                        <tr
                                            key={customer.id}
                                            className={`transition-colors ${isSelected
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(customer.id)}
                                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">{capitalizeWords(customer.name)}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{customer.address}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-700 dark:text-slate-300">{customer.phone}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{customer.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-green-600 dark:text-green-400">Rp {customer.totalSpent.toLocaleString('id-ID')}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{customer.orderCount} Pesanan</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const codScore = calculateCODScore(customer);
                                                    const colorMap: Record<string, string> = {
                                                        'No Data': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                                                        'E': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                                        'D': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                                                        'C': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                                                        'B': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                                                        'A': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    };
                                                    return (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${colorMap[codScore.score]}`}>
                                                                {codScore.display}
                                                            </span>
                                                            {codScore.rate !== null && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {customer.successfulCODOrders}/{customer.totalCODOrders} COD
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewHistory(customer)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Riwayat Pesanan"
                                                    >
                                                        <ClipboardListIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(customer)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustomer(customer.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredCustomers.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600 dark:text-slate-400">Tampilkan:</label>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(parseInt(e.target.value, 10))}
                                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            >
                                <option value={PAGE_SIZES.SMALL}>10</option>
                                <option value={PAGE_SIZES.MEDIUM}>25</option>
                                <option value={PAGE_SIZES.LARGE}>50</option>
                                <option value={PAGE_SIZES.EXTRA_LARGE}>100</option>
                                <option value={0}>Semua</option>
                            </select>
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold text-sm">Total: {filteredCustomers.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                Prev
                            </button>
                            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold text-sm">
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

            {isModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSaveCustomer} />}

            {isHistoryOpen && viewHistoryCustomer && (
                <OrderHistoryModal
                    customer={viewHistoryCustomer}
                    orders={orders}
                    onClose={() => setIsHistoryOpen(false)}
                />
            )}
        </div>
    );
};

export default CustomersPage;
