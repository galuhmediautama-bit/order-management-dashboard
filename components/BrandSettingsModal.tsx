import React, { useState, useEffect } from 'react';
import type { BrandSettings, BankAccount, QRISData, Warehouse } from '../types';
import { supabase } from '../firebase';
import { uploadFileAndGetURL } from '../fileUploader';
import { ensureBrandSettings, getBrandSettingsErrorMessage } from '../utils/brandSettingsInit';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import CheckIcon from './icons/CheckIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useToast } from '../contexts/ToastContext';

interface BrandSettingsModalProps {
    brandId: string;
    brandName: string;
    onClose: () => void;
}

const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({ brandId, brandName, onClose }) => {
    const [settings, setSettings] = useState<BrandSettings>({
        brandId,
        bankAccounts: [],
        qrisPayments: null,
        warehouses: [],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'bank' | 'qris' | 'warehouse'>('bank');
    const [showAddForm, setShowAddForm] = useState<'bank' | 'qris' | 'warehouse' | null>(null);
    const { showToast } = useToast();

    // Form states for adding new items - preserved per tab
    const [newBank, setNewBank] = useState({ bankName: '', accountHolder: '', accountNumber: '' });
    const [newQRIS, setNewQRIS] = useState({ displayName: '', qrisFile: null as File | null });
    const [newWarehouse, setNewWarehouse] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        city: '',
        province: '',
        postalCode: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('brand_settings')
                .select('*')
                .eq('brandId', brandId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
                const errorMsg = getBrandSettingsErrorMessage(error);
                showToast(`Gagal memuat pengaturan: ${errorMsg}`, 'warning');
                return;
            }

            // If no record exists (PGRST116), that's fine - we'll create it on save
            if (error && error.code === 'PGRST116') {
                console.log('No existing settings found, will create on first save');
                return;
            }

            if (data) {
                console.log('Loaded brand settings:', data);
                setSettings({
                    brandId,
                    bankAccounts: data.bankAccounts || [],
                    qrisPayments: data.qrisPayments || null,
                    warehouses: data.warehouses || [],
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Gagal memuat pengaturan brand', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            console.log('saveSettings: Starting for brandId:', brandId);

            // Ensure brand has settings record first
            console.log('saveSettings: Checking/creating settings record...');
            const hasSettings = await ensureBrandSettings(brandId);
            
            if (!hasSettings) {
                console.error('saveSettings: Failed to ensure brand settings');
                showToast('Gagal menyiapkan pengaturan brand. Cek console untuk detail error.', 'error');
                setSaving(false);
                return;
            }

            console.log('saveSettings: Settings ready, now saving data...');

            const payload = {
                brandId,
                bankAccounts: settings.bankAccounts,
                qrisPayments: settings.qrisPayments,
                warehouses: settings.warehouses,
                updatedAt: new Date().toISOString(),
            };

            console.log('saveSettings: Payload:', payload);

            // First, find existing record by brandId
            const { data: existing, error: findError } = await supabase
                .from('brand_settings')
                .select('id')
                .eq('brandId', brandId)
                .single();

            let result;
            if (existing) {
                // Update existing record
                console.log('saveSettings: Updating existing record:', existing.id);
                result = await supabase
                    .from('brand_settings')
                    .update({
                        brandId,
                        bankAccounts: settings.bankAccounts,
                        qrisPayments: settings.qrisPayments,
                        warehouses: settings.warehouses,
                        updatedAt: new Date().toISOString(),
                    })
                    .eq('id', existing.id)
                    .select();
            } else {
                // Insert new record with full data
                console.log('saveSettings: Inserting new record');
                result = await supabase
                    .from('brand_settings')
                    .insert({
                        brandId,
                        bankAccounts: settings.bankAccounts,
                        qrisPayments: settings.qrisPayments,
                        warehouses: settings.warehouses,
                    })
                    .select();
            }

            const { data, error } = result;

            console.log('saveSettings: Response:', { data, error });

            if (error) {
                console.error('saveSettings: Error from upsert:', error);
                throw error;
            }

            console.log('saveSettings: Success!');
            showToast('Pengaturan brand berhasil disimpan', 'success');
        } catch (error: any) {
            console.error('saveSettings: Caught exception:', error);
            const errorMsg = getBrandSettingsErrorMessage(error);
            showToast(`Gagal menyimpan pengaturan: ${errorMsg}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Bank Account Functions
    const addBankAccount = () => {
        if (!newBank.bankName || !newBank.accountNumber) {
            showToast('Nama bank dan nomor rekening harus diisi', 'error');
            return;
        }

        const account: BankAccount = {
            id: Date.now().toString(),
            ...newBank,
            isDefault: settings.bankAccounts.length === 0,
        };

        setSettings(prev => ({
            ...prev,
            bankAccounts: [...prev.bankAccounts, account],
        }));

        setNewBank({ bankName: '', accountHolder: '', accountNumber: '' });
        setShowAddForm(null);
        showToast('Rekening berhasil ditambahkan', 'success');
    };

    const removeBankAccount = (id: string) => {
        setSettings(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter(acc => acc.id !== id),
        }));
        showToast('Rekening berhasil dihapus', 'success');
    };

    const setDefaultBank = (id: string) => {
        setSettings(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.map(acc => ({
                ...acc,
                isDefault: acc.id === id,
            })),
        }));
    };

    // QRIS Functions
    const addQRIS = async (file?: File | null) => {
        const selectedFile = file || newQRIS.qrisFile;
        if (!selectedFile) {
            showToast('Pilih file QRIS terlebih dahulu', 'error');
            return;
        }

        try {
            const qrisUrl = await uploadFileAndGetURL(selectedFile);
            const qris: QRISData = {
                id: Date.now().toString(),
                displayName: 'QRIS',
                qrisCode: qrisUrl,
            };

            setSettings(prev => ({
                ...prev,
                qrisPayments: qris,
            }));

            setNewQRIS({ displayName: '', qrisFile: null });
            showToast('QRIS berhasil diupload', 'success');
        } catch (error) {
            console.error('Error uploading QRIS:', error);
            showToast('Gagal mengunggah QRIS', 'error');
        }
    };

    const removeQRIS = () => {
        setSettings(prev => ({
            ...prev,
            qrisPayments: null,
        }));
        showToast('QRIS berhasil dihapus', 'success');
    };

    // Warehouse Functions
    const addWarehouse = () => {
        if (!newWarehouse.name || !newWarehouse.address) {
            showToast('Nama dan alamat gudang harus diisi', 'error');
            return;
        }

        const warehouse: Warehouse = {
            id: Date.now().toString(),
            ...newWarehouse,
            isDefault: settings.warehouses.length === 0,
        };

        setSettings(prev => ({
            ...prev,
            warehouses: [...prev.warehouses, warehouse],
        }));

        setNewWarehouse({
            name: '',
            address: '',
            phone: '',
            email: '',
            city: '',
            province: '',
            postalCode: '',
        });
        setShowAddForm(null);
        showToast('Gudang berhasil ditambahkan', 'success');
    };

    const removeWarehouse = (id: string) => {
        setSettings(prev => ({
            ...prev,
            warehouses: prev.warehouses.filter(w => w.id !== id),
        }));
        showToast('Gudang berhasil dihapus', 'success');
    };

    const setDefaultWarehouse = (id: string) => {
        setSettings(prev => ({
            ...prev,
            warehouses: prev.warehouses.map(w => ({
                ...w,
                isDefault: w.id === id,
            })),
        }));
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 sticky top-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Brand</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{brandName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <XIcon className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700 px-6 flex gap-4">
                    <button
                        onClick={() => setActiveTab('bank')}
                        className={`py-4 px-4 font-semibold border-b-2 transition-colors ${
                            activeTab === 'bank'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        🏦 Rekening Bank
                    </button>
                    <button
                        onClick={() => setActiveTab('qris')}
                        className={`py-4 px-4 font-semibold border-b-2 transition-colors ${
                            activeTab === 'qris'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        📱 QRIS
                    </button>
                    <button
                        onClick={() => setActiveTab('warehouse')}
                        className={`py-4 px-4 font-semibold border-b-2 transition-colors ${
                            activeTab === 'warehouse'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        📦 Gudang
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Bank Accounts Tab */}
                    {activeTab === 'bank' && (
                        <div className="space-y-4">
                            {settings.bankAccounts.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>Belum ada rekening bank</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settings.bankAccounts.map(account => (
                                        <div key={account.id} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">{account.bankName}</h3>
                                                        {account.isDefault && (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                                                Utama
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                        Atas nama: {account.accountHolder}
                                                    </p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        Nomor: {account.accountNumber}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!account.isDefault && (
                                                        <button
                                                            onClick={() => setDefaultBank(account.id)}
                                                            className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                                                        >
                                                            Jadikan Utama
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeBankAccount(account.id)}
                                                        className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showAddForm !== 'bank' ? (
                                <button
                                    onClick={() => setShowAddForm('bank')}
                                    className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Tambah Rekening
                                </button>
                            ) : (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg space-y-3 border border-indigo-200 dark:border-indigo-800">
                                    <input
                                        type="text"
                                        placeholder="Nama Bank"
                                        value={newBank.bankName}
                                        onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Atas Nama"
                                        value={newBank.accountHolder}
                                        onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Nomor Rekening"
                                        value={newBank.accountNumber}
                                        onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={addBankAccount}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Simpan
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(null);
                                                setNewBank({ bankName: '', accountHolder: '', accountNumber: '' });
                                            }}
                                            className="flex-1 py-2 bg-slate-300 dark:bg-slate-700 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QRIS Tab */}
                    {activeTab === 'qris' && (
                        <div>
                            <label className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setNewQRIS({ displayName: '', qrisFile: file });
                                        await addQRIS(file);
                                    }}
                                    className="hidden"
                                />
                                {settings.qrisPayments ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <img 
                                            src={settings.qrisPayments.qrisCode} 
                                            alt="QRIS"
                                            className="h-40 w-40 object-contain"
                                        />
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Klik untuk ganti</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-4xl">📸</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Klik untuk upload QRIS</p>
                                    </div>
                                )}
                            </label>
                            {settings.qrisPayments && (
                                <button
                                    onClick={() => removeQRIS()}
                                    className="mt-3 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    Hapus QRIS
                                </button>
                            )}
                        </div>
                    )}

                    {/* Warehouse Tab */}
                    {activeTab === 'warehouse' && (
                        <div className="space-y-4">
                            {settings.warehouses.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p>Belum ada gudang</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settings.warehouses.map(warehouse => (
                                        <div key={warehouse.id} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">{warehouse.name}</h3>
                                                        {warehouse.isDefault && (
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                                                Utama
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{warehouse.address}</p>
                                                    {warehouse.city && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {warehouse.city}, {warehouse.province} {warehouse.postalCode}
                                                        </p>
                                                    )}
                                                    {warehouse.phone && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">📞 {warehouse.phone}</p>
                                                    )}
                                                    {warehouse.email && (
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">📧 {warehouse.email}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {!warehouse.isDefault && (
                                                        <button
                                                            onClick={() => setDefaultWarehouse(warehouse.id)}
                                                            className="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                                                        >
                                                            Jadikan Utama
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => removeWarehouse(warehouse.id)}
                                                        className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showAddForm !== 'warehouse' ? (
                                <button
                                    onClick={() => setShowAddForm('warehouse')}
                                    className="w-full py-2 px-4 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Tambah Gudang
                                </button>
                            ) : (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg space-y-3 border border-indigo-200 dark:border-indigo-800">
                                    <input
                                        type="text"
                                        placeholder="Nama Gudang"
                                        value={newWarehouse.name}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Alamat Lengkap"
                                        value={newWarehouse.address}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Kota"
                                        value={newWarehouse.city}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Provinsi"
                                        value={newWarehouse.province}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, province: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Kode Pos"
                                        value={newWarehouse.postalCode}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, postalCode: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Nomor Telepon"
                                        value={newWarehouse.phone}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, phone: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (opsional)"
                                        value={newWarehouse.email}
                                        onChange={(e) => setNewWarehouse({ ...newWarehouse, email: e.target.value })}
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={addWarehouse}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Simpan
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddForm(null);
                                                setNewWarehouse({
                                                    name: '',
                                                    address: '',
                                                    phone: '',
                                                    email: '',
                                                    city: '',
                                                    province: '',
                                                    postalCode: '',
                                                });
                                            }}
                                            className="flex-1 py-2 bg-slate-300 dark:bg-slate-700 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                Simpan Pengaturan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BrandSettingsModal;
