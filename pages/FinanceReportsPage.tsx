import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  date: string;
  customer: string;
  productName: string;
  variant: string;
  totalPrice: number;
  paymentMethod: string;
  status: string;
  shippingCost: number;
  codFee: number;
  brandId: string | null;
}

interface BrandOption {
  id: string;
  name: string;
}

const FinanceReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterPayment, setFilterPayment] = useState<string>('semua');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [selectedBrandId]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('id, date, customer, productName, variant, totalPrice, paymentMethod, status, shippingCost, codFee, brandId')
        .order('date', { ascending: false });

      if (selectedBrandId) {
        query = query.eq('brandId', selectedBrandId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('id, name').order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (selectedBrandId) {
      filtered = filtered.filter((o) => o.brandId === selectedBrandId);
    }

    // Filter by status
    if (filterStatus !== 'semua') {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    // Filter by payment method
    if (filterPayment !== 'semua') {
      filtered = filtered.filter((o) => o.paymentMethod === filterPayment);
    }

    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter((o) => new Date(o.date) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      const endDate = new Date(filterDateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((o) => new Date(o.date) <= endDate);
    }

    return filtered;
  }, [orders, selectedBrandId, filterStatus, filterPayment, filterDateFrom, filterDateTo]);

  const brandNameMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands]);

  const handleExport = () => {
    const exportData = filteredOrders.map((order) => ({
      Tanggal: new Date(order.date).toLocaleDateString('id-ID'),
      'Order ID': order.id,
      Pelanggan: order.customer,
      Produk: order.productName || '-',
      Varian: order.variant || '-',
      Brand: order.brandId ? (brandNameMap[order.brandId] || order.brandId) : '-',
      'Total Harga': order.totalPrice,
      'Biaya Kirim': order.shippingCost || 0,
      'Biaya COD': order.codFee || 0,
      'Metode Pembayaran': order.paymentMethod,
      Status: order.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
    
    const fileName = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Calculate totals
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalShipping = filteredOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalCOD = filteredOrders.reduce((sum, o) => sum + (o.codFee || 0), 0);
  const netRevenue = totalRevenue - totalShipping - totalCOD;

  const deliveredOrders = filteredOrders.filter((o) => o.status === 'Delivered');
  const confirmedRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          💰 Laporan Keuangan
        </h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <DownloadIcon className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              <p className="text-xs opacity-75 mt-1">{filteredOrders.length} transaksi</p>
            </div>
            <div className="text-5xl opacity-20">💰</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Confirmed Revenue</p>
              <p className="text-2xl font-bold mt-1">Rp {confirmedRevenue.toLocaleString('id-ID')}</p>
              <p className="text-xs opacity-75 mt-1">{deliveredOrders.length} delivered</p>
            </div>
            <div className="text-5xl opacity-20">✅</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Biaya Operasional</p>
              <p className="text-2xl font-bold mt-1">Rp {(totalShipping + totalCOD).toLocaleString('id-ID')}</p>
              <p className="text-xs opacity-75 mt-1">Shipping + COD</p>
            </div>
            <div className="text-5xl opacity-20">📦</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Net Revenue</p>
              <p className="text-2xl font-bold mt-1">Rp {netRevenue.toLocaleString('id-ID')}</p>
              <p className="text-xs opacity-75 mt-1">After costs</p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Brand
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">Semua Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status Order
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="semua">Semua Status</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Metode Pembayaran
            </label>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="semua">Semua Metode</option>
              <option value="COD">COD</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              &nbsp;
            </label>
            <button
              onClick={() => {
                setSelectedBrandId('');
                setFilterStatus('semua');
                setFilterPayment('semua');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="w-full px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Pelanggan
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Brand
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Produk
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Metode Pembayaran
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                  Total
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Order ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {loading ? (
                      <div className="flex justify-center">
                        <SpinnerIcon className="w-6 h-6 animate-spin text-indigo-500" />
                      </div>
                    ) : (
                      'Tidak ada data keuangan'
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {new Date(order.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100 font-medium">
                      {order.customer}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {order.brandId ? (brandNameMap[order.brandId] || order.brandId) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900 dark:text-slate-100">{order.productName || '-'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{order.variant || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {order.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                      Rp {(order.totalPrice || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : order.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceReportsPage;
