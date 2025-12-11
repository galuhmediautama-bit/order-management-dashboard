import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import DownloadIcon from '../components/icons/DownloadIcon';

interface StockMovement {
  id: string;
  productName: string;
  variant: string;
  quantity: number;
  type: 'masuk' | 'keluar';
  reference: string; // Order ID or Purchase ID
  date: string;
  notes?: string;
}

const StockReportsPage: React.FC = () => {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'semua' | 'masuk' | 'keluar'>('semua');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchStockMovements();
  }, []);

  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      // TODO: Fetch stock movement data from database
      // This will depend on your stock tracking system
      setStockMovements([]);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to Excel/CSV
    alert('Fitur export akan segera tersedia');
  };

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
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tipe Stock
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'semua' | 'masuk' | 'keluar')}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="semua">Semua</option>
            <option value="masuk">Stock Masuk</option>
            <option value="keluar">Stock Keluar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tanggal
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            &nbsp;
          </label>
          <button
            onClick={fetchStockMovements}
            className="w-full px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700">
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
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  Tipe
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Referensi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {stockMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    Belum ada data stock movement
                  </td>
                </tr>
              ) : (
                stockMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {new Date(movement.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {movement.productName}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {movement.variant}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          movement.type === 'masuk'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {movement.type === 'masuk' ? '📥 Masuk' : '📤 Keluar'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-900 dark:text-slate-100">
                      {movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {movement.reference}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Stock Masuk</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">0 Unit</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Stock Keluar</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">0 Unit</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-indigo-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Net Stock</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">0 Unit</p>
        </div>
      </div>
    </div>
  );
};

export default StockReportsPage;
