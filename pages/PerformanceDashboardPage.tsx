import React, { useEffect, useMemo, useState } from 'react';
import performanceMonitor, { type PerformanceMetrics } from '../utils/performanceMonitor';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';
import DashboardIcon from '../components/icons/DashboardIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import ClockIcon from '../components/icons/ClockIcon';

interface MetricsSummary {
    memorySamples: number;
    averageMemoryPercent: number;
    requestCount: number;
    totalBytes: number;
    averageLatency: number;
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pantau memory, request, dan latency aplikasi secara real-time.</p>
                </div>
            </div>

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
