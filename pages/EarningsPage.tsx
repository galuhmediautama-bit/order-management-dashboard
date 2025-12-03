
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import type { User, Order, Form, CuanRankSettings, RankLevel, AdCampaignReport, UserRole } from '../types';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import PencilIcon from '../components/icons/PencilIcon';
import XIcon from '../components/icons/XIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { capitalizeWords, filterUsersByBrandIntersection, getNormalizedRole } from '../utils';
import DollarSignIcon from '../components/icons/DollarSignIcon';
import TrophyIcon from '../components/icons/TrophyIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import FilterIcon from '../components/icons/FilterIcon';

// --- Component for editing salary settings (Admin only) ---
const SalarySettingsModal: React.FC<{
    user: User;
    onClose: () => void;
    onSave: (userId: string, baseSalary: number) => void;
}> = ({ user, onClose, onSave }) => {
    const [baseSalary, setBaseSalary] = useState(user.baseSalary || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(user.id, baseSalary);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Atur Gaji: {user.name}</h2>
                        <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gaji Pokok (Rp)</label>
                            <input
                                type="number"
                                value={baseSalary}
                                onChange={(e) => setBaseSalary(Number(e.target.value))}
                                className="w-full mt-1 p-2 border rounded-md bg-slate-50 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                            Catatan: Komisi per penjualan kini diatur secara spesifik pada setiap formulir produk.
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-sm font-medium rounded-lg">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
}> = ({ title, value, subtitle, icon: Icon, gradient }) => (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform`}>
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">{value}</span>
        </div>
        <h3 className="text-sm font-medium text-white/90">{title}</h3>
        <p className="text-xs text-white/70 mt-1">{subtitle}</p>
    </div>
);

const RankCard: React.FC<{ rank: string; role: string; metrics: any }> = ({ rank, role, metrics }) => {
    const getRankColor = (r: string) => {
        if (['SSS', 'SS'].includes(r)) return 'from-yellow-400 to-amber-500 shadow-yellow-500/30';
        if (['S+', 'S'].includes(r)) return 'from-orange-400 to-red-500 shadow-orange-500/30';
        if (['A+', 'A'].includes(r)) return 'from-emerald-400 to-green-600 shadow-emerald-500/30';
        if (['B'].includes(r)) return 'from-blue-400 to-indigo-600 shadow-blue-500/30';
        if (['C'].includes(r)) return 'from-cyan-400 to-sky-600 shadow-cyan-500/30';
        if (['D'].includes(r)) return 'from-slate-400 to-gray-600 shadow-slate-500/30';
        if (['E'].includes(r)) return 'from-red-400 to-pink-600 shadow-red-500/30';
        return 'from-slate-400 to-slate-500';
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${getRankColor(rank)} rounded-2xl shadow-lg text-white p-6 md:p-8 mb-8 transition-all duration-300`}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h3 className="text-lg font-medium opacity-90">Peringkat Anda Saat Ini</h3>
                    <div className="text-6xl md:text-7xl font-extrabold mt-2 drop-shadow-md">{rank}</div>
                    <p className="mt-2 font-medium opacity-90">{role}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 flex-grow max-w-2xl w-full border border-white/30">
                    <h4 className="text-sm font-bold uppercase tracking-wider opacity-80 mb-3">Metrik Kinerja Harian (Rata-rata)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {role === 'Customer service' ? (
                            <>
                                <div>
                                    <p className="text-xs opacity-75">Leads Harian</p>
                                    <p className="text-xl font-bold">{metrics.dailyLeads?.toFixed(1) || '0.0'}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">Closing Rate</p>
                                    <p className="text-xl font-bold">{metrics.closingRate?.toFixed(1) || '0.0'}%</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">Total Closing</p>
                                    <p className="text-xl font-bold">{metrics.closings || 0}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <p className="text-xs opacity-75">Leads Harian</p>
                                    <p className="text-xl font-bold">{metrics.dailyLeads?.toFixed(1) || '0.0'}</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">ROAS</p>
                                    <p className="text-xl font-bold">{metrics.roas?.toFixed(2) || '0.00'}x</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-75">Spending Harian</p>
                                    <p className="text-xl font-bold">Rp {(metrics.dailySpending || 0).toLocaleString('id-ID', { notation: 'compact' })}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute -bottom-12 -right-12 opacity-20 rotate-12">
                <TrophyIcon className="w-64 h-64" />
            </div>
        </div>
    );
};

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

const EarningsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [adReports, setAdReports] = useState<AdCampaignReport[]>([]);
    const [rankSettings, setRankSettings] = useState<CuanRankSettings | null>(null);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 29); // Default last 30 days
        return { startDate, endDate };
    });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState<'all' | 'cs' | 'advertiser'>('all');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
                    if (userDoc) {
                        const userData = userDoc as User;
                        const role = getNormalizedRole(userData.role, user.email);
                        setCurrentUser({ id: user.id, ...userData, role });
                    } else {
                         const role = getNormalizedRole(undefined, user.email);
                         setCurrentUser({ id: user.id, role, name: 'Owner', email: user.email || '', status: 'Aktif', lastLogin: '' });
                    }
                }

                // Parallel fetching
                const [usersSnap, ordersSnap, adsSnap, rankSnap] = await Promise.all([
                    supabase.from('users').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('ad_reports').select('*'),
                    supabase.from('settings').select('*').eq('id', 'cuanRank').single()
                ]);

                setUsers((usersSnap.data || []).map(doc => ({ ...doc } as User)));
                
                setOrders((ordersSnap.data || []).map(doc => {
                    const dateString = doc.date; // Supabase returns string
                    return { ...doc, date: dateString } as Order;
                }));

                setAdReports((adsSnap.data || []).map(doc => ({ ...doc } as AdCampaignReport)));

                if (rankSnap.data) {
                    const data = rankSnap.data;
                    // Ensure arrays exist even if document is partial
                    setRankSettings({
                        csRules: data.csRules || [],
                        advertiserRules: data.advertiserRules || []
                    });
                } else {
                    // Defaults if not set
                    setRankSettings({ csRules: [], advertiserRules: [] }); 
                }

            } catch (error) {
                console.error("Error fetching earnings data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateSalary = async (userId: string, baseSalary: number) => {
        try {
            await supabase.from('users').update({ baseSalary }).eq('id', userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, baseSalary } : u));
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating salary:", error);
            alert("Gagal memperbarui gaji.");
        }
    };

    const filteredData = useMemo(() => {
        if (!currentUser) return [];

        // 1. Determine visible users
        const visibleUsers = filterUsersByBrandIntersection(users, currentUser);
        
        // Filter to only include Advertiser and Customer service
        const targetRoles = ['Advertiser', 'Customer service'];
        const relevantUsers = visibleUsers.filter(u => {
            const normRole = getNormalizedRole(u.role);
            return targetRoles.includes(normRole);
        });

        // 2. Date Filtering Helper
        const isWithinDateRange = (dateStr: string) => {
             if (!dateRange.startDate || !dateRange.endDate) return true;
             try {
                const d = new Date(dateStr);
                const start = new Date(dateRange.startDate); start.setHours(0,0,0,0);
                const end = new Date(dateRange.endDate); end.setHours(23,59,59,999);
                return d >= start && d <= end;
             } catch { return false; }
        };

        const daysDifference = dateRange.startDate && dateRange.endDate 
            ? Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))) 
            : 30; // Default divisor if no range

        // 3. Process each user
        return relevantUsers.map(user => {
            const baseSalary = user.baseSalary || 0;
            
            // Normalize Role for Calculation
            const effectiveRole = getNormalizedRole(user.role);

            // -- CS Logic --
            const userOrders = orders.filter(o => o.assignedCsId === user.id && isWithinDateRange(o.date));
            const leadsCount = userOrders.length;
            const closingOrders = userOrders.filter(o => ['Processing', 'Shipped', 'Delivered'].includes(o.status));
            const closingCount = closingOrders.length;
            const revenue = closingOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            
            // Calculate CS metrics
            const dailyLeads = leadsCount / daysDifference;
            const closingRate = leadsCount > 0 ? (closingCount / leadsCount) * 100 : 0;
            
            // Calculate CS Commission (support both new and legacy fields)
            const csCommissionTotal = userOrders
                .filter(o => ['Shipped', 'Delivered'].includes(o.status))
                .reduce((sum, o) => {
                    const csComm = o.csCommission || o.commissionSnapshot || 0;
                    return sum + csComm;
                }, 0);

            // -- Advertiser Logic --
            const userAds = adReports.filter(r => r.responsibleUserId === user.id && isWithinDateRange(r.startDate));
            const adSpend = userAds.reduce((sum, r) => sum + r.amountSpent, 0);
            const adConversions = userAds.reduce((sum, r) => sum + r.conversions, 0); 
            const adRoasWeighted = userAds.reduce((sum, r) => sum + (r.roas * r.amountSpent), 0);
            const adAvgRoas = adSpend > 0 ? adRoasWeighted / adSpend : 0;
            
            const dailyAdLeads = adConversions / daysDifference;
            
            // Calculate Advertiser Commission from orders with brandId matching user's assigned brands
            const userBrandIds = user.assignedBrandIds || [];
            const advOrders = orders.filter(o => 
                userBrandIds.includes(o.brandId || '') && 
                ['Shipped', 'Delivered'].includes(o.status) &&
                isWithinDateRange(o.date)
            );
            const advCommissionTotal = advOrders.reduce((sum, o) => {
                return sum + (o.advCommission || 0);
            }, 0);
            
            // Total commission depends on role
            let commissionTotal = 0;
            if (effectiveRole === 'Customer service') {
                commissionTotal = csCommissionTotal;
            } else if (effectiveRole === 'Advertiser') {
                commissionTotal = advCommissionTotal;
            }
            
            // Determine Rank
            let rank = '-';
            let rankMetrics = {};
            
            const safeCsRules = rankSettings?.csRules || [];
            const safeAdRules = rankSettings?.advertiserRules || [];

            if (effectiveRole === 'Customer service') {
                rank = 'E'; // Default start for CS
                const rankOrder: RankLevel[] = ['SSS', 'SS', 'S+', 'S', 'A+', 'A', 'B', 'C', 'D', 'E'];
                
                for (const rLevel of rankOrder) {
                    const rule = safeCsRules.find(r => r.rank === rLevel);
                    if (rule) {
                        if (dailyLeads >= rule.minLeads && closingRate >= rule.minClosingRate) {
                            rank = rLevel;
                            break; 
                        }
                    }
                }
                rankMetrics = { dailyLeads, closingRate, closings: closingCount };
            } 
            else if (effectiveRole === 'Advertiser') {
                rank = 'E'; // Default start for Advertiser
                const rankOrder: RankLevel[] = ['SSS', 'SS', 'S+', 'S', 'A+', 'A', 'B', 'C', 'D', 'E'];
                
                for (const rLevel of rankOrder) {
                    const rule = safeAdRules.find(r => r.rank === rLevel);
                    if (rule) {
                        // For Advertiser, using minLeads and minRoas as primary criteria
                        if (dailyAdLeads >= rule.minLeads && adAvgRoas >= rule.minRoas) {
                            rank = rLevel;
                            break;
                        }
                    }
                }
                rankMetrics = { dailyLeads: dailyAdLeads, roas: adAvgRoas, dailySpending: adSpend / daysDifference };
            }

            // Normalize Role for display text
            let displayRole: string = user.role;
            if (effectiveRole === 'Customer service') displayRole = 'CS';

            return {
                ...user,
                displayRole,
                ordersCount: closingCount,
                commissionTotal,
                revenue,
                baseSalary,
                totalEarnings: baseSalary + commissionTotal,
                rank,
                rankMetrics
            };
        });
    }, [users, orders, adReports, currentUser, dateRange, rankSettings]);

    const totals = useMemo(() => {
        return filteredData.reduce((acc, curr) => ({
            revenue: acc.revenue + (curr.revenue || 0),
            commission: acc.commission + curr.commissionTotal,
            salary: acc.salary + (curr.baseSalary || 0),
            total: acc.total + curr.totalEarnings
        }), { revenue: 0, commission: 0, salary: 0, total: 0 });
    }, [filteredData]);
    
    const myStats = useMemo(() => {
        if (!currentUser) return null;
        return filteredData.find(u => u.id === currentUser.id);
    }, [filteredData, currentUser]);

    const displayedData = useMemo(() => {
        if (roleFilter === 'all') return filteredData;
        if (roleFilter === 'cs') return filteredData.filter(u => getNormalizedRole(u.role) === 'Customer service');
        if (roleFilter === 'advertiser') return filteredData.filter(u => getNormalizedRole(u.role) === 'Advertiser');
        return filteredData;
    }, [filteredData, roleFilter]);

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const headers = ['Nama', 'Peran', 'Kelas', 'Omzet', 'Gaji Pokok', 'Komisi', 'Total Pendapatan'];
            const rows = displayedData.map(user => [
                user.name,
                user.displayRole,
                user.rank,
                user.revenue,
                user.baseSalary || 0,
                user.commissionTotal,
                user.totalEarnings
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `penghasilan-tim-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10"><SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    }

    const showTeamView = ['Super Admin', 'Admin', 'Keuangan'].includes(currentUser?.role || '');
    const normalizedMyRole = getNormalizedRole(currentUser?.role);
    const showPersonalRank = ['Customer service', 'Advertiser'].includes(normalizedMyRole);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-green-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <BanknotesIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {showTeamView ? 'Penghasilan Tim' : 'Penghasilan Saya'}
                        </h1>
                    </div>
                    <p className="ml-13 text-base text-slate-600 dark:text-slate-400">Monitor gaji, komisi, dan performa tim.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {showTeamView && (
                        <button 
                            onClick={handleExportCSV}
                            disabled={isExporting || displayedData.length === 0}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {isExporting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5" />}
                            <span>Ekspor CSV</span>
                        </button>
                    )}
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
            </div>

            {/* Personal Rank Card (CS/Advertiser) */}
            {showPersonalRank && myStats && (
                <RankCard 
                    rank={myStats.rank} 
                    role={currentUser?.role || ''}
                    metrics={myStats.rankMetrics} 
                />
            )}

            {/* Team Summary Grid (Admin/Keuangan) */}
            {showTeamView && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Omzet Team" 
                        value={`Rp ${(totals.revenue / 1000000).toFixed(1)}M`}
                        subtitle="Revenue periode ini"
                        icon={ShoppingCartIcon} 
                        gradient="from-purple-500 to-purple-600 shadow-purple-500/30"
                    />
                    <StatCard 
                        title="Total Gaji Pokok" 
                        value={`Rp ${(totals.salary / 1000000).toFixed(1)}M`}
                        subtitle="Fixed salary"
                        icon={BanknotesIcon} 
                        gradient="from-blue-500 to-blue-600 shadow-blue-500/30"
                    />
                    <StatCard 
                        title="Total Komisi" 
                        value={`Rp ${(totals.commission / 1000000).toFixed(1)}M`}
                        subtitle="Komisi terjual"
                        icon={TrendingUpIcon} 
                        gradient="from-green-500 to-emerald-600 shadow-green-500/30"
                    />
                    <StatCard 
                        title="Total Pengeluaran" 
                        value={`Rp ${(totals.total / 1000000).toFixed(1)}M`}
                        subtitle="Gaji + Komisi"
                        icon={DollarSignIcon} 
                        gradient="from-indigo-500 to-indigo-600 shadow-indigo-500/30"
                    />
                </div>
            )}

            {/* Role Filter */}
            {showTeamView && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <FilterIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter Peran</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {[
                            { value: 'all', label: 'Semua Tim', count: filteredData.length },
                            { value: 'cs', label: 'Customer Service', count: filteredData.filter(u => getNormalizedRole(u.role) === 'Customer service').length },
                            { value: 'advertiser', label: 'Advertiser', count: filteredData.filter(u => getNormalizedRole(u.role) === 'Advertiser').length }
                        ].map(role => {
                            const isActive = roleFilter === role.value;
                            
                            return (
                                <button
                                    key={role.value}
                                    onClick={() => setRoleFilter(role.value as any)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 border shadow-sm hover:shadow-md ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-transparent text-white shadow-lg shadow-green-500/30 scale-105' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {role.label}
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-green-50 dark:bg-slate-700 text-green-600 dark:text-green-400'
                                    }`}>
                                        {role.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <SpinnerIcon className="w-10 h-10 text-green-600 animate-spin" />
                        </div>
                    ) : displayedData.length === 0 ? (
                        <div className="text-center py-20">
                            <BanknotesIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Tidak ada data penghasilan</p>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Coba ubah filter atau periode tanggal</p>
                        </div>
                    ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Peran</th>
                                {showTeamView && <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Kelas</th>}
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Omzet</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Gaji Pokok</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Komisi</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Total</th>
                                {showTeamView && (
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {displayedData.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar || `https://i.pravatar.cc/150?u=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600" />
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{capitalizeWords(user.name)}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{user.ordersCount || 0} closing</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{user.displayRole}</span>
                                    </td>
                                    {showTeamView && (
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border-2 ${RANK_BADGE_COLORS[user.rank] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                {user.rank}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-semibold text-slate-900 dark:text-white">Rp {user.revenue.toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-slate-700 dark:text-slate-300">Rp {(user.baseSalary || 0).toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-semibold text-green-600 dark:text-green-400">Rp {user.commissionTotal.toLocaleString('id-ID')}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">Rp {user.totalEarnings.toLocaleString('id-ID')}</div>
                                    </td>
                                     {showTeamView && (
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                title="Atur Gaji Pokok"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>

            {editingUser && (
                <SalarySettingsModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={handleUpdateSalary} 
                />
            )}
        </div>
    );
};

export default EarningsPage;
