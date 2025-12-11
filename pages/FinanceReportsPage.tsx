import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import DownloadIcon from '../components/icons/DownloadIcon';

interface FinanceCase {
  id: string;
  date: string;
  description: string;
  category: string; // income, expense, adjustment, etc
  amount: number;
  paymentMethod: string;
  reference: string; // Order ID, Invoice, etc
  notes?: string;
}

const FinanceReportsPage: React.FC = () => {
  const [financeCases, setFinanceCases] = useState<FinanceCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('semua');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchFinanceCases();
  }, []);

  const fetchFinanceCases = async () => {
    try {
      setLoading(true);
      // TODO: Fetch finance case data from database
      setFinanceCases([]);
    } catch (error) {
      console.error('Error fetching finance cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to Excel/CSV
    alert('Fitur export akan segera tersedia');
  };

  // Calculate totals
  const totalIncome = financeCases
    .filter((c) => c.category === 'income')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExpense = financeCases
    .filter((c) => c.category === 'expense')
    .reduce((sum, c) => sum + c.amount, 0);

  const balance = totalIncome - totalExpense;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Rp {totalIncome.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 border-red-500">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            Rp {totalExpense.toLocaleString('id-ID')}
          </p>
        </div>
        <div className={`bg-white dark:bg-slate-800 rounded-lg p-4 border-l-4 ${balance >= 0 ? 'border-indigo-500' : 'border-orange-500'}`}>
          <p className="text-sm text-slate-600 dark:text-slate-400">Saldo</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
            Rp {balance.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Kategori
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="semua">Semua Kategori</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="adjustment">Penyesuaian</option>
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
            onClick={fetchFinanceCases}
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
                  Deskripsi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Metode Pembayaran
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Referensi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {financeCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    Belum ada data keuangan
                  </td>
                </tr>
              ) : (
                financeCases.map((fc) => (
                  <tr key={fc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {new Date(fc.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {fc.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          fc.category === 'income'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : fc.category === 'expense'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {fc.category === 'income' ? 'Masuk' : fc.category === 'expense' ? 'Keluar' : 'Penyesuaian'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {fc.paymentMethod}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={fc.category === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {fc.category === 'income' ? '+' : '-'}Rp {fc.amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {fc.reference}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                      {fc.notes || '-'}
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
