import React, { useState, useEffect } from 'react';
import TrashIcon from '../components/icons/TrashIcon';
import XIcon from '../components/icons/XIcon';

interface Variant {
    id?: string;
    attributes: Record<string, string>;
    sellingPrice: number;
    strikethroughPrice?: number;
    costPrice?: number;
    csCommission?: number;
    advCommission?: number;
    weight?: number;
    initialStock?: number;
}

interface ProductVariantModalProps {
    isOpen: boolean;
    onClose: () => void;
    variants: Variant[];
    onSave: (variants: Variant[]) => void;
    productName: string;
}

const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
    isOpen,
    onClose,
    variants: initialVariants,
    onSave,
    productName,
}) => {
    const [variants, setVariants] = useState<Variant[]>(initialVariants);

    useEffect(() => {
        setVariants(initialVariants);
    }, [initialVariants]);

    const handleAddVariant = () => {
        const newVariant: Variant = {
            id: Date.now().toString(),
            attributes: {},
            sellingPrice: 0,
        };
        setVariants([...variants, newVariant]);
    };

    const handleVariantChange = (index: number, field: keyof Variant, value: any) => {
        const newVariants = [...variants];
        if (field === 'sellingPrice' || field === 'strikethroughPrice' || field === 'weight' || 
            field === 'costPrice' || field === 'csCommission' || field === 'advCommission' || field === 'initialStock') {
            const numValue = value === '' ? undefined : parseFloat(value);
            newVariants[index] = { ...newVariants[index], [field]: numValue };
        } else {
            newVariants[index] = { ...newVariants[index], [field]: value };
        }
        setVariants(newVariants);
    };

    const handleRemoveVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave(variants);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Varian Produk: {productName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {variants.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        Tidak ada varian. Klik "Tambah Varian" untuk menambahkan.
                    </div>
                ) : (
                    <div className="overflow-x-auto mb-6">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="p-2 text-left font-medium text-slate-500">Harga Jual</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Harga Coret</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Modal</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Komisi CS</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Komisi Adv</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Berat (gr)</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Stok Awal</th>
                                    <th className="p-2 text-center font-medium text-slate-500">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {variants.map((variant, index) => (
                                    <tr key={variant.id || index} className="align-top">
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.sellingPrice}
                                                onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                                                className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.strikethroughPrice ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'strikethroughPrice', e.target.value)}
                                                className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.costPrice ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'costPrice', e.target.value)}
                                                className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.csCommission ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'csCommission', e.target.value)}
                                                className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.advCommission ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'advCommission', e.target.value)}
                                                className="w-24 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.weight ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                                                className="w-20 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="p-1">
                                            <input
                                                type="number"
                                                value={variant.initialStock ?? ''}
                                                onChange={(e) => handleVariantChange(index, 'initialStock', e.target.value)}
                                                className="w-20 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600"
                                            />
                                        </td>
                                        <td className="p-1 text-center">
                                            <button
                                                onClick={() => handleRemoveVariant(index)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded-lg transition"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={handleAddVariant}
                        className="flex-1 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-medium"
                    >
                        + Tambah Varian
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
                    >
                        Simpan Varian
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductVariantModal;
