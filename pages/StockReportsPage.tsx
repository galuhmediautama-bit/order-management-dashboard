import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  productName: string;
  variant: string;
  quantity: number;
  date: string;
  customer: string;
  status: string;
  brandId: string | null;
  shippingResi?: string | null;
}

interface BrandOption {
  id: string;
  name: string;
}

const StockReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [stockMode, setStockMode] = useState<'auto' | 'real'>('auto');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

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
        .select('id, productName, variant, quantity, date, customer, status, brandId, shippingResi')
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

    // Filter by product search
    if (searchProduct) {
      filtered = filtered.filter(
        (o) =>
          o.productName?.toLowerCase().includes(searchProduct.toLowerCase()) ||
          o.variant?.toLowerCase().includes(searchProduct.toLowerCase())
      );
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
  }, [orders, searchProduct, filterDateFrom, filterDateTo]);

  const brandNameMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands]);

  // Derived stock metrics
  const shippedOrders = useMemo(
    () => filteredOrders.filter((o) => o.shippingResi || o.status === 'Shipped' || o.status === 'Delivered'),
    [filteredOrders]
  );

  // Assumption: Cancelled orders treated as returned to stock. Adjust when explicit return flag is available.
  const returnedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === 'Cancelled'),
    [filteredOrders]
  );

  const totalShippedQty = useMemo(
    () => shippedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0),
    [shippedOrders]
  );

  const totalReturnedQty = useMemo(
    () => returnedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0),
    [returnedOrders]
  );

  // Mode Auto (stok awal = total pengiriman)
  const stokAwalAuto = totalShippedQty;
  const stokAkhirAuto = totalShippedQty - totalReturnedQty;

  // Mode Real (stok awal manual/fisik; fallback 0 until wired to real initialStock per SKU)
  const stokAwalReal = 0;
  const qtyInReal = totalReturnedQty;
  const qtyOutReal = totalShippedQty;
  const stokAkhirReal = stokAwalReal + qtyInReal - qtyOutReal;

  const handleExport = () => {
    const brandNameMap = Object.fromEntries(brands.map(b => [b.id, b.name]));

    const exportData = filteredOrders.map((order) => ({
      Tanggal: new Date(order.date).toLocaleDateString('id-ID'),
      'Nama Produk': order.productName || '-',
      Varian: order.variant || '-',
      Tipe: 'Stock Keluar',
      Quantity: order.quantity || 1,
      Referensi: order.id,
      Pelanggan: order.customer,
      Brand: order.brandId ? (brandNameMap[order.brandId] || order.brandId) : '-',
      Status: order.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Stock');
    
    const fileName = `Laporan_Stock_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Calculate stats (legacy total)
  const totalStockOut = filteredOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);

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
          📊 Laporan Stock
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mode</label>
            <select
              value={stockMode}
              onChange={(e) => setStockMode(e.target.value as 'auto' | 'real')}
              className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="auto">Auto (berdasar pengiriman)</option>
              <option value="real">Real (stok gudang)</option>
            </select>
          </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <DownloadIcon className="w-5 h-5" />
          Export
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              Cari Produk
            </label>
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="Nama produk atau varian..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
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
                setSearchProduct('');
                setFilterDateFrom('');
                setFilterDateTo('');
              }}
              className="w-full px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats by mode */}
      {stockMode === 'auto' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Awal (Auto)</p>
                <p className="text-3xl font-bold mt-1">{stokAwalAuto}</p>
                <p className="text-xs opacity-80 mt-1">Berbasis total pengiriman (resi terisi)</p>
              </div>
              <div className="text-5xl opacity-20">🚚</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Retur Masuk Gudang</p>
                <p className="text-3xl font-bold mt-1">{totalReturnedQty}</p>
                <p className="text-xs opacity-80 mt-1">Asumsi status Cancelled = retur</p>
              </div>
              <div className="text-5xl opacity-20">↩️</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Akhir (Auto)</p>
                <p className="text-3xl font-bold mt-1">{stokAkhirAuto}</p>
                <p className="text-xs opacity-80 mt-1">Pengiriman - retur masuk</p>
              </div>
              <div className="text-5xl opacity-20">📦</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Awal (Real)</p>
                <p className="text-3xl font-bold mt-1">{stokAwalReal}</p>
                <p className="text-xs opacity-80 mt-1">Gunakan stok fisik/initialStock</p>
              </div>
              <div className="text-5xl opacity-20">🏭</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Masuk Gudang</p>
                <p className="text-3xl font-bold mt-1">{qtyInReal}</p>
                <p className="text-xs opacity-80 mt-1">Retur yang sudah diterima</p>
              </div>
              <div className="text-5xl opacity-20">↩️</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Akhir (Real)</p>
                <p className="text-3xl font-bold mt-1">{stokAkhirReal}</p>
                <p className="text-xs opacity-80 mt-1">Awal + masuk - keluar</p>
              </div>
              <div className="text-5xl opacity-20">📦</div>
            </div>
          </div>
        </div>
      )}

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
                  Produk
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Varian
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Brand
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Pelanggan
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Referensi
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
                      'Tidak ada data stock movement'
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
                      {order.productName || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {order.variant || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {order.brandId ? (brandNameMap[order.brandId] || order.brandId) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 font-semibold">
                        -{order.quantity || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {order.customer}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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

export default StockReportsPage;
