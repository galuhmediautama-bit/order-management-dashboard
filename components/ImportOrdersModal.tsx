import React, { useState, useCallback, useRef } from 'react';
import XIcon from './icons/XIcon';
import UploadIcon from './icons/UploadIcon';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';
import XCircleIcon from './icons/XCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import DownloadIcon from './icons/DownloadIcon';
import type { Order, OrderStatus, Form, User } from '../types';
import { supabase } from '../firebase';

interface ImportOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
    forms: Form[];
    csAgents: User[];
}

interface ImportedRow {
    rowNumber: number;
    data: Partial<Order>;
    isValid: boolean;
    errors: string[];
    originalData: Record<string, string>;
}

const REQUIRED_COLUMNS = ['customer', 'customerPhone', 'productName', 'productPrice', 'status'];
const OPTIONAL_COLUMNS = ['customerEmail', 'shippingAddress', 'shippingMethod', 'paymentMethod', 'quantity', 'variant', 'notes', 'formId', 'assignedCsId'];

const VALID_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];

const ImportOrdersModal: React.FC<ImportOrdersModalProps> = ({ isOpen, onClose, onImportSuccess, forms, csAgents }) => {
    const [file, setFile] = useState<File | null>(null);
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [saveResult, setSaveResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setImportedRows([]);
        setStep('upload');
        setSaveResult({ success: 0, failed: 0 });
        setIsProcessing(false);
        setIsSaving(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const parseCSV = (text: string): Record<string, string>[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    const validateRow = (row: Record<string, string>, rowNumber: number): ImportedRow => {
        const errors: string[] = [];
        
        // Check required fields
        if (!row.customer?.trim()) errors.push('Nama pelanggan wajib diisi');
        if (!row.customerPhone?.trim()) errors.push('No. HP wajib diisi');
        if (!row.productName?.trim()) errors.push('Nama produk wajib diisi');
        if (!row.productPrice?.trim()) errors.push('Harga produk wajib diisi');
        
        // Validate price
        const price = parseFloat(row.productPrice || '0');
        if (isNaN(price) || price < 0) errors.push('Harga produk tidak valid');

        // Validate status
        const status = row.status?.trim() as OrderStatus;
        if (status && !VALID_STATUSES.includes(status)) {
            errors.push(`Status tidak valid. Gunakan: ${VALID_STATUSES.join(', ')}`);
        }

        // Validate quantity
        const quantity = parseInt(row.quantity || '1');
        if (isNaN(quantity) || quantity < 1) errors.push('Jumlah harus minimal 1');

        // Validate phone format (basic)
        const phone = row.customerPhone?.trim();
        if (phone && !/^[0-9+\-\s()]{8,20}$/.test(phone)) {
            errors.push('Format no. HP tidak valid');
        }

        // Validate email if provided
        const email = row.customerEmail?.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Format email tidak valid');
        }

        const data: Partial<Order> = {
            customer: row.customer?.trim() || '',
            customerPhone: row.customerPhone?.trim() || '',
            customerEmail: row.customerEmail?.trim() || '',
            productName: row.productName?.trim() || '',
            productPrice: price,
            totalPrice: price * (quantity || 1),
            status: (status || 'Pending') as OrderStatus,
            shippingAddress: row.shippingAddress?.trim() || '',
            shippingMethod: row.shippingMethod?.trim() || '',
            paymentMethod: row.paymentMethod?.trim() || '',
            quantity: quantity || 1,
            variant: row.variant?.trim() || '',
            notes: row.notes?.trim() || '',
            formId: row.formId?.trim() || undefined,
            assignedCsId: row.assignedCsId?.trim() || undefined,
            date: new Date().toISOString(),
            urgency: 'Medium',
            followUps: 0,
        };

        return {
            rowNumber,
            data,
            isValid: errors.length === 0,
            errors,
            originalData: row
        };
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessing(true);

        try {
            const text = await selectedFile.text();
            const rows = parseCSV(text);
            
            if (rows.length === 0) {
                alert('File CSV kosong atau format tidak valid');
                setIsProcessing(false);
                return;
            }

            const validatedRows = rows.map((row, index) => validateRow(row, index + 2)); // +2 karena header di row 1
            setImportedRows(validatedRows);
            setStep('preview');
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Gagal membaca file. Pastikan format CSV valid.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            const input = fileInputRef.current;
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                input.files = dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            alert('Hanya file CSV yang didukung');
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const updateRowData = (rowIndex: number, field: string, value: string) => {
        setImportedRows(prev => {
            const updated = [...prev];
            const row = { ...updated[rowIndex] };
            row.originalData = { ...row.originalData, [field]: value };
            
            // Re-validate
            const revalidated = validateRow(row.originalData, row.rowNumber);
            updated[rowIndex] = revalidated;
            return updated;
        });
    };

    const removeRow = (rowIndex: number) => {
        setImportedRows(prev => prev.filter((_, i) => i !== rowIndex));
    };

    const handleSave = async () => {
        const validRows = importedRows.filter(row => row.isValid);
        if (validRows.length === 0) {
            alert('Tidak ada data valid untuk disimpan');
            return;
        }

        setIsSaving(true);
        let successCount = 0;
        let failedCount = 0;

        for (const row of validRows) {
            try {
                const orderData = {
                    customer: row.data.customer,
                    "customerPhone": row.data.customerPhone,
                    "customerEmail": row.data.customerEmail || null,
                    "productName": row.data.productName,
                    "productPrice": row.data.productPrice,
                    "totalPrice": row.data.totalPrice,
                    status: row.data.status,
                    "shippingAddress": row.data.shippingAddress || null,
                    "shippingMethod": row.data.shippingMethod || null,
                    "paymentMethod": row.data.paymentMethod || null,
                    quantity: row.data.quantity || 1,
                    variant: row.data.variant || null,
                    notes: row.data.notes || null,
                    "formId": row.data.formId || null,
                    "assignedCsId": row.data.assignedCsId || null,
                    date: new Date().toISOString(),
                    urgency: 'Medium',
                    "followUps": 0,
                };

                const { error } = await supabase.from('orders').insert(orderData);
                
                if (error) {
                    console.error('Error inserting order:', error);
                    failedCount++;
                } else {
                    successCount++;
                }
            } catch (error) {
                console.error('Error saving order:', error);
                failedCount++;
            }
        }

        setSaveResult({ success: successCount, failed: failedCount });
        setStep('result');
        setIsSaving(false);

        if (successCount > 0) {
            onImportSuccess();
        }
    };

    const downloadTemplate = () => {
        const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
        const sampleRow = [
            'John Doe',           // customer
            '08123456789',        // customerPhone
            'Produk A',           // productName
            '100000',             // productPrice
            'Pending',            // status
            'john@email.com',     // customerEmail
            'Jl. Contoh No. 123', // shippingAddress
            'JNE REG',            // shippingMethod
            'Transfer Bank',      // paymentMethod
            '1',                  // quantity
            'Merah - XL',         // variant
            'Catatan pesanan',    // notes
            '',                   // formId
            '',                   // assignedCsId
        ];

        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_import_pesanan.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const validCount = importedRows.filter(r => r.isValid).length;
    const invalidCount = importedRows.filter(r => !r.isValid).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Pesanan</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {step === 'upload' && 'Upload file CSV untuk import pesanan'}
                            {step === 'preview' && 'Preview dan koreksi data sebelum menyimpan'}
                            {step === 'result' && 'Hasil import pesanan'}
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isProcessing ? (
                                    <div className="flex flex-col items-center">
                                        <SpinnerIcon className="w-12 h-12 text-indigo-500 animate-spin mb-3" />
                                        <p className="text-slate-600 dark:text-slate-400">Memproses file...</p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                                            Drag & drop file CSV di sini
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">atau klik untuk memilih file</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Template CSV</p>
                                    <p className="text-xs text-slate-500">Download template untuk format yang benar</p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors text-sm font-medium"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Download Template
                                </button>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">Kolom yang diperlukan:</p>
                                <div className="flex flex-wrap gap-2">
                                    {REQUIRED_COLUMNS.map(col => (
                                        <span key={col} className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded text-xs font-mono">
                                            {col}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                                    <CheckCircleFilledIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{validCount} Valid</span>
                                </div>
                                {invalidCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                                        <XCircleIcon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{invalidCount} Error</span>
                                    </div>
                                )}
                                <span className="text-sm text-slate-500">
                                    Total: {importedRows.length} baris
                                </span>
                            </div>

                            {/* Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">#</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Pelanggan</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">No. HP</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Produk</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Harga</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Qty</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Total</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {importedRows.map((row, index) => (
                                                <tr key={index} className={`${!row.isValid ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                    <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                                                    <td className="px-3 py-2">
                                                        {row.isValid ? (
                                                            <CheckCircleFilledIcon className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <div className="group relative">
                                                                <XCircleIcon className="w-5 h-5 text-red-500 cursor-help" />
                                                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                                                                    <div className="bg-red-600 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                                                        {row.errors.map((err, i) => (
                                                                            <div key={i}>• {err}</div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.originalData.customer || ''}
                                                            onChange={(e) => updateRowData(index, 'customer', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.originalData.customerPhone || ''}
                                                            onChange={(e) => updateRowData(index, 'customerPhone', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={row.originalData.productName || ''}
                                                            onChange={(e) => updateRowData(index, 'productName', e.target.value)}
                                                            className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={row.originalData.productPrice || ''}
                                                            onChange={(e) => updateRowData(index, 'productPrice', e.target.value)}
                                                            className="w-24 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={row.originalData.quantity || '1'}
                                                            onChange={(e) => updateRowData(index, 'quantity', e.target.value)}
                                                            className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">
                                                        Rp {((row.data.totalPrice || 0)).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() => removeRow(index)}
                                                            className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title="Hapus baris"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Result */}
                    {step === 'result' && (
                        <div className="text-center py-10">
                            {saveResult.success > 0 ? (
                                <CheckCircleFilledIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            ) : (
                                <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            )}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Import {saveResult.success > 0 ? 'Berhasil' : 'Gagal'}
                            </h3>
                            <div className="flex items-center justify-center gap-6 mt-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">{saveResult.success}</div>
                                    <div className="text-sm text-slate-500">Berhasil</div>
                                </div>
                                {saveResult.failed > 0 && (
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-600">{saveResult.failed}</div>
                                        <div className="text-sm text-slate-500">Gagal</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        {file && step === 'preview' && (
                            <span className="text-sm text-slate-500">
                                File: {file.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {step === 'upload' && (
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                        )}
                        {step === 'preview' && (
                            <>
                                <button
                                    onClick={() => { resetState(); }}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Upload Ulang
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={validCount === 0 || isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSaving ? (
                                        <>
                                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            Simpan {validCount} Pesanan
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                        {step === 'result' && (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 font-semibold shadow-md transition-all"
                            >
                                Selesai
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportOrdersModal;
