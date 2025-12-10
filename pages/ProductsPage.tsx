import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useRolePermissions } from '../contexts/RolePermissionsContext';
import { DEFAULT_ROLE_PERMISSIONS } from '../utils/rolePermissions';
import { Product } from '../types';
import { productService } from '../services/productService';
import { supabase } from '../firebase';
import { paginateArray, PAGE_SIZES } from '../utils/pagination';
import SearchIcon from '../components/icons/SearchIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';
import SettingsIcon from '../components/icons/SettingsIcon';
import Squares2x2Icon from '../components/icons/Squares2x2Icon';

interface ProductStats {
    [productId: string]: {
        salesCount: number;
        formCount: number;
    };
}

const ProductsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { showDialog } = useDialog();
    const navigate = useNavigate();
    const { rolePermissions } = useRolePermissions();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [productStats, setProductStats] = useState<ProductStats>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser?.id) {
            fetchProducts();
            fetchProductStats();
        }
    }, [currentUser]);

    const fetchCurrentUser = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                // Optimized: Only select needed columns
                const { data: userData } = await supabase
                    .from('users')
                    .select('id, name, role, "assignedBrandIds", status')
                    .eq('id', data.session.user.id)
                    .single();
                setCurrentUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            showToast('Gagal mengambil data pengguna', 'error');
        }
    };

    const fetchProducts = async () => {
        if (!currentUser?.id) return;
        setIsLoading(true);
        try {
            let data: Product[];
            const brandIds = currentUser.assignedBrandIds?.length
                ? currentUser.assignedBrandIds
                : currentUser.brandId
                    ? [currentUser.brandId]
                    : [];

            // Super Admin dan Advertiser dapat melihat semua produk
            if (currentUser.role === 'Super Admin' || currentUser.role === 'Advertiser') {
                data = await productService.getAllProducts();
            } else {
                // Admin/role lain hanya melihat produk brand yang di-assign
                data = await productService.getProductsByBrands(brandIds);
            }

            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            showToast('Gagal mengambil data produk', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    const handleDelete = async (productId: string) => {
        // Show professional confirmation dialog
        const result = await showDialog({
            title: 'Hapus Produk?',
            description: 'Produk ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.',
            confirmText: 'Hapus',
            cancelText: 'Batal',
            type: 'danger',
            icon: 'trash',
        });

        if (result !== 'confirm') return;

        setIsLoading(true);
        try {
            // Get product to find its brandId
            const productToDelete = products.find(p => p.id === productId);

            await productService.deleteProduct(productId);
            showToast('✅ Produk berhasil dihapus', 'success');

            // Update brand's productCount
            if (productToDelete?.brandId) {
                try {
                    const { data: brand } = await supabase
                        .from('brands')
                        .select('productCount')
                        .eq('id', productToDelete.brandId)
                        .single();

                    if (brand) {
                        const newCount = Math.max(0, (brand.productCount || 0) - 1);
                        await supabase
                            .from('brands')
                            .update({ productCount: newCount })
                            .eq('id', productToDelete.brandId);
                    }
                } catch (error) {
                    console.warn('Warning: Could not update brand productCount:', error);
                }
            }

            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('❌ Gagal menghapus produk', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getSKU = (product: Product) => {
        // Ambil SKU dari attributes atau langsung dari sku field
        return product.attributes?.sku || product.sku || '-';
    };

    const getPrice = (product: Product) => {
        // Cek apakah ada variants dengan harga
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants
                .map(v => v.price)
                .filter(p => p !== undefined && p !== null) as number[];

            if (prices.length > 1) {
                // Jika ada multiple variants, tampilkan rentang harga
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);

                if (minPrice === maxPrice) {
                    // Semua variant harga sama
                    return `Rp ${minPrice.toLocaleString('id-ID')}`;
                } else {
                    // Tampilkan rentang harga terkecil - termahal
                    return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
                }
            } else if (prices.length === 1) {
                // Hanya 1 variant
                return `Rp ${prices[0].toLocaleString('id-ID')}`;
            }
        }

        // Fallback ke basePrice jika tidak ada variants
        const price = product.basePrice || product.attributes?.basePrice;
        return price ? `Rp ${price.toLocaleString('id-ID')}` : '-';
    };

    const canEditProduct = (product: Product) => {
        // Get user permissions, with fallback to DEFAULT_ROLE_PERMISSIONS if context not ready
        const userPermissions = rolePermissions?.userPermissions;
        const userRole = currentUser?.role;

        // If no permissions data, check against DEFAULT_ROLE_PERMISSIONS as fallback
        if (!userPermissions?.features) {
            const rolePerms = DEFAULT_ROLE_PERMISSIONS[userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS];
            if (!rolePerms?.features?.includes('edit_product')) {
                return false;
            }
        } else if (!userPermissions.features.includes('edit_product')) {
            return false;
        }

        // Super Admin, Admin, dan Advertiser bisa edit
        if (currentUser.role === 'Super Admin' || currentUser.role === 'Admin') return true;

        // Advertiser hanya bisa edit produk milik brand-nya
        if (currentUser.role === 'Advertiser') {
            const userBrandIds = currentUser.assignedBrandIds?.length
                ? currentUser.assignedBrandIds
                : currentUser.brandId ? [currentUser.brandId] : [];
            return userBrandIds.includes(product.brandId);
        }

        return false;
    };

    const canDeleteProduct = (product: Product) => {
        // Get user permissions
        const userPermissions = rolePermissions?.userPermissions;
        const userRole = currentUser?.role;

        // Check delete_product permission
        if (!userPermissions?.features) {
            const rolePerms = DEFAULT_ROLE_PERMISSIONS[userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS];
            if (!rolePerms?.features?.includes('delete_product')) {
                return false;
            }
        } else if (!userPermissions.features.includes('delete_product')) {
            return false;
        }

        // Hanya Super Admin yang bisa hapus
        return currentUser.role === 'Super Admin';
    };

    const fetchProductStats = async () => {
        try {
            let productsToCheck: Product[] = [];
            const brandIds = currentUser.assignedBrandIds?.length
                ? currentUser.assignedBrandIds
                : currentUser.brandId
                    ? [currentUser.brandId]
                    : [];

            // Super Admin dan Advertiser dapat melihat semua produk
            if (currentUser.role === 'Super Admin' || currentUser.role === 'Advertiser') {
                productsToCheck = await productService.getAllProducts();
            } else {
                // Admin/role lain hanya melihat produk brand yang di-assign
                productsToCheck = await productService.getProductsByBrands(brandIds);
            }

            const stats: ProductStats = {};

            for (const product of productsToCheck) {
                // Hitung jumlah form yang diassign
                const forms = await productService.getProductForms(product.id);

                // Hitung jumlah terjual (dari orders table)
                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('product_id', product.id)
                    .eq('status', 'Delivered');

                if (!error) {
                    stats[product.id] = {
                        salesCount: orders?.length || 0,
                        formCount: forms?.length || 0,
                    };
                }
            }

            setProductStats(stats);
        } catch (error) {
            console.error('Error fetching product stats:', error);
        }
    };

    const filteredProducts = useMemo(() => products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSKU(p).toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

    // --- Pagination State ---
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES.SMALL); // default 10 per page
    const [page, setPage] = useState<number>(1);

    // Reset to first page when filters/search/pageSize change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, pageSize, products]);

    const paginationResult = useMemo(() => {
        if (!filteredProducts || filteredProducts.length === 0) {
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
        const effectivePageSize = pageSize === 0 ? Math.max(1, filteredProducts.length) : pageSize;
        return paginateArray(filteredProducts, page, effectivePageSize);
    }, [filteredProducts, page, pageSize]);

    const paginatedProducts = paginationResult.data;
    const totalPages = paginationResult.totalPages;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                        <Squares2x2Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Produk Induk</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Kelola daftar produk induk dan akses analitik.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/analitik-produk')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 dark:bg-slate-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition"
                    >
                        <SettingsIcon className="w-4 h-4" />
                        Analitik
                    </button>
                    <button
                        onClick={() => navigate('/daftar-produk/tambah')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Tambah Produk
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Products Table */}
            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    Belum ada produk. Tambahkan produk baru untuk mulai melacak formulir.
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="px-5 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Nama Produk
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    SKU
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Kategori
                                </th>
                                <th className="px-5 py-3 text-left font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Harga
                                </th>
                                <th className="px-5 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Terjual
                                </th>
                                <th className="px-5 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Form
                                </th>
                                <th className="px-5 py-3 text-center font-semibold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-5 py-3 text-slate-900 dark:text-slate-100 font-medium">
                                        {product.name}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        {getSKU(product)}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        {product.category || '-'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-900 dark:text-slate-100">
                                        {getPrice(product)}
                                    </td>
                                    <td className="px-5 py-3 text-center text-slate-900 dark:text-slate-100">
                                        <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            {productStats[product.id]?.salesCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center text-slate-900 dark:text-slate-100">
                                        <span className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            {productStats[product.id]?.formCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-center relative">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)}
                                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-lg transition"
                                                title="Menu Aksi"
                                            >
                                                <EllipsisVerticalIcon className="w-5 h-5" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openDropdown === product.id && (
                                                <div className="absolute right-0 mt-8 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg z-10 border border-slate-200 dark:border-slate-600">
                                                    <button
                                                        onClick={() => {
                                                            if (!canEditProduct(product)) {
                                                                showToast('Anda hanya bisa edit produk milik brand Anda', 'error');
                                                                return;
                                                            }
                                                            navigate(`/daftar-produk/edit/${product.id}`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        disabled={!canEditProduct(product)}
                                                        className={`w-full text-left px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600 ${canEditProduct(product)
                                                            ? 'hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 cursor-pointer'
                                                            : 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                                                            }`}
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                        Edit Produk {!canEditProduct(product) && '🔒'}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            // Implementasi view forms untuk produk ini
                                                            navigate(`/produk/${product.id}/forms`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Lihat Form ({productStats[product.id]?.formCount || 0})
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            navigate(`/produk/${product.id}/forms`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        Lihat Form ({productStats[product.id]?.formCount || 0})
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            navigate(`/produk/${product.id}/sales`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Penjualan ({productStats[product.id]?.salesCount || 0})
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            navigate(`/produk/${product.id}/details`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-650 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        Analytics
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            if (!canDeleteProduct(product)) {
                                                                showToast('Hanya Super Admin yang bisa hapus produk', 'error');
                                                                return;
                                                            }
                                                            handleDelete(product.id);
                                                            setOpenDropdown(null);
                                                        }}
                                                        disabled={!canDeleteProduct(product)}
                                                        className={`w-full text-left px-4 py-3 flex items-center gap-2 ${canDeleteProduct(product)
                                                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer'
                                                            : 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                                                            }`}
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                        Hapus Produk {!canDeleteProduct(product) && '🔒'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {filteredProducts.length > 0 && (
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
                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold text-sm">Total: {filteredProducts.length}</span>
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
            )}
        </div>
    );
};

export default ProductsPage;
