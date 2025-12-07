
import React, { useState, useEffect } from 'react';
import { supabase } from '../firebase';
import type { CSRankRule, AdvertiserRankRule, RankLevel, CuanRankSettings } from '../types';
import SpinnerIcon from '../components/icons/SpinnerIcon';

const RANK_LEVELS: RankLevel[] = ['E', 'D', 'C', 'B', 'A', 'A+', 'S', 'S+', 'SS', 'SSS'];
const EST_AVG_PRICE = 150000;
const ADS_PERCENTAGE = 0.25;
const COST_PER_LEAD_EST = EST_AVG_PRICE * ADS_PERCENTAGE; // 37,500

const RANK_BADGE_COLORS: Record<string, string> = {
    'SSS': 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    'SS': 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    'S+': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    'S': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    'A': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    'B': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    'C': 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
    'D': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
    'E': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    '-': 'bg-gray-100 text-gray-400 border-gray-200',
};

const CuanRankPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CS' | 'Advertiser'>('CS');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    
    const [csRules, setCsRules] = useState<CSRankRule[]>([]);
    const [adRules, setAdRules] = useState<AdvertiserRankRule[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from("settings").select('*').eq("id", "cuanRank").single();

                if (data) {
                    // Ensure all ranks exist (merge saved with defaults)
                    const mergedCsRules = RANK_LEVELS.map(rank => {
                        const existing = data.csRules?.find((r: any) => r.rank === rank);
                        return { 
                            rank, 
                            minLeads: existing?.minLeads || 0, 
                            minClosingRate: existing?.minClosingRate || 0,
                            maxDailyLeads: existing?.maxDailyLeads || 0 // New Field
                        };
                    });
                    
                    const mergedAdRules = RANK_LEVELS.map(rank => {
                         const existing = data.advertiserRules?.find((r: any) => r.rank === rank);
                         const minLeads = existing ? existing.minLeads : 0;
                         const minRoas = existing ? existing.minRoas : 0;
                         // Always recalculate spending based on leads to ensure "Auto" consistency
                         const minSpending = minLeads * COST_PER_LEAD_EST;
                         
                         return { rank, minLeads, minRoas, minSpending };
                    });

                    setCsRules(mergedCsRules);
                    setAdRules(mergedAdRules);
                } else {
                    // Init defaults
                    setCsRules(RANK_LEVELS.map(rank => ({ rank, minLeads: 0, minClosingRate: 0, maxDailyLeads: 50 })));
                    setAdRules(RANK_LEVELS.map(rank => ({ rank, minLeads: 0, minRoas: 0, minSpending: 0 })));
                }
            } catch (error) {
                console.error("Error fetching CuanRank settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCsChange = (index: number, field: keyof CSRankRule, value: number) => {
        setCsRules(prev => {
            const newRules = [...prev];
            newRules[index] = { ...newRules[index], [field]: value };
            return newRules;
        });
    };

    const handleAdChange = (index: number, field: keyof AdvertiserRankRule, value: number) => {
        setAdRules(prev => {
            const newRules = [...prev];
            const currentRule = { ...newRules[index], [field]: value };

            // Auto-calculate Spending if Leads change
            if (field === 'minLeads') {
                // Formula: Leads * (Average Price 150k * 25%)
                currentRule.minSpending = value * COST_PER_LEAD_EST;
            }

            newRules[index] = currentRule;
            return newRules;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            // Only save the fields that need to persist (exclude calculated minSpending)
            const persistAdvertiserRules = adRules.map(({ rank, minLeads, minRoas }) => ({
                rank,
                minLeads,
                minRoas
            }));
            
            const settings: CuanRankSettings = {
                csRules,
                advertiserRules: persistAdvertiserRules as AdvertiserRankRule[]
            };
            
            console.log('Saving settings:', settings);
            
            const { data, error } = await supabase.from("settings").upsert({ id: "cuanRank", ...settings }).select();
            
            if (error) {
                console.error("Error saving settings:", error);
                const errorMsg = error.message.includes('permission') || error.message.includes('Policy') 
                    ? 'Anda tidak memiliki izin untuk mengubah pengaturan. Hanya Super Admin atau Admin yang dapat menyimpan CuanRank.'
                    : error.message;
                setSaveError(errorMsg);
                return;
            }
            
            console.log('Saved successfully:', data);
            
            // Verify the save by immediately fetching
            const { data: verifyData } = await supabase.from("settings").select('*').eq("id", "cuanRank").single();
            console.log('Verified saved data:', verifyData);
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            setSaveError(error instanceof Error ? error.message : 'Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-8 shadow-sm border border-amber-100/50 dark:border-amber-800/30">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
                            🏆 Pengaturan CuanRank
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">Atur kriteria peringkat untuk Customer Service dan Advertiser</p>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 font-semibold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 animate-spin" />
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Simpan Perubahan</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-100">✓ Berhasil Disimpan!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">Pengaturan CuanRank telah diperbarui.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {saveError && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <p className="font-semibold text-red-900 dark:text-red-100">❌ Gagal Menyimpan</p>
                                <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-amber-100 dark:border-amber-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rank Levels</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{RANK_LEVELS.length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100 dark:border-blue-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">CS Rules</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{csRules.filter(r => r.minLeads > 0).length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-100 dark:border-purple-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Advertiser Rules</p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{adRules.filter(r => r.minLeads > 0).length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 flex">
                    <button
                        onClick={() => setActiveTab('CS')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'CS' 
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Customer Service
                    </button>
                    <button
                        onClick={() => setActiveTab('Advertiser')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                            activeTab === 'Advertiser' 
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        Advertiser
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'CS' && (
                        <div>
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                    <div>
                                        <p className="font-semibold mb-1">💡 Panduan Pengaturan CS</p>
                                        <ul className="text-sm space-y-1">
                                            <li>• <strong>Leads Harian:</strong> Minimal jumlah leads yang harus dicapai per hari</li>
                                            <li>• <strong>Closing Rate:</strong> Persentase minimal konversi dari leads ke order</li>
                                            <li>• <strong>Max Leads/Hari:</strong> Batas maksimal leads yang bisa diterima (untuk distribusi merata)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-blue-200 dark:border-blue-800">
                                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">Rank</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Syarat Leads Harian</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Syarat Closing Rate (%)</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Max Leads / Hari</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csRules.map((rule, index) => {
                                            return (
                                                <tr key={rule.rank} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`inline-block w-12 py-1.5 rounded-lg font-bold text-sm border-2 ${RANK_BADGE_COLORS[rule.rank] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                            {rule.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={rule.minLeads}
                                                            onChange={(e) => handleCsChange(index, 'minLeads', parseFloat(e.target.value) || 0)}
                                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                value={rule.minClosingRate}
                                                                onChange={(e) => handleCsChange(index, 'minClosingRate', parseFloat(e.target.value) || 0)}
                                                                className="w-full p-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-3 text-gray-500 font-medium">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            value={rule.maxDailyLeads}
                                                            onChange={(e) => handleCsChange(index, 'maxDailyLeads', parseFloat(e.target.value) || 0)}
                                                            className="w-full p-2.5 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 font-medium"
                                                            placeholder="Unlimited"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Advertiser' && (
                        <div>
                            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                    <div>
                                        <p className="font-semibold mb-1">📊 Kalkulasi Otomatis</p>
                                        <p className="text-sm"><strong>Spending Ads</strong> = Leads × (25% × Est. Harga Jual Rp 150.000) = Leads × Rp 37.500</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-purple-200 dark:border-purple-800">
                                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-24">Rank</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Leads Harian</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Target ROAS</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Spending Ads (Auto)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adRules.map((rule, index) => (
                                            <tr key={rule.rank} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-block w-12 py-1.5 rounded-lg font-bold text-sm border-2 ${RANK_BADGE_COLORS[rule.rank] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                        {rule.rank}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        value={rule.minLeads}
                                                        onChange={(e) => handleAdChange(index, 'minLeads', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={rule.minRoas}
                                                        onChange={(e) => handleAdChange(index, 'minRoas', parseFloat(e.target.value) || 0)}
                                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                                                        placeholder="0.0"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="relative">
                                                        <div className="w-full p-2.5 pl-3 border-2 border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 font-mono font-bold text-right">
                                                            {rule.minSpending > 0 ? `Rp ${rule.minSpending.toLocaleString('id-ID')}` : '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CuanRankPage;
