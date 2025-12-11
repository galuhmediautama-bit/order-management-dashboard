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
  productId?: string | null;
}

interface BrandOption {
  id: string;
  name: string;
}

interface ProductStockMeta {
  id: string;
  brandId: string;
  name: string;
  stockMode: 'auto' | 'real';
  initialStock: number;
}

const StockReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [products, setProducts] = useState<ProductStockMeta[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [selectedBrandId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('id, productName, variant, quantity, date, customer, status, brandId, shippingResi, product_id, productId')
        .order('date', { ascending: false });

      if (selectedBrandId) {
        query = query.eq('brandId', selectedBrandId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(
        (data || []).map((d: any) => ({
          ...d,
          productId: d.product_id ?? d.productId ?? null,
        }))
      );
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

  const fetchProducts = async () => {
    try {
      let query = supabase.from('products').select('id, brand_id, name, stock_mode, initial_stock');
      if (selectedBrandId) {
        query = query.eq('brand_id', selectedBrandId);
      }
      const { data, error } = await query;
      if (error) throw error;
      setProducts(
        (data || []).map((p: any) => ({
          id: p.id,
          brandId: p.brand_id,
          name: p.name,
          stockMode: p.stock_mode || 'auto',
          initialStock: p.initial_stock ?? 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
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

  // Group products by stockMode
  const autoProducts = useMemo(() => products.filter(p => p.stockMode === 'auto'), [products]);
  const realProducts = useMemo(() => products.filter(p => p.stockMode === 'real'), [products]);

  const initialStockSum = useMemo(
    () => realProducts.reduce((sum, p) => sum + (p.initialStock || 0), 0),
    [realProducts]
  );

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

  // Aggregated summary (mix both modes)
  const stokAwalAuto = totalShippedQty;
  const stokAkhirAuto = totalShippedQty - totalReturnedQty;

  const stokAwalReal = initialStockSum;
  const qtyInReal = totalReturnedQty;
  const qtyOutReal = totalShippedQty;
  const stokAkhirReal = stokAwalReal + qtyInReal - qtyOutReal;

  // Display mode: show combined or separate based on product modes present
  const hasAutoMode = autoProducts.length > 0;
  const hasRealMode = realProducts.length > 0;

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
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <DownloadIcon className="w-5 h-5" />
          Export
        </button>
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

      {/* Summary Stats - Combined display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasAutoMode && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Auto ({autoProducts.length} produk)</p>
                <p className="text-3xl font-bold mt-1">{stokAkhirAuto}</p>
                <p className="text-xs opacity-80 mt-1">Pengiriman {totalShippedQty} - Retur {totalReturnedQty}</p>
              </div>
              <div className="text-5xl opacity-20">🚚</div>
            </div>
          </div>
        )}
        {hasRealMode && (
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Stok Real ({realProducts.length} produk)</p>
                <p className="text-3xl font-bold mt-1">{stokAkhirReal}</p>
                <p className="text-xs opacity-80 mt-1">Awal {stokAwalReal} + Masuk {qtyInReal} - Keluar {qtyOutReal}</p>
              </div>
              <div className="text-5xl opacity-20">🏭</div>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Produk</p>
              <p className="text-3xl font-bold mt-1">{products.length}</p>
              <p className="text-xs opacity-80 mt-1">
                {hasAutoMode && hasRealMode ? `Auto: ${autoProducts.length} | Real: ${realProducts.length}` : 
                 hasAutoMode ? `Semua mode Auto` : hasRealMode ? `Semua mode Real` : 'Belum ada produk'}
              </p>
            </div>
            <div className="text-5xl opacity-20">📦</div>
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
