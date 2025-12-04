import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Product } from '../types';
import { productService } from '../services/productService';
import { supabase } from '../firebase';
import { uploadFileAndGetURL } from '../fileUploader';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PhotoIcon from '../components/icons/PhotoIcon';

type VariantMode = 'none' | 'single' | 'multi';

interface VariantOption {
    name: string;
    values: string[];
}

interface VariantData {
    name: string;
    price: number;
    comparePrice: number;
    costPrice: number;
    csCommission: number;
    advCommission: number;
    weight: number;
    initialStock: number;
}

interface ProductFormData {
    name: string;
    description: string;
    imageUrl: string;
    sku: string;
    category: string;
    basePrice: number | null;
    comparePrice: number | null;
    costPrice: number | null;
    csCommission: number | null;
    advCommission: number | null;
    weight: number | null;
    stock: number | null;
    isFeatured: boolean;
    seoTitle: string;
    seoDescription: string;
    brandId?: string;
    variants?: VariantData[];
    variantOptions?: VariantOption[];
}

const ProductFormPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [brands, setBrands] = useState<any[]>([]);
    const [isLoadingBrands, setIsLoadingBrands] = useState(false);
    const [variantMode, setVariantMode] = useState<VariantMode>('none');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        imageUrl: '',
        sku: '',
        category: '',
        basePrice: null,
        comparePrice: null,
        costPrice: null,
        csCommission: null,
        advCommission: null,
        weight: null,
        stock: null,
        isFeatured: false,
        seoTitle: '',
        seoDescription: '',
        brandId: undefined,
        variants: [],
        variantOptions: [],
    });
    const [optionValueBuffers, setOptionValueBuffers] = useState<string[]>(
        []
    );

    useEffect(() => {
        fetchCurrentUser();
        fetchBrands();
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            fetchProduct();
        }
    }, [id, isEdit]);

    const fetchCurrentUser = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.session.user.id)
                    .single();
                setCurrentUser(userData);
                if (!isEdit) {
                    setFormData(prev => ({ ...prev, brandId: userData.id }));
                }
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            showToast('Gagal mengambil data pengguna', 'error');
        }
    };

    const fetchBrands = async () => {
        setIsLoadingBrands(true);
        try {
            const { data } = await supabase
                .from('brands')
                .select('id, name')
                .order('name', { ascending: true });
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
                setFormData({
                    name: product.name,
                    description: product.description || '',
                    imageUrl: product.imageUrl || '',
                    sku: product.sku || '',
                    category: product.category || '',
                    basePrice: product.basePrice || null,
                    costPrice: product.costPrice || null,
                    isFeatured: product.isFeatured,
                    seoTitle: product.seoTitle || '',
                    seoDescription: product.seoDescription || '',
                    brandId: product.brandId,
                    variants: variants,
                });
                
                // Set variant mode based on existing variants
                if (variants.length === 0) {
                    setVariantMode('none');
                } else if (variants.length === 1) {
                    setVariantMode('single');
                } else {
                    setVariantMode('multi');
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            showToast('Gagal mengambil data produk', 'error');
            navigate('/produk');
        } finally {
            setIsLoading(false);
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

        setIsLoading(true);
        try {
            if (isEdit && id) {
                // Update
                await productService.updateProduct(id, {
                    name: formData.name,
                    description: formData.description,
                    imageUrl: formData.imageUrl,
                    sku: formData.sku,
                    category: formData.category,
                    basePrice: formData.basePrice || undefined,
                    costPrice: formData.costPrice || undefined,
                    isFeatured: formData.isFeatured,
                    seoTitle: formData.seoTitle,
                    seoDescription: formData.seoDescription,
                    variants: formData.variants,
                });
                showToast('Produk berhasil diperbarui', 'success');
            } else {
                // Create
                if (!formData.brandId) throw new Error('Brand not selected');
                await productService.createProduct({
                    brandId: formData.brandId,
                    name: formData.name,
                    description: formData.description,
                    imageUrl: formData.imageUrl,
                    sku: formData.sku,
                    category: formData.category,
                    basePrice: formData.basePrice || undefined,
                    costPrice: formData.costPrice || undefined,
                    status: 'active',
                    isFeatured: formData.isFeatured,
                    tags: [],
                    attributes: {},
                    seoTitle: formData.seoTitle,
                    seoDescription: formData.seoDescription,
                    stockTracking: { enabled: false, current: 0 },
                    variants: formData.variants,
                });
                showToast('Produk berhasil ditambahkan', 'success');
            }
            navigate('/produk');
        } catch (error) {
            console.error('Error saving product:', error);
            showToast('Gagal menyimpan produk', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddVariant = () => {
        const newVariant: VariantData = {
            name: '',
            price: 0,
            comparePrice: 0,
            costPrice: 0,
            csCommission: 0,
            advCommission: 0,
            weight: 0,
            initialStock: 0,
        };
        setFormData({
            ...formData,
            variants: [...(formData.variants || []), newVariant]
        });
    };

    const handleRemoveVariant = (index: number) => {
        const newVariants = formData.variants?.filter((_, i) => i !== index) || [];
        setFormData({ ...formData, variants: newVariants });
    };

    const handleVariantChange = (index: number, field: keyof VariantData, value: any) => {
        const newVariants = [...(formData.variants || [])];
        newVariants[index] = {
            ...newVariants[index],
            [field]: value
        };
        setFormData({ ...formData, variants: newVariants });
    };

    const handleVariantModeChange = (mode: VariantMode) => {
        setVariantMode(mode);
        if (mode === 'none') {
            setFormData({ ...formData, variants: [], variantOptions: [] });
        } else if (mode === 'single' && (!formData.variants || formData.variants.length === 0)) {
            handleAddVariant();
        } else if (mode === 'multi') {
            // Initialize with 2 options for multi variant
            if (!formData.variantOptions || formData.variantOptions.length === 0) {
                setFormData({
                    ...formData,
                    variantOptions: [
                        { name: 'Warna', values: [] },
                        { name: 'Ukuran', values: [] }
                    ],
                    variants: []
                });
            }
        }
    };

    const handleAddOption = () => {
        setFormData({
            ...formData,
            variantOptions: [...(formData.variantOptions || []), { name: '', values: [] }]
        });
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = formData.variantOptions?.filter((_, i) => i !== index) || [];
        setFormData({ ...formData, variantOptions: newOptions });
        generateVariantCombinations(newOptions);
    };

    const handleOptionChange = (index: number, field: 'name' | 'values', value: any) => {
        const newOptions = [...(formData.variantOptions || [])];
        newOptions[index] = {
            ...newOptions[index],
            [field]: value
        };
        setFormData({ ...formData, variantOptions: newOptions });
        if (field === 'values') {
            generateVariantCombinations(newOptions);
        }
    };

    const generateVariantCombinations = (options: VariantOption[]) => {
        // Filter options yang punya values
        const validOptions = options.filter(opt => opt.values.length > 0);
        
        if (validOptions.length === 0) {
            setFormData(prev => ({ ...prev, variants: [] }));
            return;
        }

        // Generate semua kombinasi
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

        // Buat variants dari kombinasi
        const existingVariants = formData.variants || [];
        const newVariants: VariantData[] = combinations.map(combo => {
            const name = combo.join(' - ');
            // Cari existing variant dengan nama yang sama untuk preserve data
            const existing = existingVariants.find(v => v.name === name);
            return existing || {
                name,
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
            setFormData({ ...formData, imageUrl });
            showToast('Gambar berhasil diupload', 'success');
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Gagal mengupload gambar', 'error');
        } finally {
            setIsUploadingImage(false);
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
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/produk')}
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
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nama Produk *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Contoh: Laptop Gaming Pro"
                        />
                    </div>

                    {/* Brand Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Brand / Merek *
                        </label>
                        {isLoadingBrands ? (
                            <div className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500">
                                Loading brands...
                            </div>
                        ) : (
                            <select
                                value={formData.brandId || ''}
                                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">-- Pilih Brand --</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* SKU & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                SKU
                            </label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="SKU-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Kategori
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Elektronik"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Gambar Produk
                        </label>
                        <div className="flex items-start gap-4">
                            {formData.imageUrl && (
                                <div className="relative w-32 h-32 rounded-lg border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex-1">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition bg-slate-50 dark:bg-slate-700/50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <PhotoIcon className="w-10 h-10 mb-2 text-slate-400" />
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {isUploadingImage ? 'Mengupload...' : 'Klik untuk upload gambar'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, JPEG (Max 5MB)</p>
                                    </div>
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
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Deskripsi produk"
                        />
                    </div>

                    {/* SEO Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                            SEO Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    SEO Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.seoTitle}
                                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Title untuk SEO"
                                    maxLength={60}
                                />
                                <p className="text-xs text-slate-500 mt-1">{formData.seoTitle.length}/60</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    SEO Description
                                </label>
                                <textarea
                                    value={formData.seoDescription}
                                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Description untuk SEO"
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
                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-slate-700 dark:text-slate-300">Tandai sebagai Produk Unggulan</span>
                    </label>

                    {/* Variant Management Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                            Varian Produk
                        </h3>

                        {/* Variant Mode Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Tipe Varian
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleVariantModeChange('none')}
                                    className={`p-4 border-2 rounded-lg text-center transition ${
                                        variantMode === 'none'
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">Tanpa Varian</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Produk tanpa variasi</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleVariantModeChange('single')}
                                    className={`p-4 border-2 rounded-lg text-center transition ${
                                        variantMode === 'single'
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">Single Varian</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 varian saja</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleVariantModeChange('multi')}
                                    className={`p-4 border-2 rounded-lg text-center transition ${
                                        variantMode === 'multi'
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
                                    }`}
                                >
                                    <div className="font-semibold text-slate-900 dark:text-slate-100">Multi Varian</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lebih dari 1 varian</div>
                                </button>
                            </div>
                        </div>

                        {/* Variants List */}
                        {variantMode === 'multi' && formData.variants && formData.variants.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 overflow-x-auto">
                                <table className="min-w-full text-sm border border-slate-200 dark:border-slate-700">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-700">
                                            <th className="px-2 py-2 border">Varian</th>
                                            <th className="px-2 py-2 border">Harga Jual</th>
                                            <th className="px-2 py-2 border">Harga Coret</th>
                                            <th className="px-2 py-2 border">Harga Modal</th>
                                            <th className="px-2 py-2 border">Komisi CS</th>
                                            <th className="px-2 py-2 border">Komisi Adv</th>
                                            <th className="px-2 py-2 border">Berat (gram)</th>
                                            <th className="px-2 py-2 border">Stok Awal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.variants.map((variant, index) => (
                                            <tr key={index} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-700">
                                                <td className="px-2 py-2 border font-medium text-slate-900 dark:text-slate-100">{variant.name}</td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.price} onChange={e => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.comparePrice} onChange={e => handleVariantChange(index, 'comparePrice', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.costPrice} onChange={e => handleVariantChange(index, 'costPrice', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.csCommission} onChange={e => handleVariantChange(index, 'csCommission', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.advCommission} onChange={e => handleVariantChange(index, 'advCommission', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.weight} onChange={e => handleVariantChange(index, 'weight', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" />
                                                </td>
                                                <td className="px-2 py-2 border">
                                                    <input type="number" value={variant.initialStock} onChange={e => handleVariantChange(index, 'initialStock', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {variantMode !== 'none' && (
                            <div className="space-y-4">
                                {formData.variants && formData.variants.length > 0 ? (
                                    <>
                                        {variantMode === 'multi' && (
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                    ✓ {formData.variants.length} kombinasi varian berhasil di-generate
                                                </p>
                                            </div>
                                        )}
                                        {formData.variants.map((variant, index) => (
                                        <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {variantMode === 'multi' ? variant.name : `Varian ${index + 1}`}
                                                </h4>
                                                {variantMode === 'single' && formData.variants!.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVariant(index)}
                                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Name - Only editable for single mode */}
                                                {variantMode === 'single' && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                            Nama Varian *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={variant.name}
                                                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                            placeholder="Contoh: Merah / Size M"
                                                        />
                                                    </div>
                                                )}

                                                {/* Price */}
                                                <div className={variantMode === 'multi' ? 'md:col-span-2' : ''}>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Harga Jual *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Compare Price */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Harga Coret
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.comparePrice}
                                                        onChange={(e) => handleVariantChange(index, 'comparePrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Cost Price */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Harga Modal
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.costPrice}
                                                        onChange={(e) => handleVariantChange(index, 'costPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* CS Commission */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Komisi CS
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.csCommission}
                                                        onChange={(e) => handleVariantChange(index, 'csCommission', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Adv Commission */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Komisi Advertiser
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.advCommission}
                                                        onChange={(e) => handleVariantChange(index, 'advCommission', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Weight */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Berat (gram)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.weight}
                                                        onChange={(e) => handleVariantChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Initial Stock */}
                                                <div>
                                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Stok Awal
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variant.initialStock}
                                                        onChange={(e) => handleVariantChange(index, 'initialStock', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-lg">
                                        Belum ada varian. Klik tombol di bawah untuk menambahkan.
                                    </div>
                                )}

                                {/* Add Variant Button */}
                                {/* Tombol tambah varian manual di mode multi dihapus, hanya kombinasi otomatis */}

                                {variantMode === 'single' && (!formData.variants || formData.variants.length === 0) && (
                                    <button
                                        type="button"
                                        onClick={handleAddVariant}
                                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        Tambah Varian
                                    </button>
                                )}
                            </div>
                        )}

                        {variantMode === 'none' && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center">
                                Produk ini tidak memiliki varian. Silahkan isi harga di bawah.
                            </div>
                        )}

                        {/* TANPA VARIANT - TABEL HORIZONTAL */}
                        {variantMode === 'none' && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6">
                                <table className="w-full text-sm border-collapse">
                                    <tbody>
                                        {/* Row 1 */}
                                        <tr>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Jual *</label>
                                                <input type="number" value={formData.basePrice || ''} onChange={e => setFormData({ ...formData, basePrice: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Coret</label>
                                                <input type="number" value={formData.comparePrice || ''} onChange={e => setFormData({ ...formData, comparePrice: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                        </tr>
                                        {/* Row 2 */}
                                        <tr>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Harga Modal</label>
                                                <input type="number" value={formData.costPrice || ''} onChange={e => setFormData({ ...formData, costPrice: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Komisi CS</label>
                                                <input type="number" value={formData.csCommission || ''} onChange={e => setFormData({ ...formData, csCommission: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                        </tr>
                                        {/* Row 3 */}
                                        <tr>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Komisi Advertiser</label>
                                                <input type="number" value={formData.advCommission || ''} onChange={e => setFormData({ ...formData, advCommission: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Berat (gram)</label>
                                                <input type="number" value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                        </tr>
                                        {/* Row 4 */}
                                        <tr>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stok Awal</label>
                                                <input type="number" value={formData.stock || ''} onChange={e => setFormData({ ...formData, stock: e.target.value ? parseFloat(e.target.value) : null })} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100" placeholder="0" />
                                            </td>
                                            <td className="w-1/2 px-3 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8 pt-6 border-t">
                    <button
                        onClick={() => navigate('/produk')}
                        className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition font-medium"
                    >
                        {isLoading ? 'Menyimpan...' : (isEdit ? 'Update Produk' : 'Simpan Produk')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductFormPage;
