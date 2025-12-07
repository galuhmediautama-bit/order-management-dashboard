
// ... imports remain the same ...
import React, { useState, useEffect } from 'react';
import type { Brand } from '../types';
import { supabase } from '../firebase';
import { uploadFileAndGetURL } from '../fileUploader';
import PlusIcon from '../components/icons/PlusIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import SearchIcon from '../components/icons/SearchIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import BrandSettingsModal from '../components/BrandSettingsModal';


const BrandModal: React.FC<{ 
    brand?: Brand | null; 
    onClose: () => void; 
    onSave: (brand: Brand, file: File | null) => void; 
    isSaving: boolean;
}> = ({ brand, onClose, onSave, isSaving }) => {
    // ... BrandModal content remains the same ...
    const [formData, setFormData] = useState<Brand>(
        brand || { id: '', name: '', description: '', logo: '', productCount: 0 }
    );
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState(brand?.logo || '');
    const { showToast } = useToast();

     useEffect(() => {
        return () => {
            if (logoPreview && logoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            
            setLogoFile(file);
            setLogoPreview(previewUrl);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name) {
            showToast("Nama Merek harus diisi.", 'warning');
            return;
        }
        onSave(formData, logoFile);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{brand ? 'Edit Merek' : 'Tambah Merek Baru'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                     <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Logo Merek</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-slate-400 text-center px-1">No Image</span>
                                )}
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                <span>Pilih Gambar</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama Merek*</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Nike, Adidas"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Deskripsi</label>
                        <textarea name="description" value={formData.description} onChange={e => handleChange(e)} rows={3} className="w-full p-2.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Deskripsi singkat merek..."></textarea>
                    </div>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">Batal</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                        {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin"/>}
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const BrandsPage: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [selectedBrandForSettings, setSelectedBrandForSettings] = useState<Brand | null>(null);
    const { showToast } = useToast();

    // Robust error message extractor
    const getErrorMessage = (error: any): string => {
        if (!error) return 'Terjadi kesalahan yang tidak diketahui.';
        if (typeof error === 'string') return error;
        if (error.message && typeof error.message === 'string') return error.message;
        if (error instanceof Error) return error.message;
        if (error.error_description) return error.error_description;
        if (error.error && typeof error.error === 'string') return error.error;
        if (error.details) return error.details;
        
        try {
            const json = JSON.stringify(error);
            if (json !== '{}') return json;
        } catch {}

        if (error.code) return `Code: ${error.code}`;
        if (error.statusText) return error.statusText;
        if (error.status) return `Status: ${error.status}`;
        
        return String(error); 
    };

    // Helper to sync state to local storage
    const syncToLocalStorage = (currentBrands: Brand[]) => {
        localStorage.setItem('brands_local_data', JSON.stringify(currentBrands));
    };

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('brands').select('*');
            
            // Fallback Logic
            if (error) {
                console.warn("DB Error fetching brands, using LocalStorage:", error.message);
                const localData = localStorage.getItem('brands_local_data');
                if (localData) {
                    setBrands(JSON.parse(localData));
                } else {
                    setBrands([]);
                }
            } else {
                if (data && data.length > 0) {
                    const brandsList = data.map(doc => ({ ...doc } as Brand));
                    setBrands(brandsList);
                    syncToLocalStorage(brandsList);
                } else {
                    const localData = localStorage.getItem('brands_local_data');
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        if (parsed.length > 0) {
                            setBrands(parsed);
                        } else {
                            setBrands([]);
                        }
                    } else {
                        setBrands([]);
                    }
                }
            }
        } catch (error: any) {
            console.error("Unexpected error fetching brands:", getErrorMessage(error));
            const localData = localStorage.getItem('brands_local_data');
            if (localData) setBrands(JSON.parse(localData));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
        recalculateProductCounts();
    }, []);

    const recalculateProductCounts = async () => {
        try {
            // Fetch all brands
            const { data: allBrands } = await supabase.from('brands').select('id');
            if (!allBrands) return;

            // For each brand, count products and update
            for (const brand of allBrands) {
                const { count } = await supabase
                    .from('products')
                    .select('id', { count: 'exact', head: true })
                    .eq('brand_id', brand.id);
                
                const productCount = count || 0;
                
                // Update brand with correct product count
                await supabase
                    .from('brands')
                    .update({ productCount })
                    .eq('id', brand.id);
            }

            // Re-fetch brands to show updated counts
            await fetchBrands();
        } catch (error) {
            console.warn('Warning: Could not recalculate product counts:', error);
        }
    };

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (brand?: Brand) => {
        setEditingBrand(brand || null);
        setModalOpen(true);
    };

    const handleSaveBrand = async (brandData: Brand, logoFile: File | null) => {
        setIsSaving(true);
        try {
            let finalData = { ...brandData };

            if (logoFile) {
                try {
                    const logoUrl = await uploadFileAndGetURL(logoFile);
                    finalData.logo = logoUrl;
                } catch (uploadError: any) {
                    console.error("Upload failed:", uploadError);
                    showToast(`Gagal mengunggah gambar: ${getErrorMessage(uploadError)}. Menggunakan placeholder.`, 'warning');
                    finalData.logo = `https://placehold.co/100x100/cccccc/ffffff?text=${(finalData.name || 'BR').substring(0,2).toUpperCase()}`;
                }
            } else if (!finalData.logo) {
                finalData.logo = `https://placehold.co/100x100/cccccc/ffffff?text=${(finalData.name || 'BR').substring(0,2).toUpperCase()}`;
            }

            const payload: any = { ...finalData };
            if (!payload.id) delete payload.id;
            delete payload.productCount; 

            let savedBrand: Brand | null = null;
            let usedLocalStorage = false;

            if (finalData.id && !finalData.id.startsWith('local-')) { 
                // Update Existing DB Record
                const { error } = await supabase.from('brands').update(payload).eq('id', finalData.id);
                if (error) usedLocalStorage = true;
            } else { 
                // Insert New Record
                const { data, error } = await supabase.from('brands').insert(payload).select().single();
                if (error) {
                    usedLocalStorage = true;
                } else if (data) {
                    savedBrand = data as Brand;
                }
            }

            setBrands(prev => {
                let newBrands;
                if (savedBrand) {
                    newBrands = [...prev, savedBrand];
                } else if (usedLocalStorage) {
                    if (finalData.id) {
                        newBrands = prev.map(b => b.id === finalData.id ? { ...b, ...finalData } : b);
                    } else {
                        const newLocalBrand = { ...finalData, id: `local-${Date.now()}`, productCount: 0 };
                        newBrands = [...prev, newLocalBrand];
                    }
                    if(!savedBrand && !finalData.id) showToast("Data disimpan ke penyimpanan browser (Database tidak merespon/error).", 'warning');
                } else {
                    if (finalData.id) {
                        newBrands = prev.map(b => b.id === finalData.id ? { ...b, ...finalData } : b);
                    } else {
                        newBrands = prev;
                    }
                }
                syncToLocalStorage(newBrands);
                return newBrands;
            });

            showToast("Data merek berhasil disimpan.", 'success');
            setModalOpen(false);
            setEditingBrand(null);
        } catch (error: any) {
            console.error("Full error object:", error);
            const msg = getErrorMessage(error);
            showToast(`Gagal menyimpan merek: ${msg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteBrand = async () => {
        if (!brandToDelete) return;
        
        const brandId = brandToDelete;

        try {
            // Only attempt DB delete if it's not a local ID
            if (!brandId.startsWith('local-')) {
                
                // 1. Check Dependencies (Parallel Check)
                // We check Forms and Orders to ensure data integrity
                const [formsRes, ordersRes] = await Promise.all([
                    supabase.from('forms').select('id', { count: 'exact', head: true }).eq('brandId', brandId),
                    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('brandId', brandId)
                ]);

                // Ignore "table not found" errors for initial setups
                if (formsRes.error && formsRes.error.code !== '42P01') console.warn("Forms check error:", formsRes.error);
                if (ordersRes.error && ordersRes.error.code !== '42P01') console.warn("Orders check error:", ordersRes.error);

                const formsCount = formsRes.count || 0;
                const ordersCount = ordersRes.count || 0;

                if (formsCount > 0 || ordersCount > 0) {
                    let msg = "Gagal menghapus merek karena sedang digunakan:\n";
                    if (formsCount > 0) msg += `- ${formsCount} Formulir Produk\n`;
                    if (ordersCount > 0) msg += `- ${ordersCount} Riwayat Pesanan\n`;
                    msg += "Silakan hapus data terkait atau ubah merek pada data tersebut terlebih dahulu.";
                    showToast(msg, 'error');
                    setDeleteModalOpen(false);
                    return; // STOP execution
                }

                // 2. Perform Delete
                const { error } = await supabase.from('brands').delete().eq('id', brandId);
                
                if (error) {
                    throw error; 
                }
            }

            // 3. Update State
            setBrands(prev => {
                const newBrands = prev.filter(b => b.id !== brandId);
                syncToLocalStorage(newBrands);
                return newBrands;
            });
            showToast("Merek berhasil dihapus.", 'success');

        } catch (error: any) {
            console.error("Error deleting brand:", error);
            showToast(`Gagal menghapus merek: ${getErrorMessage(error)}`, 'error');
        } finally {
            setDeleteModalOpen(false);
            setBrandToDelete(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setBrandToDelete(id);
        setDeleteModalOpen(true);
    };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-red-900/20 rounded-2xl p-8 shadow-sm border border-pink-100/50 dark:border-pink-800/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-2">
              🏷️ Manajemen Merek
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Kelola semua merek produk yang Anda tawarkan</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={recalculateProductCounts}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors text-sm"
              title="Sinkronisasi jumlah produk dari database"
            >
              🔄 Sinkronisasi
            </button>
            <button 
              onClick={() => handleOpenModal()} 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl hover:from-pink-700 hover:to-rose-700 font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all"
            >
              <PlusIcon className="w-5 h-5"/>
              <span>Tambah Merek</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-pink-100 dark:border-pink-800/50 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Merek</p>
                <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1">{brands.length}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/50 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Produk</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{brands.reduce((sum, b) => sum + (b.productCount || 0), 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100 dark:border-blue-800/50 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Produk/Merek</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {brands.length > 0 ? Math.round(brands.reduce((sum, b) => sum + (b.productCount || 0), 0) / brands.length) : 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="relative w-full md:w-1/3">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Cari nama merek..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Brands Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">Memuat data merek...</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Tidak ada merek ditemukan</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Coba ubah pencarian atau tambah merek baru</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-pink-200 dark:border-pink-800">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Merek</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Jumlah Produk</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map(brand => (
                  <tr key={brand.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center ring-2 ring-pink-200 dark:ring-pink-700">
                          <img 
                            src={brand.logo || `https://placehold.co/100x100/cccccc/ffffff?text=${(brand.name || 'BR').substring(0,2).toUpperCase()}`} 
                            alt={`${brand.name} logo`} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-md">
                      <p className="line-clamp-2" title={brand.description}>{brand.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-400">
                        {brand.productCount || 0} Produk
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedBrandForSettings(brand);
                            setSettingsModalOpen(true);
                          }}
                          title="Pengaturan Brand" 
                          className="p-2 text-slate-500 hover:text-white hover:bg-indigo-600 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleOpenModal(brand)} 
                          title="Edit Merek" 
                          className="p-2 text-slate-500 hover:text-white hover:bg-pink-600 rounded-lg transition-all"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(brand.id)} 
                          title="Hapus Merek" 
                          className="p-2 text-slate-500 hover:text-white hover:bg-red-600 rounded-lg transition-all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && <BrandModal brand={editingBrand} onClose={() => setModalOpen(false)} onSave={handleSaveBrand} isSaving={isSaving} />}
      
      {settingsModalOpen && selectedBrandForSettings && (
        <BrandSettingsModal 
          brandId={selectedBrandForSettings.id} 
          brandName={selectedBrandForSettings.name}
          onClose={() => {
            setSettingsModalOpen(false);
            setSelectedBrandForSettings(null);
          }}
        />
      )}
      
      {deleteModalOpen && (
          <ConfirmationModal 
            isOpen={deleteModalOpen}
            title="Hapus Merek"
            message="Apakah Anda yakin ingin menghapus merek ini? Tindakan ini tidak dapat dibatalkan."
            variant="danger"
            confirmLabel="Ya, Hapus"
            onConfirm={confirmDeleteBrand}
            onClose={() => setDeleteModalOpen(false)}
          />
      )}
    </div>
  );
};

export default BrandsPage;
