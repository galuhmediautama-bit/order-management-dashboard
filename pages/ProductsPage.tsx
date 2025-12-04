import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Product } from '../types';
import { productService } from '../services/productService';
import { supabase } from '../firebase';
import SearchIcon from '../components/icons/SearchIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PlusIcon from '../components/icons/PlusIcon';
import EllipsisVerticalIcon from '../components/icons/EllipsisVerticalIcon';

interface ProductStats {
    [productId: string]: {
        salesCount: number;
        formCount: number;
    };
}

const ProductsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
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
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
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
            
            // Super Admin dapat melihat semua produk
            if (currentUser.role === 'Super Admin') {
                data = await productService.getAllProducts();
            } else {
                // Admin/Brand hanya melihat produk brand mereka sendiri
                data = await productService.getProductsByBrand(currentUser.id);
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
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

        setIsLoading(true);
        try {
            // Get product to find its brandId
            const productToDelete = products.find(p => p.id === productId);
            
            await productService.deleteProduct(productId);
            showToast('Produk berhasil dihapus', 'success');
            
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
            showToast('Gagal menghapus produk', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const getSKU = (product: Product) => {
        // Ambil SKU dari attributes atau langsung dari sku field
        return product.attributes?.sku || product.sku || '-';
    };

    const getPrice = (product: Product) => {
        // Ambil harga dari basePrice atau attributes.basePrice
        const price = product.basePrice || product.attributes?.basePrice;
        return price ? `Rp ${price.toLocaleString('id-ID')}` : '-';
    };

    const fetchProductStats = async () => {
        try {
            let productsToCheck: Product[] = [];
            
            // Super Admin dapat melihat semua produk
            if (currentUser.role === 'Super Admin') {
                productsToCheck = await productService.getAllProducts();
            } else {
                // Admin/Brand hanya melihat produk brand mereka sendiri
                productsToCheck = await productService.getProductsByBrand(currentUser.id);
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

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSKU(p).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Produk Induk
                </h1>
                <button
                    onClick={() => navigate('/daftar-produk/tambah')}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <PlusIcon className="w-5 h-5" />
                    Tambah Produk
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Nama Produk
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    SKU
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Kategori
                                </th>
                                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                                    Harga
                                </th>
                                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                                    Terjual
                                </th>
                                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                                    Form
                                </th>
                                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-100">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {getSKU(product)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {product.category || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                                        {getPrice(product)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-900 dark:text-slate-100">
                                        <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-semibold">
                                            {productStats[product.id]?.salesCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-900 dark:text-slate-100">
                                        <span className="inline-flex items-center justify-center bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-semibold">
                                            {productStats[product.id]?.formCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center relative">
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
                                                            navigate(`/produk/edit/${product.id}`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                        Edit Produk
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
                                                            // Implementasi view sales untuk produk ini
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
                                                            // Implementasi view analytics untuk produk ini
                                                            navigate(`/produk/${product.id}/analytics`);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        Analytics
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            handleDelete(product.id);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                        Hapus Produk
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
