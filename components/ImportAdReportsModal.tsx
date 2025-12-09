import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../firebase';
import type { AdCampaignReport, AdPlatform, CampaignObjective, CampaignStatus, AdFormat, User, Brand } from '../types';
import type { User as FirebaseUser } from '@supabase/supabase-js';
import XIcon from './icons/XIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckCircleFilledIcon from './icons/CheckCircleFilledIcon';
import XCircleIcon from './icons/XCircleIcon';
import TrashIcon from './icons/TrashIcon';

interface ImportedRow {
    rowNumber: number;
    data: Partial<AdCampaignReport>;
    isValid: boolean;
    errors: string[];
    originalData: Record<string, string>;
}

interface ImportAdReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
    users: User[];
    brands: Brand[];
    currentUser: FirebaseUser;
}

const VALID_PLATFORMS: AdPlatform[] = ['Meta', 'Google', 'TikTok', 'Snack'];
const VALID_OBJECTIVES: CampaignObjective[] = ['Konversi', 'Lalu Lintas', 'Brand Awareness', 'Prospek'];
const VALID_STATUSES: CampaignStatus[] = ['Aktif', 'Dijeda', 'Selesai'];
const VALID_FORMATS: AdFormat[] = ['Gambar', 'Video', 'Carousel', 'Lainnya'];
const VALID_GENDERS = ['Semua', 'Pria', 'Wanita'];

const REQUIRED_COLUMNS = [
    'platform',
    'campaignId',
    'campaignName',
    'adDate',
    'amountSpent',
    'impressions',
    'clicks',
    'conversions',
];

const OPTIONAL_COLUMNS = [
    'brandId',
    'brandName',
    'objective',
    'status',
    'budget',
    'reach',
    'roas',
    'cpl',
    'cpc',
    'ctr',
    'cpm',
    'location',
    'ageRange',
    'gender',
    'interests',
    'format',
    'headline',
    'adCopy',
    'cta',
    'landingPageUrl',
    'productId',
    'productName',
    'productPrice',
    'responsibleUserId',
    'responsibleUserName',
];

