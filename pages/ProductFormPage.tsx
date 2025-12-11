import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Product } from '../types';
import { productService } from '../services/productService';
import { supabase } from '../firebase';
import { uploadFileAndGetURL } from '../fileUploader';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PhotoIcon from '../components/icons/PhotoIcon';

type VariantMode = 'none' | 'multi';

interface VariantData {
    name: string;
    sku?: string;
    price: number;
    comparePrice: number;
    costPrice: number;
    csCommission: number;
    advCommission: number;
    weight: number;
    initialStock: number;
}

interface VariantOption {
    name: string;
    values: string[];
}

interface ProductFormData {
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    isFeatured: boolean;
    seoTitle: string;
    seoDescription: string;
    brandId: string;
    stockMode: 'auto' | 'real'; // Required
    initialStock: number; // For real mode
    // TANPA VARIANT
    basePrice?: number | null;
    comparePrice?: number | null;
    costPrice?: number | null;
    csCommission?: number | null;
    advCommission?: number | null;
    weight?: number | null;
    stock?: number | null;
    sku?: string;
    // VARIANT MODE
    variantMode: VariantMode;
    variants: VariantData[];
    variantOptions: VariantOption[];
}

const ProductFormPage: React.FC = () => {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [brands, setBrands] = useState<any[]>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        imageUrl: '',
        category: '',
        isFeatured: false,
        seoTitle: '',
        seoDescription: '',
        brandId: '',
        stockMode: 'auto', // Default auto
        initialStock: 0,
        // TANPA VARIANT
        basePrice: null,
        comparePrice: null,
        costPrice: null,
        csCommission: null,
        advCommission: null,
        weight: null,
        stock: null,
        sku: '',
        // VARIANT MODE
        variantMode: 'none',
        variants: [],
        variantOptions: [],
    });

    useEffect(() => {
        fetchBrands();
        if (isEdit && id) {
            fetchProduct();
        }
    }, [id, isEdit]);

    const fetchBrands = async () => {
        setIsLoadingBrands(true);
        try {
            // Fetch from Manajemen Merek (brands table)
            const { data, error } = await supabase
                .from('brands')
                .select('id, name')
                .order('name', { ascending: true });
            
            if (error) throw error;
            setBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
            showToast('Gagal mengambil data brand', 'error');
        } finally {
            setIsLoadingBrands(false);
        }
    };

    const fetchProduct = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const product = await productService.getProduct(id);
            if (product) {
                const variants = product.variants || [];
                const variantOptions = product.variantOptions || [];

                // Deteksi variant mode
                let mode: VariantMode = 'none';
                if (variantOptions.length > 0 || variants.length > 0) {
                    mode = 'multi';
                }

                setFormData({
                    name: product.name || '',
                    description: product.description || '',
                    imageUrl: product.imageUrl || '',
                    category: product.category || '',
                    isFeatured: product.isFeatured || false,
                    seoTitle: product.seoTitle || '',
                    seoDescription: product.seoDescription || '',
                    brandId: product.brandId || '',
                    stockMode: product.stockMode || 'auto',
                    initialStock: product.initialStock || 0,
                    basePrice: product.basePrice || null,
                    comparePrice: product.comparePrice || null,
                    costPrice: product.costPrice || null,
                    csCommission: product.csCommission || null,
                    advCommission: product.advCommission || null,
                    weight: product.weight || null,
                    stock: product.stock || null,
                    sku: product.sku || '',
                    variantMode: mode,
                    variants,
                    variantOptions,
                });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            showToast('Gagal mengambil data produk', 'error');
            navigate('/produk');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVariantModeChange = (newMode: VariantMode) => {
        setFormData(prev => ({
            ...prev,
            variantMode: newMode,
            variants: newMode === 'none' ? [] : prev.variants,
            variantOptions: newMode === 'multi' && prev.variantOptions.length === 0 ? [{ name: 'Opsi 1', values: [] }, { name: 'Opsi 2', values: [] }] : (newMode === 'multi' ? prev.variantOptions : []),
        }));
    };

    const handleVariantChange = (index: number, field: keyof VariantData, value: any) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { name: '', price: 0, comparePrice: 0, costPrice: 0, csCommission: 0, advCommission: 0, weight: 0, initialStock: 0 }],
        }));
    };

    const handleRemoveVariant = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index),
        }));
    };

    const handleOptionChange = (index: number, field: 'name' | 'values', value: any) => {
        const newOptions = [...formData.variantOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setFormData(prev => ({ ...prev, variantOptions: newOptions }));

        // Auto-generate kombinasi jika values berubah
        if (field === 'values') {
            generateCombinations(newOptions);
        }
    };

    const handleAddOption = () => {
        setFormData(prev => ({
            ...prev,
            variantOptions: [...prev.variantOptions, { name: '', values: [] }],
        }));
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = formData.variantOptions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, variantOptions: newOptions }));
        generateCombinations(newOptions);
    };

    const generateCombinations = (options: VariantOption[]) => {
        // Filter options dengan values
        const validOptions = options.filter(opt => opt.values.length > 0);

        if (validOptions.length === 0) {
            setFormData(prev => ({ ...prev, variants: [] }));
            return;
        }

        // Cartesian product
        const combinations: string[][] = [];
        const generate = (current: string[], depth: number) => {
            if (depth === validOptions.length) {
                combinations.push([...current]);
                return;
            }
            for (const value of validOptions[depth].values) {
                current[depth] = value;
                generate(current, depth + 1);
            }
        };
        generate([], 0);

        // Buat variants dari kombinasi, preserve data lama
        const newVariants = combinations.map(combo => {
            const name = combo.join(' - ');
            const existing = formData.variants.find(v => v.name === name);
            return existing || {
                name,
                sku: '',
                price: 0,
                comparePrice: 0,
                costPrice: 0,
                csCommission: 0,
                advCommission: 0,
                weight: 0,
                initialStock: 0,
            };
        });

        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleCopyValueDown = (sourceIndex: number, field: keyof VariantData) => {
        if (field === 'name') return; // Jangan copy nama
        
        const sourceValue = formData.variants[sourceIndex][field];
        const newVariants = formData.variants.map((v, idx) => {
            if (idx >= sourceIndex) {
                return { ...v, [field]: sourceValue };
            }
            return v;
        });
        setFormData(prev => ({ ...prev, variants: newVariants }));
        
        const fieldNames: Record<string, string> = {
            price: 'Harga Jual',
            comparePrice: 'Harga Coret',
            costPrice: 'Harga Modal',
            csCommission: 'Komisi CS',
            advCommission: 'Komisi Advertiser',
            weight: 'Berat',
            initialStock: 'Stok'
        };
        showToast(`${fieldNames[field]} berhasil disalin ke bawah`, 'success');
    };

    const handleCopyAllDown = (sourceIndex: number) => {
        const sourceVariant = formData.variants[sourceIndex];
        const newVariants = formData.variants.map((v, idx) => {
            if (idx >= sourceIndex) {
                return {
                    ...v,
                    price: sourceVariant.price,
                    comparePrice: sourceVariant.comparePrice,
                    costPrice: sourceVariant.costPrice,
                    csCommission: sourceVariant.csCommission,
                    advCommission: sourceVariant.advCommission,
                    weight: sourceVariant.weight,
                    initialStock: sourceVariant.initialStock,
                };
            }
            return v;
        });
        setFormData(prev => ({ ...prev, variants: newVariants }));
        showToast('Semua nilai berhasil disalin ke bawah', 'success');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('File harus berupa gambar', 'error');
            return;
        }

        setIsUploadingImage(true);
        try {
            const imageUrl = await uploadFileAndGetURL(file, 'product-images');
            setFormData(prev => ({ ...prev, imageUrl }));
            showToast('Gambar berhasil diupload', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Gagal mengupload gambar', 'error');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast('Nama produk tidak boleh kosong', 'error');
            return;
        }

        if (!formData.brandId) {
            showToast('Brand harus dipilih', 'error');
            return;
        }

        if (!formData.category) {
            showToast('Kategori harus dipilih', 'error');
            return;
        }

        if (!formData.stockMode) {
            showToast('Mode stok harus dipilih', 'error');
            return;
        }

        if (formData.stockMode === 'real' && (!formData.initialStock || formData.initialStock <= 0)) {
            showToast('Stok awal wajib diisi untuk mode Real (stok gudang)', 'error');
            return;
        }

        // Validasi per mode
        if (formData.variantMode === 'none') {
            if (!formData.basePrice) {
                showToast('Harga jual tidak boleh kosong', 'error');
                return;
            }
        } else if (formData.variantMode === 'multi') {
            if (formData.variantOptions.length < 1) {
                showToast('Minimal 1 opsi untuk varian', 'error');
                return;
            }
            if (formData.variants.length === 0) {
                showToast('Belum ada kombinasi varian', 'error');
                return;
            }
        }

        setIsLoading(true);
        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                imageUrl: formData.imageUrl,
                category: formData.category,
                isFeatured: formData.isFeatured,
                seoTitle: formData.seoTitle,
                seoDescription: formData.seoDescription,
                brandId: formData.brandId,
                stockMode: formData.stockMode,
                initialStock: formData.stockMode === 'real' ? formData.initialStock : 0,
                status: 'active',
                // TANPA VARIANT - simpan di level product
                ...(formData.variantMode === 'none' && {
                    sku: formData.sku,
                    basePrice: formData.basePrice,
                    comparePrice: formData.comparePrice || undefined,
                    costPrice: formData.costPrice || undefined,
                    csCommission: formData.csCommission || undefined,
                    advCommission: formData.advCommission || undefined,
                    weight: formData.weight || undefined,
                    stock: formData.stock || undefined,
                    variants: [],
                    variantOptions: [],
                }),
                // VARIANT MODE - simpan di variants array
                ...(formData.variantMode === 'multi' && {
                    variants: formData.variants,
                    variantOptions: formData.variantOptions,
                }),
            };

            if (isEdit && id) {
                await productService.updateProduct(id, productData);
                showToast('Produk berhasil diperbarui', 'success');
            } else {
                await productService.createProduct(productData);
                showToast('Produk berhasil ditambahkan', 'success');
                
                // Update brand's productCount
                try {
                    const { data: brand } = await supabase
                        .from('brands')
                        .select('productCount')
                        .eq('id', formData.brandId)
                        .single();
                    
                    if (brand) {
                        const newCount = (brand.productCount || 0) + 1;
                        await supabase
                            .from('brands')
                            .update({ productCount: newCount })
                            .eq('id', formData.brandId);
                    }
                } catch (error) {
                    console.warn('Warning: Could not update brand productCount:', error);
                }
            }
            navigate('/daftar-produk');
        } catch (error: any) {
            console.error('Error saving product:', error);
            
            // Parse error message untuk memberikan feedback yang lebih baik
            let errorMsg = error?.message || 'Gagal menyimpan produk';
            
            // Check berbagai jenis error
            if (errorMsg.includes('sudah ada')) {
                errorMsg = 'Nama produk sudah ada untuk brand ini. Gunakan nama yang berbeda.';
            } else if (errorMsg.includes('duplicate') || errorMsg.includes('23505')) {
                errorMsg = 'Nama produk sudah ada. Gunakan nama yang berbeda.';
            } else if (error?.status === 409) {
                errorMsg = 'Konflik: Nama produk sudah ada untuk brand ini.';
            } else if (errorMsg.includes('tidak valid') || errorMsg.includes('Manajemen Merek')) {
                errorMsg = 'Brand tidak valid. Silakan buat brand terlebih dahulu di Manajemen Merek.';
            } else if (errorMsg.includes('ForeignKeyViolation') || errorMsg.includes('fkey')) {
                errorMsg = 'Brand tidak valid. Silakan buat brand terlebih dahulu di Manajemen Merek.';
            } else if (errorMsg.includes('NotFound')) {
                errorMsg = 'Tabel produk belum ada di database. Hubungi administrator.';
            }
            
            showToast(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && isEdit) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/daftar-produk')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    title="Kembali"
                >
                    <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h1>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-6">
                {/* Nama Produk */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Nama Produk *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Contoh: Laptop Gaming Pro"
                    />
                </div>

                {/* Brand */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Brand
                        </label>
                        <span className="text-xs text-red-500 font-medium">Wajib</span>
                    </div>
                    {isLoadingBrands ? (
                        <div className="px-4 py-2 text-slate-500">Loading...</div>
                    ) : (
                        <>
                            <select
                                value={formData.brandId}
                                onChange={e => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                                    !formData.brandId ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                                }`}
                            >
                                <option value="">-- Pilih Brand --</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                            {!formData.brandId && (
                                <p className="text-xs text-red-500 mt-1">Brand harus dipilih. Produk harus terikat dengan brand.</p>
                            )}
                            {brands.length === 0 && (
                                <p className="text-xs text-orange-500 mt-1">⚠️ Belum ada brand. Buat brand terlebih dahulu di menu Pengaturan → Merek.</p>
                            )}
                        </>
                    )}
                </div>

                {/* Stock Mode */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Mode Stok
                        </label>
                        <span className="text-xs text-red-500 font-medium">Wajib</span>
                    </div>
                    <select
                        value={formData.stockMode}
                        onChange={e => setFormData(prev => ({ ...prev, stockMode: e.target.value as 'auto' | 'real' }))}
                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                            !formData.stockMode ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                        <option value="">-- Pilih Mode Stok --</option>
                        <option value="auto">Auto (berdasar pengiriman)</option>
                        <option value="real">Real (stok gudang)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                        {formData.stockMode === 'auto' 
                            ? '💡 Stok dihitung otomatis dari total pengiriman - retur. Cocok untuk dropship/reseller.' 
                            : formData.stockMode === 'real'
                            ? '💡 Stok dihitung dari stok fisik gudang. Cocok untuk produk yang disimpan di gudang.'
                            : 'Pilih mode perhitungan stok untuk produk ini'
                        }
                    </p>
                </div>

                {/* Initial Stock (only for real mode) */}
                {formData.stockMode === 'real' && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Stok Awal (Gudang)
                            </label>
                            <span className="text-xs text-red-500 font-medium">Wajib untuk mode Real</span>
                        </div>
                        <input
                            type="number"
                            value={formData.initialStock}
                            onChange={e => setFormData(prev => ({ ...prev, initialStock: parseInt(e.target.value) || 0 }))}
                            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                                formData.initialStock <= 0 ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                            }`}
                            placeholder="Jumlah stok awal di gudang"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Masukkan jumlah stok fisik yang ada di gudang saat ini
                        </p>
                    </div>
                )}

                {/* Category with Search */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Kategori</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={isCategoryOpen ? categorySearch : formData.category}
                            onChange={e => {
                                setCategorySearch(e.target.value);
                                setIsCategoryOpen(true);
                            }}
                            onFocus={() => setIsCategoryOpen(true)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            placeholder="Cari atau pilih kategori..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCategoryOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                        </button>
                    </div>
                    {isCategoryOpen && (() => {
                        const categories = [
                            { group: 'Fashion & Aksesoris', items: ['Fashion Pria', 'Fashion Wanita', 'Fashion Anak', 'Sepatu Pria', 'Sepatu Wanita', 'Tas Pria', 'Tas Wanita', 'Aksesoris Fashion', 'Jam Tangan', 'Kacamata'] },
                            { group: 'Kecantikan & Perawatan', items: ['Skincare', 'Makeup', 'Perawatan Rambut', 'Perawatan Tubuh', 'Parfum', 'Alat Kecantikan'] },
                            { group: 'Elektronik', items: ['Handphone & Tablet', 'Laptop & Komputer', 'Aksesoris Elektronik', 'Audio', 'Kamera', 'Gaming'] },
                            { group: 'Rumah Tangga', items: ['Peralatan Dapur', 'Furnitur', 'Dekorasi Rumah', 'Peralatan Kebersihan', 'Perlengkapan Kamar Mandi'] },
                            { group: 'Kesehatan', items: ['Suplemen & Vitamin', 'Alat Kesehatan', 'Obat-obatan', 'Perawatan Medis'] },
                            { group: 'Makanan & Minuman', items: ['Makanan Ringan', 'Minuman', 'Makanan Instan', 'Bahan Makanan', 'Kue & Cokelat'] },
                            { group: 'Ibu & Bayi', items: ['Perlengkapan Bayi', 'Makanan Bayi', 'Popok & Perawatan Bayi', 'Mainan Bayi', 'Ibu Hamil & Menyusui'] },
                            { group: 'Olahraga & Outdoor', items: ['Pakaian Olahraga', 'Sepatu Olahraga', 'Alat Olahraga', 'Outdoor & Camping', 'Suplemen Fitness'] },
                            { group: 'Hobi & Koleksi', items: ['Mainan & Games', 'Koleksi', 'Musik', 'Buku', 'Alat Tulis'] },
                            { group: 'Otomotif', items: ['Aksesoris Mobil', 'Aksesoris Motor', 'Spare Part', 'Oli & Pelumas'] },
                            { group: 'Lainnya', items: ['Voucher & Gift Card', 'Jasa', 'Lain-lain'] }
                        ];
                        const searchLower = categorySearch.toLowerCase();
                        const filtered = categories.map(cat => ({
                            ...cat,
                            items: cat.items.filter(item => item.toLowerCase().includes(searchLower))
                        })).filter(cat => cat.items.length > 0);
                        
                        return (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                                {filtered.length > 0 ? filtered.map((cat, idx) => (
                                    <div key={idx}>
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 sticky top-0">
                                            {cat.group}
                                        </div>
                                        {cat.items.map((item, itemIdx) => (
                                            <button
                                                key={itemIdx}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, category: item }));
                                                    setCategorySearch('');
                                                    setIsCategoryOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-slate-600 text-sm text-slate-700 dark:text-slate-200"
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                )) : (
                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                                        Kategori tidak ditemukan
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gambar Produk</label>
                    <div className="flex items-start gap-4">
                        {formData.imageUrl && (
                            <div className="relative w-32 h-32 rounded-lg border-2 border-slate-300 overflow-hidden">
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-500 transition bg-slate-50">
                            <PhotoIcon className="w-10 h-10 mb-2 text-slate-400" />
                            <p className="text-sm text-slate-600">{isUploadingImage ? 'Mengupload...' : 'Klik untuk upload'}</p>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={isUploadingImage}
                            />
                        </label>
                    </div>
                </div>

                {/* Deskripsi */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="Deskripsi produk"
                    />
                </div>

                {/* SEO */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">SEO Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">SEO Title</label>
                            <input
                                type="text"
                                value={formData.seoTitle}
                                onChange={e => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                                placeholder="SEO Title"
                                maxLength={60}
                            />
                            <p className="text-xs text-slate-500 mt-1">{formData.seoTitle.length}/60</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">SEO Description</label>
                            <textarea
                                value={formData.seoDescription}
                                onChange={e => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                                rows={2}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                                placeholder="SEO Description"
                                maxLength={160}
                            />
                            <p className="text-xs text-slate-500 mt-1">{formData.seoDescription.length}/160</p>
                        </div>
                    </div>
                </div>

                {/* Featured */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={e => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Produk Unggulan</span>
                </label>

                {/* VARIANT SECTION */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Tipe Varian</h3>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => handleVariantModeChange('none')}
                            className={`p-4 border-2 rounded-lg text-center transition ${
                                formData.variantMode === 'none'
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-slate-300 dark:border-slate-600'
                            }`}
                        >
                            <div className="font-semibold">Tanpa Varian</div>
                            <div className="text-xs text-slate-500 mt-1">Tidak ada pilihan varian</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVariantModeChange('multi')}
                            className={`p-4 border-2 rounded-lg text-center transition ${
                                formData.variantMode === 'multi'
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-slate-300 dark:border-slate-600'
                            }`}
                        >
                            <div className="font-semibold">Dengan Varian</div>
                            <div className="text-xs text-slate-500 mt-1">Produk dengan pilihan (warna, ukuran, dll)</div>
                        </button>
                    </div>

                    {/* TANPA VARIANT */}
                    {formData.variantMode === 'none' && (
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                            <table className="w-full">
                                <tbody>
                                    <tr>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">SKU</label>
                                            <input type="text" value={formData.sku || ''} onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))} className="w-full px-2 py-1 border rounded" placeholder="SKU-001" />
                                        </td>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Harga Jual *</label>
                                            <input type="text" inputMode="decimal" value={formData.basePrice || ''} onChange={e => setFormData(prev => ({ ...prev, basePrice: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, basePrice: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Harga Coret</label>
                                            <input type="text" inputMode="decimal" value={formData.comparePrice || ''} onChange={e => setFormData(prev => ({ ...prev, comparePrice: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, comparePrice: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Harga Modal</label>
                                            <input type="text" inputMode="decimal" value={formData.costPrice || ''} onChange={e => setFormData(prev => ({ ...prev, costPrice: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, costPrice: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Komisi CS</label>
                                            <input type="text" inputMode="decimal" value={formData.csCommission || ''} onChange={e => setFormData(prev => ({ ...prev, csCommission: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, csCommission: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Komisi Advertiser</label>
                                            <input type="text" inputMode="decimal" value={formData.advCommission || ''} onChange={e => setFormData(prev => ({ ...prev, advCommission: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, advCommission: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Berat (gram)</label>
                                            <input type="text" inputMode="decimal" value={formData.weight || ''} onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, weight: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                        <td className="w-1/2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-600">
                                            <label className="block text-xs font-semibold mb-1">Stok Awal</label>
                                            <input type="text" inputMode="decimal" value={formData.stock || ''} onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value ? parseFloat(e.target.value) : null }))} onBlur={e => e.target.value === '' || isNaN(parseFloat(e.target.value)) ? setFormData(prev => ({ ...prev, stock: null })) : null} className="w-full px-2 py-1 border rounded" placeholder="0" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* DENGAN VARIAN (MULTI VARIANT) */}
                    {formData.variantMode === 'multi' && (
                        <div className="space-y-4">
                            {/* Options Form */}
                            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Atur Opsi</h4>
                                {formData.variantOptions.map((opt, idx) => (
                                    <div key={idx} className="mb-3">
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={opt.name}
                                                onChange={e => handleOptionChange(idx, 'name', e.target.value)}
                                                className="flex-1 px-2 py-1 border rounded text-sm"
                                                placeholder="Nama opsi (misal: Warna)"
                                            />
                                            {formData.variantOptions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOption(idx)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {opt.values.map((val, vidx) => (
                                                <div key={vidx} className="bg-white dark:bg-slate-600 px-2 py-1 rounded text-sm flex items-center gap-2">
                                                    <span>{val}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newValues = opt.values.filter((_, i) => i !== vidx);
                                                            handleOptionChange(idx, 'values', newValues);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 font-bold"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                            <input
                                                type="text"
                                                onKeyPress={e => {
                                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                        const newValues = [...opt.values, e.currentTarget.value.trim()];
                                                        handleOptionChange(idx, 'values', newValues);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                className="px-2 py-1 border rounded text-sm flex-1 min-w-32"
                                                placeholder="Ketik & Enter untuk tambah"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded flex items-center justify-center gap-1 mt-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Tambah Opsi
                                </button>
                            </div>

                            {/* Kombinasi Table */}
                            {formData.variants.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                                    <h4 className="font-semibold mb-3">Kombinasi Varian ({formData.variants.length})</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-slate-300 dark:border-slate-600">
                                            <thead>
                                                <tr className="bg-slate-100 dark:bg-slate-700">
                                                    <th className="px-2 py-2 border text-left">Varian</th>
                                                    <th className="px-2 py-2 border">SKU</th>
                                                    <th className="px-2 py-2 border">Harga Jual</th>
                                                    <th className="px-2 py-2 border">Harga Coret</th>
                                                    <th className="px-2 py-2 border">Harga Modal</th>
                                                    <th className="px-2 py-2 border">Komisi CS</th>
                                                    <th className="px-2 py-2 border">Komisi Adv</th>
                                                    <th className="px-2 py-2 border">Berat</th>
                                                    <th className="px-2 py-2 border">Stok</th>
                                                    <th className="px-2 py-2 border">Aksi</th>
                                                </tr>
                                            </thead>
                                        <tbody>
                                            {formData.variants.map((variant, idx) => (
                                                <tr key={idx} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-700">
                                                    <td className="px-2 py-2 border font-medium">{variant.name}</td>
                                                    <td className="px-2 py-2 border">
                                                        <input type="text" value={variant.sku || ''} onChange={e => handleVariantChange(idx, 'sku', e.target.value)} className="w-24 px-1 py-1 border rounded text-sm" placeholder="SKU" />
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.price} onChange={e => handleVariantChange(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-20 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'price')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.comparePrice} onChange={e => handleVariantChange(idx, 'comparePrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-20 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'comparePrice')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.costPrice} onChange={e => handleVariantChange(idx, 'costPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-20 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'costPrice')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.csCommission} onChange={e => handleVariantChange(idx, 'csCommission', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'csCommission')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.advCommission} onChange={e => handleVariantChange(idx, 'advCommission', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'advCommission')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.weight} onChange={e => handleVariantChange(idx, 'weight', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'weight')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border">
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" inputMode="decimal" value={variant.initialStock} onChange={e => handleVariantChange(idx, 'initialStock', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border rounded text-sm" placeholder="0" />
                                                            <button type="button" onClick={() => handleCopyValueDown(idx, 'initialStock')} className="text-blue-600 hover:text-blue-800" title="Salin ke bawah">⬇</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 border text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyAllDown(idx)}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded whitespace-nowrap"
                                                            title="Salin semua nilai ke baris di bawah"
                                                        >
                                                            ⬇ Semua
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        onClick={() => navigate('/produk')}
                        className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductFormPage;
