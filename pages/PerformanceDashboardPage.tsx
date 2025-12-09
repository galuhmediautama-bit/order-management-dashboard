import React, { useEffect, useMemo, useState } from 'react';
import performanceMonitor, { type PerformanceMetrics } from '../utils/performanceMonitor';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import DashboardIcon from '../components/icons/DashboardIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import ClockIcon from '../components/icons/ClockIcon';
import { supabase } from '../firebase';

interface MetricsSummary {
    memorySamples: number;
    averageMemoryPercent: number;
    requestCount: number;
    totalBytes: number;
    averageLatency: number;
}

interface ServerMetrics {
    cpu: number;
    memory: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        percentage: number;
    };
    bandwidth: {
        inbound: number;
        outbound: number;
    };
    timestamp: string;
    dropletId: string;
    dropletName: string;
}

interface Droplet {
    id: string;
    name: string;
    status: string;
    memory: number;
    vcpus: number;
    disk: number;
    region: string;
    ip: string;
}

const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatMs = (ms: number) => `${ms.toFixed(0)} ms`;

const PerformanceDashboardPage: React.FC = () => {
    const [summary, setSummary] = useState<MetricsSummary>(() => performanceMonitor.getSummary());
    const [recentMetrics, setRecentMetrics] = useState<PerformanceMetrics[]>(() => performanceMonitor.getMetrics(20));
    const [loading, setLoading] = useState(false);
    
    // Server metrics state
    const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
    const [serverLoading, setServerLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [droplets, setDroplets] = useState<Droplet[]>([]);
    const [selectedDroplet, setSelectedDroplet] = useState<string>('');

    // Fetch available droplets
    const fetchDroplets = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('swift-processor', {
                body: { action: 'list-droplets' }
            });
            if (error) throw error;
            if (data?.droplets) {
                setDroplets(data.droplets);
                if (data.droplets.length > 0 && !selectedDroplet) {
                    setSelectedDroplet(data.droplets[0].id);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch droplets:', err);
        }
    };

    // Fetch server metrics from DO
    const fetchServerMetrics = async (dropletId?: string) => {
        if (!dropletId && !selectedDroplet) return;
        
        setServerLoading(true);
        setServerError(null);
        
        try {
            const { data, error } = await supabase.functions.invoke('swift-processor', {
                body: { droplet_id: dropletId || selectedDroplet }
            });
            
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Unknown error');
            
            setServerMetrics(data.metrics);
        } catch (err: any) {
            setServerError(err.message || 'Gagal mengambil metrik server');
            console.error('Server metrics error:', err);
        } finally {
            setServerLoading(false);
        }
    };

    useEffect(() => {
        // Ensure monitor running
        performanceMonitor.start?.();
        setLoading(true);
        const interval = setInterval(() => {
            setSummary(performanceMonitor.getSummary());
            setRecentMetrics(performanceMonitor.getMetrics(20));
            setLoading(false);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Fetch droplets on mount
    useEffect(() => {
        fetchDroplets();
    }, []);

    // Fetch server metrics when droplet selected
    useEffect(() => {
        if (selectedDroplet) {
            fetchServerMetrics(selectedDroplet);
            // Refresh every 60 seconds
            const interval = setInterval(() => fetchServerMetrics(selectedDroplet), 60000);
            return () => clearInterval(interval);
        }
    }, [selectedDroplet]);

    const latestMemory = useMemo(() => {
        const memEntry = recentMetrics.find(m => m.memory);
        return memEntry?.memory;
    }, [recentMetrics]);

    const cards = [
        {
            title: 'Rata-rata Memory',
            value: `${summary.averageMemoryPercent.toFixed(1)}%`,
            helper: `${summary.memorySamples} sampel`,
            icon: DashboardIcon,
            bg: 'from-indigo-500 to-indigo-600'
        },
        {
            title: 'Total Request',
            value: summary.requestCount.toString(),
            helper: formatBytes(summary.totalBytes),
            icon: DownloadIcon,
            bg: 'from-emerald-500 to-emerald-600'
        },
        {
            title: 'Latency Rata-rata',
            value: formatMs(summary.averageLatency),
            helper: 'rata-rata 100 request terakhir',
            icon: ClockIcon,
            bg: 'from-amber-500 to-orange-600'
        },
        {
            title: 'Memory Terakhir',
            value: latestMemory ? `${latestMemory.percentage.toFixed(1)}%` : 'N/A',
            helper: latestMemory ? `${(latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(1)} / ${(latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB` : 'Belum ada sampel',
            icon: TrendingUpIcon,
            bg: 'from-slate-600 to-slate-700'
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Monitoring Performa</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pantau server DigitalOcean dan performa aplikasi secara real-time.</p>
                </div>
            </div>

            {/* Server Metrics Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        Server DigitalOcean
                    </h2>
                    <div className="flex items-center gap-3">
                        {droplets.length > 1 && (
                            <select 
                                value={selectedDroplet}
                                onChange={(e) => setSelectedDroplet(e.target.value)}
                                className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-slate-700 dark:text-slate-200"
                            >
                                {droplets.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.region})</option>
                                ))}
                            </select>
                        )}
                        <button
                            onClick={() => fetchServerMetrics()}
                            disabled={serverLoading || !selectedDroplet}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                        >
                            {serverLoading ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : null}
                            Refresh
                        </button>
                    </div>
                </div>

                {serverError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                        {serverError}
                    </div>
                )}

                {!selectedDroplet && !serverLoading && (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>Tidak ada droplet ditemukan. Pastikan DO_API_TOKEN sudah dikonfigurasi di Supabase Edge Functions.</p>
                    </div>
                )}

                {serverMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* CPU */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">CPU Usage</p>
                                    <div className="text-2xl font-bold">{serverMetrics.cpu.toFixed(1)}%</div>
                                    <p className="text-xs text-white/70 mt-1">{serverMetrics.dropletName}</p>
                                </div>
                                <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                            </div>
                            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(serverMetrics.cpu, 100)}%` }} />
                            </div>
                        </div>

                        {/* Memory */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Memory</p>
                                    <div className="text-2xl font-bold">{serverMetrics.memory.percentage.toFixed(1)}%</div>
                                    <p className="text-xs text-white/70 mt-1">
                                        {(serverMetrics.memory.used / 1024 / 1024 / 1024).toFixed(2)} / {(serverMetrics.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
                                    </p>
                                </div>
                                <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(serverMetrics.memory.percentage, 100)}%` }} />
                            </div>
                        </div>

                        {/* Disk */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Disk</p>
                                    <div className="text-2xl font-bold">{serverMetrics.disk.percentage.toFixed(1)}%</div>
                                    <p className="text-xs text-white/70 mt-1">
                                        {(serverMetrics.disk.used / 1024 / 1024 / 1024).toFixed(1)} / {(serverMetrics.disk.total / 1024 / 1024 / 1024).toFixed(1)} GB
                                    </p>
                                </div>
                                <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${Math.min(serverMetrics.disk.percentage, 100)}%` }} />
                            </div>
                        </div>

                        {/* Bandwidth */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">Bandwidth (1hr)</p>
                                    <div className="text-lg font-bold">
                                        ↓ {(serverMetrics.bandwidth.inbound / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                    <p className="text-xs text-white/70 mt-1">
                                        ↑ {(serverMetrics.bandwidth.outbound / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {serverMetrics && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        Terakhir diperbarui: {new Date(serverMetrics.timestamp).toLocaleString('id-ID')} • Auto-refresh setiap 60 detik
                    </p>
                )}
            </div>

            {/* Client Performance Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <DashboardIcon className="w-5 h-5 text-indigo-500" />
                    Performa Browser Client
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {cards.map((card) => (
                        <div key={card.title} className={`p-4 rounded-xl text-white shadow-lg bg-gradient-to-br ${card.bg}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-white/80">{card.title}</p>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                    <p className="text-xs text-white/70 mt-1">{card.helper}</p>
                                </div>
                                <card.icon className="w-8 h-8 text-white/90" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sampel Terbaru</h2>
                    {loading && <SpinnerIcon className="w-4 h-4 animate-spin text-indigo-500" />}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-3 py-2">Waktu</th>
                                <th className="px-3 py-2">Memory</th>
                                <th className="px-3 py-2">Latency Avg</th>
                                <th className="px-3 py-2">Requests</th>
                                <th className="px-3 py-2">Total Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentMetrics.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-4 text-center text-slate-500">Belum ada data</td>
                                </tr>
                            )}
                            {recentMetrics.map((m) => (
                                <tr key={m.timestamp} className="border-t border-slate-200 dark:border-slate-700">
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{new Date(m.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                                        {m.memory ? `${m.memory.percentage.toFixed(1)}%` : '–'}
                                    </td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{formatMs(summary.averageLatency)}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{summary.requestCount}</td>
                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{formatBytes(summary.totalBytes)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboardPage;
