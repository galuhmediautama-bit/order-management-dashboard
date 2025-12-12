import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import { useToast } from '../contexts/ToastContext';
import GlobeIcon from '../components/icons/GlobeIcon';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import Squares2x2Icon from '../components/icons/Squares2x2Icon';

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  type: 'sales' | 'product';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
}

const LandingPagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPages(prev => prev.filter(p => p.id !== id));
      showToast('Landing page berhasil dihapus', 'success');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting page:', error);
      showToast('Gagal menghapus landing page', 'error');
    }
  };

  const handleCreatePage = (type: 'sales' | 'product') => {
    setShowCreateModal(false);
    navigate(`/landing-page/${type}/baru`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <GlobeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Landing Page</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kelola halaman penjualan produk Anda</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Buat Landing Page
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Halaman</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{pages.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Sales Page</p>
          <p className="text-2xl font-bold text-purple-600">{pages.filter(p => p.type === 'sales').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Product Page</p>
          <p className="text-2xl font-bold text-blue-600">{pages.filter(p => p.type === 'product').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">Terpublikasi</p>
          <p className="text-2xl font-bold text-green-600">{pages.filter(p => p.isPublished).length}</p>
        </div>
      </div>

      {/* Pages List */}
      {pages.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <GlobeIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Belum ada Landing Page</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Buat landing page pertama Anda untuk mulai menjual</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Buat Landing Page
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Halaman</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tipe</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Dibuat</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{page.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">/lp/{page.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      page.type === 'sales' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {page.type === 'sales' ? (
                        <>
                          <ShoppingCartIcon className="w-3.5 h-3.5" />
                          Sales Page
                        </>
                      ) : (
                        <>
                          <Squares2x2Icon className="w-3.5 h-3.5" />
                          Product Page
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      page.isPublished
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {page.isPublished ? 'Terpublikasi' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {new Date(page.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/#/lp/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </a>
                      <Link
                        to={`/landing-page/${page.type}/edit/${page.id}`}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirm(page.id)}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Buat Landing Page Baru</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Pilih jenis halaman yang ingin Anda buat</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Sales Page Option */}
              <button
                onClick={() => handleCreatePage('sales')}
                className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingCartIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">Sales Page</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Halaman penjualan dengan penjelasan detail. Cocok untuk produk yang membutuhkan storytelling, gambar, dan deskripsi mendalam.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">📝 Long-form</span>
                  <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">🖼️ Multi-gambar</span>
                  <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">📖 Storytelling</span>
                </div>
              </button>

              {/* Product Page Option */}
              <button
                onClick={() => handleCreatePage('product')}
                className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Squares2x2Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Product Page</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Katalog produk seperti toko online. Tampilan grid dengan foto, judul, harga, dan tombol beli. Cocok untuk produk umum.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">🛒 Katalog</span>
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">📦 Multi-produk</span>
                  <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">⚡ Quick buy</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Landing Page?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPagesPage;
