
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { AdCampaignReport, AdPlatform, CampaignObjective, CampaignStatus, AdFormat, User, Brand } from '../types';
import type { User as FirebaseUser } from '@supabase/supabase-js';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';
import CustomTooltip from '../components/CustomTooltip';
import { supabase } from '../firebase';
import ReportsIcon from '../components/icons/ReportsIcon';
import CursorClickIcon from '../components/icons/CursorClickIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import EyeIcon from '../components/icons/EyeIcon';
import UsersIcon from '../components/icons/UsersIcon';
import DollarSignIcon from '../components/icons/DollarSignIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';


const AdReportModal: React.FC<{ 
    onClose: () => void; 
    onSave: (report: Omit<AdCampaignReport, 'id'>) => void; 
    users: User[];
    brands: Brand[];
    currentUser: FirebaseUser;
}> = ({ onClose, onSave, users, brands, currentUser }) => {
    const [activeTab, setActiveTab] = useState('umum');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const [formData, setFormData] = useState<Partial<Omit<AdCampaignReport, 'id'>>>({
        platform: 'Meta',
        objective: 'Konversi',
        status: 'Aktif',
        gender: 'Semua',
        format: 'Gambar',
        adDate: yesterday.toISOString().split('T')[0],
        brandId: brands.length > 0 ? brands[0].id : '',
        amountSpent: undefined,
        impressions: undefined,
        reach: undefined,
        clicks: undefined,
        conversions: undefined,
        roas: undefined,
        responsibleUserId: currentUser.id,
        responsibleUserName: currentUser.user_metadata?.full_name || currentUser.email || 'Unknown User',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({...prev, [name]: isNumber ? parseFloat(value) || 0 : value}));
    }
    
    const handleResponsibleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);
        setFormData(prev => ({
            ...prev,
            responsibleUserId: userId,
            responsibleUserName: selectedUser?.name || 'Unknown User'
        }));
    }

    const handleSave = () => {
        // Simple validation
        if (formData.campaignId && formData.adDate) {
            onSave(formData as Omit<AdCampaignReport, 'id'>);
        } else {
            alert('ID Kampanye dan Tanggal Iklan harus diisi.');
        }
    }

    const renderTabs = () => (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button type="button" onClick={() => setActiveTab('umum')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'umum' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}`}>Info Umum</button>
                <button type="button" onClick={() => setActiveTab('kreatif')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'kreatif' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}`}>Kreatif</button>
                <button type="button" onClick={() => setActiveTab('landingpage')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'landingpage' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}`}>Landingpage</button>
                <button type="button" onClick={() => setActiveTab('funneling')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'funneling' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100'}`}>Funneling</button>
            </nav>
        </div>
    );

    const renderGeneralInfo = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Platform</label><select name="platform" onChange={handleChange} value={formData.platform} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"><option>Meta</option><option>Google</option><option>TikTok</option><option>Snack</option></select></div>
            <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Brand*</label>
                <select name="brandId" value={formData.brandId} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Penanggung Jawab Iklan</label>
                <select 
                    name="responsibleUserId" 
                    value={formData.responsibleUserId} 
                    onChange={handleResponsibleUserChange} 
                    className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                >
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Tujuan</label><select name="objective" onChange={handleChange} value={formData.objective} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"><option>Konversi</option><option>Interaksi</option><option>Tayangan Video</option><option>Lalu Lintas</option><option>Brand Awareness</option><option>Prospek</option></select></div>
            <div className="md:col-span-2"><label className="text-sm text-gray-700 dark:text-gray-300">ID Kampanye*</label><input type="text" name="campaignId" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" placeholder="Masukkan ID kampanye dari platform iklan" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Status</label><select name="status" onChange={handleChange} value={formData.status} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600"><option>Aktif</option><option>Dijeda</option><option>Selesai</option></select></div>
            <div className="md:col-span-2"><label className="text-sm text-gray-700 dark:text-gray-300">Tanggal Iklan*</label><input type="date" name="adDate" value={formData.adDate} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" /></div>
        </div>
    );
    
    const renderCreativeTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Total Spend</label>
                <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">Rp</span>
                    <input type="number" name="amountSpent" value={formData.amountSpent} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Total biaya terpakai di tanggal tersebut" />
                </div>
            </div>
            <div className="md:col-span-2">
                <label className="text-sm text-gray-700 dark:text-gray-300">Foto/Video</label>
                <select name="creativeMedia" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <option value="">Pilih jenis konten</option>
                    <option value="Foto">Foto</option>
                    <option value="Video">Video</option>
                    <option value="Carousel">Carousel</option>
                    <option value="Slideshow">Slideshow</option>
                </select>
            </div>
            <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">CPM (Cost per 1000 Impressions)</label>
                <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">Rp</span>
                    <input type="number" step="0.01" name="cpm" placeholder="0.00" onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
            </div>
            <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">CTR (Click-Through Rate)</label>
                <div className="relative mt-1">
                    <input type="number" step="0.01" name="ctr" placeholder="0.00" onChange={handleChange} className="w-full pl-3 pr-10 py-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400">%</span>
                </div>
            </div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Reaction</label><input type="number" name="reactions" placeholder="Jumlah reaction" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Komen</label><input type="number" name="comments" placeholder="Jumlah komentar" onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
        </div>
    );

    const renderLandingpage = () => {
        // Calculate OCLV (Outbound Click Landing Page View)
        const linkClicks = formData.linkClicks || 0;
        const lpViews = formData.lpViews || 0;
        const oclv = linkClicks > 0 ? ((lpViews / linkClicks) * 100).toFixed(2) : '0.00';
        
        // Calculate Cost per Landing Page View
        const totalSpend = formData.amountSpent || 0;
        const costPerLPView = lpViews > 0 ? (totalSpend / lpViews).toFixed(2) : '0.00';
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Link Klik</label>
                    <input 
                        type="number" 
                        name="linkClicks" 
                        value={formData.linkClicks || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah link klik"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Landing Page View</label>
                    <input 
                        type="number" 
                        name="lpViews" 
                        value={formData.lpViews || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah LP view"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Scroll 25%</label>
                    <input 
                        type="number" 
                        name="scroll25" 
                        value={formData.scroll25 || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah scroll 25%"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Scroll 50%</label>
                    <input 
                        type="number" 
                        name="scroll50" 
                        value={formData.scroll50 || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah scroll 50%"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Scroll 75%</label>
                    <input 
                        type="number" 
                        name="scroll75" 
                        value={formData.scroll75 || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah scroll 75%"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Scroll 99%</label>
                    <input 
                        type="number" 
                        name="scroll99" 
                        value={formData.scroll99 || ''} 
                        onChange={handleChange} 
                        placeholder="Jumlah scroll 99%"
                        className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">OCLV (Outbound Click LP View)</label>
                    <div className="relative mt-1">
                        <input 
                            type="text" 
                            value={oclv} 
                            readOnly
                            className="w-full pl-3 pr-10 py-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed" 
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">LP View / Link Klik × 100</p>
                </div>
                <div>
                    <label className="text-sm text-gray-700 dark:text-gray-300">Cost per Landing Page View</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">Rp</span>
                        <input 
                            type="text" 
                            value={costPerLPView} 
                            readOnly
                            className="w-full pl-10 pr-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed" 
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Spend / LP View</p>
                </div>
            </div>
        );
    };

    const renderLPStruktur = () => (
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Biaya Terpakai (Rp)</label><input type="number" name="amountSpent" value={formData.amountSpent} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Impresi</label><input type="number" name="impressions" value={formData.impressions} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Jangkauan (Reach)</label><input type="number" name="reach" value={formData.reach} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Klik</label><input type="number" name="clicks" value={formData.clicks} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">Konversi</label><input type="number" name="conversions" value={formData.conversions} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
            <div><label className="text-sm text-gray-700 dark:text-gray-300">ROAS</label><input type="number" step="0.1" name="roas" value={formData.roas} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /></div>
         </div>
    );

    const renderFunneling = () => {
        const totalSpend = formData.amountSpent || 0;
        const thanksPage = formData.thanksPage || 0;
        const costPerResult = thanksPage > 0 ? (totalSpend / thanksPage).toFixed(2) : '0.00';
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-700 dark:text-gray-300">Landingpage</label><input type="number" name="funnelingLandingpage" value={formData.funnelingLandingpage || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Jumlah landingpage" /></div>
                <div><label className="text-sm text-gray-700 dark:text-gray-300">Form Page</label><input type="number" name="formPage" value={formData.formPage || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Jumlah form page" /></div>
                <div><label className="text-sm text-gray-700 dark:text-gray-300">Thanks Page</label><input type="number" name="thanksPage" value={formData.thanksPage || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Jumlah thanks page" /></div>
                <div><label className="text-sm text-gray-700 dark:text-gray-300">Leads</label><input type="number" name="leads" value={formData.leads || ''} onChange={handleChange} className="w-full mt-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Jumlah leads" /></div>
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Cost Per Result</label>
                    <div className="relative mt-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">Rp</span>
                        <input 
                            type="text" 
                            value={costPerResult} 
                            readOnly
                            className="w-full pl-10 pr-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:border-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed" 
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Spend / Thanks Page</p>
                </div>
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Laporan Iklan Baru</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {renderTabs()}
                    <div className="mt-6">
                        {activeTab === 'umum' && renderGeneralInfo()}
                        {activeTab === 'kreatif' && renderCreativeTab()}
                        {activeTab === 'landingpage' && renderLandingpage()}
                        {activeTab === 'funneling' && renderFunneling()}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Batal</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan Laporan</button>
                </div>
            </div>
        </div>
    );
}

const AdReportsPage: React.FC<{ user: FirebaseUser }> = ({ user }) => {
  const [reports, setReports] = useState<AdCampaignReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('Semua');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // Default to last 30 days
    return { startDate, endDate };
  });

  const fetchReports = async () => {
    const { data: reportsData } = await supabase.from('ad_reports').select('*');
    const reportsList = (reportsData || []).map(data => {
        if (
            typeof data.amountSpent !== 'number' ||
            typeof data.conversions !== 'number' ||
            typeof data.roas !== 'number' ||
            typeof data.startDate !== 'string' ||
            typeof data.clicks !== 'number'
        ) {
            return null;
        }
        return { ...data } as AdCampaignReport;
    }).filter(Boolean) as AdCampaignReport[];
    setReports(reportsList);
  };

  useEffect(() => {
      const fetchAllData = async () => {
        setLoading(true);
        await fetchReports();
        const { data: usersData } = await supabase.from('users').select('*');
        setUsers((usersData || []).map(u => ({ ...u }) as User));
        const { data: brandsData } = await supabase.from('brands').select('*');
        setBrands((brandsData || []).map(b => ({ ...b }) as Brand));
        setLoading(false);
      }
      fetchAllData();
  }, []);

  const handleSaveReport = async (report: Omit<AdCampaignReport, 'id'>) => {
      try {
        await supabase.from('ad_reports').insert(report);
        setModalOpen(false);
        fetchReports(); // Refresh data
      } catch (e) {
        console.error("Error adding document: ", e);
      }
  }
  
  const filteredReports = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return reports;
    
    const start = new Date(dateRange.startDate);
    start.setHours(0,0,0,0);
    const end = new Date(dateRange.endDate);
    end.setHours(23,59,59,999);

    return reports.filter(report => {
        try {
            const reportDate = new Date(report.startDate);
            const dateMatch = reportDate >= start && reportDate <= end;
            const platformMatch = selectedPlatform === 'Semua' || report.platform === selectedPlatform;
            const statusMatch = selectedStatus === 'Semua' || report.status === selectedStatus;
            const advertiserMatch = selectedAdvertiser === 'Semua' || report.responsibleUserName === selectedAdvertiser;
            
            return dateMatch && platformMatch && statusMatch && advertiserMatch;
        } catch {
            return false;
        }
    });
  }, [reports, dateRange, selectedPlatform, selectedStatus, selectedAdvertiser]);

  const performanceSummary = useMemo(() => {
    const summary = filteredReports.reduce((acc, report) => {
        acc.totalSpent += report.amountSpent;
        acc.totalConversions += report.conversions;
        acc.totalClicks += report.clicks;
        acc.totalImpressions += report.impressions;
        acc.totalReach += report.reach || 0;
        acc.weightedRoasSum += report.roas * report.amountSpent;
        return acc;
    }, { totalSpent: 0, totalConversions: 0, totalClicks: 0, totalImpressions: 0, totalReach: 0, weightedRoasSum: 0 });

    const costPerPurchase = summary.totalConversions > 0 ? summary.totalSpent / summary.totalConversions : 0;
    const costPerClick = summary.totalClicks > 0 ? summary.totalSpent / summary.totalClicks : 0;
    const ctr = summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0;
    const conversionRate = summary.totalClicks > 0 ? (summary.totalConversions / summary.totalClicks) * 100 : 0;
    const averageRoas = summary.totalSpent > 0 ? summary.weightedRoasSum / summary.totalSpent : 0;

    return { 
        totalSpent: summary.totalSpent, 
        totalOrders: summary.totalConversions,
        totalClicks: summary.totalClicks,
        totalImpressions: summary.totalImpressions,
        totalReach: summary.totalReach,
        costPerPurchase,
        costPerClick,
        ctr,
        conversionRate,
        averageRoas
    };
  }, [filteredReports]);

  const advertiserSummary = useMemo(() => {
    if (!filteredReports.length) return [];

    const summaryMap: { [key: string]: {
        responsibleUserName: string;
        totalAmountSpent: number;
        totalClicks: number;
        totalConversions: number;
        totalRoasWeightedSum: number;
    } } = {};

    filteredReports.forEach(report => {
        const userName = report.responsibleUserName || 'Tidak Ditugaskan';
        if (!summaryMap[userName]) {
            summaryMap[userName] = {
                responsibleUserName: userName,
                totalAmountSpent: 0,
                totalClicks: 0,
                totalConversions: 0,
                totalRoasWeightedSum: 0,
            };
        }
        summaryMap[userName].totalAmountSpent += report.amountSpent;
        summaryMap[userName].totalClicks += report.clicks;
        summaryMap[userName].totalConversions += report.conversions;
        summaryMap[userName].totalRoasWeightedSum += report.roas * report.amountSpent;
    });

    return Object.values(summaryMap).map(summary => {
        const costPerResult = summary.totalClicks > 0 ? summary.totalAmountSpent / summary.totalClicks : 0;
        const costPerPurchase = summary.totalConversions > 0 ? summary.totalAmountSpent / summary.totalConversions : 0;
        const averageRoas = summary.totalAmountSpent > 0 ? summary.totalRoasWeightedSum / summary.totalAmountSpent : 0;

        return {
            ...summary,
            costPerResult,
            costPerPurchase,
            averageRoas,
        };
    });
  }, [filteredReports]);

  const performanceGraphData = useMemo(() => {
    if (!filteredReports.length || !dateRange.startDate || !dateRange.endDate) {
        return [];
    }

    const dailyData: { [key: string]: { name: string; Biaya: number; Konversi: number } } = {};
    const currentDate = new Date(dateRange.startDate);
    const loopEndDate = new Date(dateRange.endDate);

    while (currentDate <= loopEndDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        dailyData[dateString] = {
            name: currentDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            Biaya: 0,
            Konversi: 0,
        };
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    filteredReports.forEach(report => {
        try {
            const dateString = new Date(report.startDate).toISOString().split('T')[0];
            if (dailyData[dateString]) {
                dailyData[dateString].Biaya += report.amountSpent;
                dailyData[dateString].Konversi += report.conversions;
            }
        } catch {}
    });

    return Object.values(dailyData);
  }, [filteredReports, dateRange]);

  const platformBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {};
    filteredReports.forEach(report => {
      breakdown[report.platform] = (breakdown[report.platform] || 0) + report.amountSpent;
    });
    return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await supabase.from('ad_reports').delete().eq('id', reportId);
      fetchReports();
    } catch (e) {
      console.error("Error deleting report:", e);
    }
  };

  const uniqueAdvertisers = useMemo(() => {
    const advertisers = new Set(reports.map(r => r.responsibleUserName));
    return Array.from(advertisers).sort();
  }, [reports]);


  return (
    <div className="space-y-6">
      {isModalOpen && <AdReportModal onClose={() => setModalOpen(false)} onSave={handleSaveReport} users={users} brands={brands} currentUser={user} />}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Laporan Iklan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analisis performa kampanye iklan secara menyeluruh</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
             <DateRangePicker value={dateRange} onChange={setDateRange} />
             <button 
               onClick={() => setModalOpen(true)} 
               className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 whitespace-nowrap"
             >
                + Tambah Laporan
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Platform</label>
            <select 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option>Semua</option>
              <option>Meta</option>
              <option>Google</option>
              <option>TikTok</option>
              <option>Snack</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Status</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option>Semua</option>
              <option>Aktif</option>
              <option>Dijeda</option>
              <option>Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Advertiser</label>
            <select 
              value={selectedAdvertiser} 
              onChange={(e) => setSelectedAdvertiser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option>Semua</option>
              {uniqueAdvertisers.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Biaya Iklan</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    Rp {performanceSummary.totalSpent.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {filteredReports.length} kampanye aktif
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <DollarSignIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Impresi</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {performanceSummary.totalImpressions.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Reach: {performanceSummary.totalReach.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Klik</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {performanceSummary.totalClicks.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    CTR: {performanceSummary.ctr.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <CursorClickIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Konversi</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {performanceSummary.totalOrders.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    CVR: {performanceSummary.conversionRate.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <ShoppingCartIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/10 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUpIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">ROAS (Return on Ad Spend)</p>
              </div>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{performanceSummary.averageRoas.toFixed(2)}x</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Rata-rata efisiensi iklan</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSignIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Cost Per Purchase</p>
              </div>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                Rp {performanceSummary.costPerPurchase.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Biaya per konversi</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CursorClickIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Cost Per Click</p>
              </div>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                Rp {performanceSummary.costPerClick.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Biaya per klik</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Chart - 2/3 width */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <ReportsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tren Kinerja Harian</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceGraphData}>
                  <defs>
                    <linearGradient id="colorBiaya" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKonversi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100, 116, 139, 0.2)" />
                  <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                  <YAxis yAxisId="left" tickFormatter={(value) => `${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 0 }).format(value as number)}`} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: 'rgb(100 116 139)', fontSize: 12 }} />
                  <Area yAxisId="left" type="monotone" dataKey="Biaya" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBiaya)" />
                  <Area yAxisId="right" type="monotone" dataKey="Konversi" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorKonversi)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Breakdown - 1/3 width */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <ReportsIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Breakdown</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={platformBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Advertiser Performance Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rincian Kinerja Advertiser</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Advertiser</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Biaya Iklan</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Klik</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CPR</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Konversi</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CPP</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {advertiserSummary.map((summary, idx) => (
                    <tr key={summary.responsibleUserName} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {summary.responsibleUserName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{summary.responsibleUserName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Advertiser</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Rp {summary.totalAmountSpent.toLocaleString('id-ID', { notation: 'compact', maximumFractionDigits: 1 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-700 dark:text-slate-300">
                          {summary.totalClicks.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-700 dark:text-slate-300">
                          Rp {summary.costPerResult.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {summary.totalConversions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-700 dark:text-slate-300">
                          Rp {summary.costPerPurchase.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          summary.averageRoas >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          summary.averageRoas >= 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {summary.averageRoas.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                  {advertiserSummary.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="text-slate-400 dark:text-slate-500">
                          <ReportsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Tidak ada data untuk ditampilkan.</p>
                          <p className="text-xs mt-1">Ubah filter atau tambahkan laporan baru</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Details Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ReportsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Kampanye</h2>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredReports.length} kampanye ditemukan
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kampanye</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Platform</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Budget</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Spent</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Impresi</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Klik</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CVR</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">ROAS</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredReports.map((report) => {
                    const conversionRate = report.clicks > 0 ? (report.conversions / report.clicks) * 100 : 0;
                    const budgetUsage = report.budget ? (report.amountSpent / report.budget) * 100 : 0;
                    
                    return (
                      <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{report.campaignName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{report.responsibleUserName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            report.platform === 'Meta' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            report.platform === 'Google' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            report.platform === 'TikTok' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {report.platform}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            report.status === 'Aktif' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            report.status === 'Dijeda' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                          Rp {report.budget?.toLocaleString('id-ID', { notation: 'compact' }) || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              Rp {report.amountSpent.toLocaleString('id-ID', { notation: 'compact' })}
                            </p>
                            {report.budget && (
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-1">
                                <div 
                                  className={`h-1 rounded-full ${budgetUsage > 90 ? 'bg-red-500' : budgetUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                          {report.impressions.toLocaleString('id-ID', { notation: 'compact' })}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700 dark:text-slate-300">
                          {report.clicks.toLocaleString('id-ID', { notation: 'compact' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            report.roas >= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            report.roas >= 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {report.roas.toFixed(2)}x
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleDeleteReport(report.id)} 
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-12">
                        <div className="text-slate-400 dark:text-slate-500">
                          <ReportsIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Tidak ada kampanye ditemukan.</p>
                          <p className="text-xs mt-1">Ubah filter atau tambahkan laporan baru</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdReportsPage;
