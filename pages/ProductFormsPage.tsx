import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Form, Product } from '../types';
import { supabase } from '../firebase';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import EyeIcon from '../components/icons/EyeIcon';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ArrowLeftIcon from '../components/icons/ChevronUpIcon';
import { useToast } from '../contexts/ToastContext';

const ProductFormsPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

    useEffect(() => {
        if (productId) {
            fetchData();
        }
    }, [productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch product details
            const { data: productData } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (productData) {
                setProduct(productData as Product);
            }

            // Fetch forms for this product
            const { data: formsData } = await supabase
                .from('forms')
                .select('*')
                .eq('product_id', productId);

            if (formsData) {
                setForms(formsData as Form[]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading forms', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkForm = async (formId: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghubungkan form dari produk ini?')) {
            return;
        }

        setUnlinkingId(formId);
        try {
            const { error } = await supabase
                .from('forms')
                .update({ product_id: null })
                .eq('id', formId);

            if (error) throw error;

            setForms(forms.filter(f => f.id !== formId));
            showToast('Form berhasil dihubungkan', 'success');
        } catch (error) {
            console.error('Error unlinking form:', error);
            showToast('Error menghubungkan form', 'error');
        } finally {
            setUnlinkingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <SpinnerIcon className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold">{product?.name || 'Produk'}</h1>
                    <p className="text-slate-600 dark:text-slate-400">Form Terhubung</p>
                </div>
            </div>

            {/* Forms List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                {forms.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-600 dark:text-slate-400">Belum ada form yang terhubung dengan produk ini</p>
                        <button
                            onClick={() => navigate('/formulir')}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Lihat Semua Form
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Nama Form</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Slug</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {forms.map(form => (
                                    <tr key={form.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{form.title}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                                {form.slug}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                form.active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {form.active ? 'Aktif' : 'Tidak Aktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(`/#/f/${form.slug}`, '_blank')}
                                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400"
                                                    title="Lihat Form"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/form-editor/${form.id}`)}
                                                    className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400"
                                                    title="Edit Form"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUnlinkForm(form.id)}
                                                    disabled={unlinkingId === form.id}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 disabled:opacity-50"
                                                    title="Hubungkan dari Produk"
                                                >
                                                    {unlinkingId === form.id ? (
                                                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <TrashIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductFormsPage;