const ImportAdReportsModal: React.FC<ImportAdReportsModalProps> = ({
    isOpen,
    onClose,
    onImportSuccess,
    users,
    brands,
    currentUser,
}) => {
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: number; failed: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setImportedRows([]);
        setIsProcessing(false);
        setIsSaving(false);
        setSaveResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const parseExcel = (buffer: ArrayBuffer): Record<string, string>[] => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        return jsonData.map(row => {
            const stringRow: Record<string, string> = {};
            Object.keys(row).forEach(key => {
                stringRow[key] = String(row[key] ?? '');
            });
            return stringRow;
        });
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

        // Required fields
        if (!row.platform?.trim()) errors.push('Platform wajib diisi');
        if (!row.campaignId?.trim()) errors.push('ID Kampanye wajib diisi');
        if (!row.campaignName?.trim()) errors.push('Nama Kampanye wajib diisi');
        if (!row.adDate?.trim()) errors.push('Tanggal Iklan wajib diisi');

        // Validate platform
        const platform = row.platform?.trim() as AdPlatform;
        if (platform && !VALID_PLATFORMS.includes(platform)) {
            errors.push(`Platform tidak valid. Gunakan: ${VALID_PLATFORMS.join(', ')}`);
        }

        // Validate objective
        const objective = row.objective?.trim() as CampaignObjective;
        if (objective && !VALID_OBJECTIVES.includes(objective)) {
            errors.push(`Objective tidak valid. Gunakan: ${VALID_OBJECTIVES.join(', ')}`);
        }

        // Validate status
        const status = row.status?.trim() as CampaignStatus;
        if (status && !VALID_STATUSES.includes(status)) {
            errors.push(`Status tidak valid. Gunakan: ${VALID_STATUSES.join(', ')}`);
        }

        // Validate format
        const format = row.format?.trim() as AdFormat;
        if (format && !VALID_FORMATS.includes(format)) {
            errors.push(`Format tidak valid. Gunakan: ${VALID_FORMATS.join(', ')}`);
        }

        // Validate gender
        const gender = row.gender?.trim();
        if (gender && !VALID_GENDERS.includes(gender)) {
            errors.push(`Gender tidak valid. Gunakan: ${VALID_GENDERS.join(', ')}`);
        }

        // Validate numeric fields
        const amountSpent = parseFloat(row.amountSpent || '0');
        if (isNaN(amountSpent) || amountSpent < 0) errors.push('Amount Spent harus angka positif');

        const impressions = parseInt(row.impressions || '0');
        if (isNaN(impressions) || impressions < 0) errors.push('Impressions harus angka positif');

        const clicks = parseInt(row.clicks || '0');
        if (isNaN(clicks) || clicks < 0) errors.push('Clicks harus angka positif');

        const conversions = parseInt(row.conversions || '0');
        if (isNaN(conversions) || conversions < 0) errors.push('Conversions harus angka positif');

        // Build data object
        const data: Partial<AdCampaignReport> = {
            platform: (platform || 'Meta') as AdPlatform,
            campaignId: row.campaignId?.trim() || '',
            campaignName: row.campaignName?.trim() || '',
            adDate: row.adDate?.trim() || new Date().toISOString().split('T')[0],
            objective: (objective || 'Konversi') as CampaignObjective,
            status: (status || 'Aktif') as CampaignStatus,
            budget: parseFloat(row.budget || '0') || 0,
            brandId: row.brandId?.trim() || undefined,
            brandName: row.brandName?.trim() || undefined,
            // Performance metrics
            amountSpent: amountSpent || 0,
            impressions: impressions || 0,
            reach: parseInt(row.reach || '0') || 0,
            clicks: clicks || 0,
            conversions: conversions || 0,
            roas: parseFloat(row.roas || '0') || 0,
            cpl: parseFloat(row.cpl || '0') || 0,
            cpc: parseFloat(row.cpc || '0') || 0,
            ctr: parseFloat(row.ctr || '0') || 0,
            cpm: parseFloat(row.cpm || '0') || 0,
            // Audience
            location: row.location?.trim() || '',
            ageRange: row.ageRange?.trim() || '',
            gender: (gender || 'Semua') as 'Semua' | 'Pria' | 'Wanita',
            interests: row.interests?.trim() || '',
            // Creative
            format: (format || 'Gambar') as AdFormat,
            headline: row.headline?.trim() || '',
            adCopy: row.adCopy?.trim() || '',
            cta: row.cta?.trim() || '',
            landingPageUrl: row.landingPageUrl?.trim() || '',
            productId: row.productId?.trim() || '',
            productName: row.productName?.trim() || '',
            productPrice: parseFloat(row.productPrice || '0') || 0,
            // User assignment
            responsibleUserId: row.responsibleUserId?.trim() || currentUser.id,
            responsibleUserName: row.responsibleUserName?.trim() || currentUser.user_metadata?.full_name || currentUser.email || '',
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
            const fileName = selectedFile.name.toLowerCase();
            const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

            let rows: Record<string, string>[];

            if (isExcel) {
                const buffer = await selectedFile.arrayBuffer();
                rows = parseExcel(buffer);
            } else {
                const text = await selectedFile.text();
                rows = parseCSV(text);
            }

            if (rows.length === 0) {
                alert('File kosong atau format tidak valid');
                setIsProcessing(false);
                return;
            }

            const validatedRows = rows.map((row, index) => validateRow(row, index + 2));
            setImportedRows(validatedRows);
            setStep('preview');
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Gagal membaca file. Pastikan format file valid (CSV, XLSX, atau XLS).');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        const fileName = droppedFile?.name.toLowerCase() || '';
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

        if (droppedFile && isValidFile) {
            const input = fileInputRef.current;
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                input.files = dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            alert('Hanya file CSV, XLSX, atau XLS yang didukung');
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
                const reportData = {
                    platform: row.data.platform,
                    "campaignId": row.data.campaignId,
                    "campaignName": row.data.campaignName,
                    "adDate": row.data.adDate,
                    objective: row.data.objective,
                    status: row.data.status,
                    budget: row.data.budget || 0,
                    "brandId": row.data.brandId || null,
                    "brandName": row.data.brandName || null,
                    "amountSpent": row.data.amountSpent || 0,
                    impressions: row.data.impressions || 0,
                    reach: row.data.reach || 0,
                    clicks: row.data.clicks || 0,
                    conversions: row.data.conversions || 0,
                    roas: row.data.roas || 0,
                    cpl: row.data.cpl || 0,
                    cpc: row.data.cpc || 0,
                    ctr: row.data.ctr || 0,
                    cpm: row.data.cpm || 0,
                    location: row.data.location || null,
                    "ageRange": row.data.ageRange || null,
                    gender: row.data.gender || 'Semua',
                    interests: row.data.interests || null,
                    format: row.data.format || 'Gambar',
                    headline: row.data.headline || null,
                    "adCopy": row.data.adCopy || null,
                    cta: row.data.cta || null,
                    "landingPageUrl": row.data.landingPageUrl || null,
                    "productId": row.data.productId || null,
                    "productName": row.data.productName || null,
                    "productPrice": row.data.productPrice || 0,
                    "responsibleUserId": row.data.responsibleUserId,
                    "responsibleUserName": row.data.responsibleUserName,
                    // Compatibility fields
                    "startDate": row.data.adDate,
                    "endDate": row.data.adDate,
                };

                const { error } = await supabase.from('ad_reports').insert(reportData);

                if (error) {
                    console.error('Error inserting ad report:', error);
                    failedCount++;
                } else {
                    successCount++;
                }
            } catch (error) {
                console.error('Error saving ad report:', error);
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
            'Meta',                  // platform
            'CAMP-001',             // campaignId
            'Kampanye Produk A',    // campaignName
            '2025-01-01',           // adDate
            '500000',               // amountSpent
            '10000',                // impressions
            '250',                  // clicks
            '15',                   // conversions
            '',                     // brandId
            'Brand A',              // brandName
            'Konversi',             // objective
            'Aktif',                // status
            '1000000',              // budget
            '8000',                 // reach
            '3.5',                  // roas
            '33333',                // cpl
            '2000',                 // cpc
            '2.5',                  // ctr
            '50000',                // cpm
            'Indonesia',            // location
            '18-45',                // ageRange
            'Semua',                // gender
            'Fashion, Beauty',      // interests
            'Gambar',               // format
            'Promo Spesial',        // headline
            'Dapatkan diskon...',   // adCopy
            'Beli Sekarang',        // cta
            'https://example.com',  // landingPageUrl
            '',                     // productId
            'Produk A',             // productName
            '150000',               // productPrice
            '',                     // responsibleUserId
            'John Doe',             // responsibleUserName
        ];

        const worksheetData = [headers, sampleRow];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        worksheet['!cols'] = headers.map(() => ({ wch: 18 }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        XLSX.writeFile(workbook, 'template_import_laporan_iklan.xlsx');
    };

    const validCount = importedRows.filter(r => r.isValid).length;
    const invalidCount = importedRows.filter(r => !r.isValid).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import Laporan Iklan</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {step === 'upload' && 'Upload file Excel atau CSV untuk import laporan iklan'}
                            {step === 'preview' && 'Preview dan koreksi data sebelum menyimpan'}
                            {step === 'result' && 'Hasil import laporan iklan'}
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
                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center hover:border-purple-500 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isProcessing ? (
                                    <div className="flex flex-col items-center">
                                        <SpinnerIcon className="w-12 h-12 text-purple-500 animate-spin mb-3" />
                                        <p className="text-slate-600 dark:text-slate-400">Memproses file...</p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                                            Drag & drop file Excel atau CSV di sini
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">atau klik untuk memilih file (.xlsx, .xls, .csv)</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Template Excel</p>
                                    <p className="text-xs text-slate-500">Download template untuk format yang benar</p>
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors text-sm font-medium"
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

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Platform yang didukung:</p>
                                <div className="flex flex-wrap gap-2">
                                    {VALID_PLATFORMS.map(p => (
                                        <span key={p} className="px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                            {p}
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
                                <span className="text-sm text-slate-500">dari {importedRows.length} baris</span>
                            </div>

                            {/* Preview Table */}
                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 w-10">#</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 w-16">Status</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[100px]">Platform</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[120px]">Campaign ID</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[150px]">Campaign Name</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[100px]">Tanggal</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[100px]">Spent</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[80px]">Impr.</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[80px]">Clicks</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 min-w-[80px]">Conv.</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300 w-20">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {importedRows.map((row, index) => (
                                            <tr key={index} className={`${row.isValid ? 'bg-white dark:bg-slate-800' : 'bg-red-50 dark:bg-red-900/10'}`}>
                                                <td className="px-3 py-2 text-slate-500">{row.rowNumber}</td>
                                                <td className="px-3 py-2">
                                                    {row.isValid ? (
                                                        <CheckCircleFilledIcon className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <div className="group relative">
                                                            <XCircleIcon className="w-5 h-5 text-red-500" />
                                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-xs rounded-lg shadow-lg">
                                                                {row.errors.map((err, i) => <div key={i}>• {err}</div>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={row.originalData.platform || ''}
                                                        onChange={(e) => updateRowData(index, 'platform', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    >
                                                        <option value="">Pilih</option>
                                                        {VALID_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.originalData.campaignId || ''}
                                                        onChange={(e) => updateRowData(index, 'campaignId', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={row.originalData.campaignName || ''}
                                                        onChange={(e) => updateRowData(index, 'campaignName', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="date"
                                                        value={row.originalData.adDate || ''}
                                                        onChange={(e) => updateRowData(index, 'adDate', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.originalData.amountSpent || ''}
                                                        onChange={(e) => updateRowData(index, 'amountSpent', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.originalData.impressions || ''}
                                                        onChange={(e) => updateRowData(index, 'impressions', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.originalData.clicks || ''}
                                                        onChange={(e) => updateRowData(index, 'clicks', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={row.originalData.conversions || ''}
                                                        onChange={(e) => updateRowData(index, 'conversions', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        onClick={() => removeRow(index)}
                                                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Result */}
                    {step === 'result' && saveResult && (
                        <div className="text-center py-10">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${saveResult.success > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                {saveResult.success > 0 ? (
                                    <CheckCircleFilledIcon className="w-8 h-8 text-green-500" />
                                ) : (
                                    <XCircleIcon className="w-8 h-8 text-red-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Import {saveResult.success > 0 ? 'Berhasil' : 'Gagal'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                {saveResult.success} laporan berhasil diimport
                                {saveResult.failed > 0 && `, ${saveResult.failed} gagal`}
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Selesai
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'preview' && (
                    <div className="flex items-center justify-between p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <button
                            onClick={resetState}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || validCount === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                            {isSaving ? 'Menyimpan...' : `Import ${validCount} Laporan`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportAdReportsModal;
