import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../firebase';
import SearchIcon from './icons/SearchIcon';
import XIcon from './icons/XIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface SearchResult {
    id: string;
    type: 'order' | 'customer' | 'form' | 'product' | 'user';
    title: string;
    subtitle: string;
    url: string;
    icon: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard shortcut - ESC to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        const searchResults: SearchResult[] = [];
        const searchTerm = searchQuery.trim().toLowerCase();

        try {
            // Search Orders - use ilike on customer field only (most reliable)
            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('id, customer, "customerPhone", status, product')
                .ilike('customer', `%${searchTerm}%`)
                .limit(5);

            if (!ordersError && orders) {
                orders.forEach(order => {
                    searchResults.push({
                        id: order.id,
                        type: 'order',
                        title: `#${order.id.slice(0, 8)}... - ${order.customer}`,
                        subtitle: `${order.product || 'N/A'} • ${order.status}`,
                        url: `/pesanan?search=${order.id}`,
                        icon: '📦'
                    });
                });
            }

            // Search by phone number if query looks like a number
            if (/^\d+$/.test(searchQuery)) {
                const { data: ordersByPhone } = await supabase
                    .from('orders')
                    .select('id, customer, "customerPhone", status, product')
                    .ilike('customerPhone', `%${searchTerm}%`)
                    .limit(5);

                if (ordersByPhone) {
                    ordersByPhone.forEach(order => {
                        // Avoid duplicates
                        if (!searchResults.find(r => r.id === order.id)) {
                            searchResults.push({
                                id: order.id,
                                type: 'order',
                                title: `#${order.id.slice(0, 8)}... - ${order.customer}`,
                                subtitle: `${order.product || 'N/A'} • ${order.status}`,
                                url: `/pesanan?search=${order.id}`,
                                icon: '📦'
                            });
                        }
                    });
                }
            }

            // Get unique customers from orders already fetched
            if (orders) {
                const uniqueCustomers = new Map();
                orders.forEach(c => {
                    const key = c.customerPhone || c.customer;
                    if (!uniqueCustomers.has(key)) {
                        uniqueCustomers.set(key, c);
                    }
                });

                Array.from(uniqueCustomers.values()).slice(0, 3).forEach((customer: any) => {
                    searchResults.push({
                        id: customer.customerPhone || customer.customer,
                        type: 'customer',
                        title: customer.customer,
                        subtitle: customer.customerPhone || '-',
                        url: `/pelanggan?search=${encodeURIComponent(customer.customer)}`,
                        icon: '👤'
                    });
                });
            }

            // Search Forms - forms table has 'title' column
            try {
                const { data: forms } = await supabase
                    .from('forms')
                    .select('id, title, slug')
                    .ilike('title', `%${searchTerm}%`)
                    .limit(5);

                if (forms && forms.length > 0) {
                    forms.forEach(form => {
                        searchResults.push({
                            id: form.id,
                            type: 'form',
                            title: form.title || 'Untitled Form',
                            subtitle: `/${form.slug || form.id.slice(0, 8)}`,
                            url: `/formulir/edit/${form.id}`,
                            icon: '📝'
                        });
                    });
                }
            } catch (e) {
                console.log('Forms search skipped');
            }

            // Search Products - may not have data, wrap in try-catch
            try {
                const { data: products } = await supabase
                    .from('products')
                    .select('id, name, sku, price')
                    .ilike('name', `%${searchTerm}%`)
                    .limit(5);

                if (products && products.length > 0) {
                    products.forEach(product => {
                        searchResults.push({
                            id: product.id,
                            type: 'product',
                            title: product.name,
                            subtitle: `SKU: ${product.sku || '-'} • Rp ${(product.price || 0).toLocaleString('id-ID')}`,
                            url: `/produk?search=${encodeURIComponent(product.name)}`,
                            icon: '🏷️'
                        });
                    });
                }
            } catch (e) {
                console.log('Products search skipped');
            }

            // Search Users - use 'name' column (not fullName)
            try {
                const { data: users } = await supabase
                    .from('users')
                    .select('id, name, email, role')
                    .ilike('name', `%${searchTerm}%`)
                    .limit(3);

                if (users && users.length > 0) {
                    users.forEach(user => {
                        searchResults.push({
                            id: user.id,
                            type: 'user',
                            title: user.name || user.email,
                            subtitle: `${user.role || 'User'} • ${user.email}`,
                            url: `/pengaturan/pengguna?search=${encodeURIComponent(user.email || '')}`,
                            icon: '👥'
                        });
                    });
                }
            } catch (e) {
                console.log('Users search skipped');
            }

            // Also search users by email if it looks like an email
            if (searchQuery.includes('@') || searchQuery.includes('.')) {
                try {
                    const { data: usersByEmail } = await supabase
                        .from('users')
                        .select('id, name, email, role')
                        .ilike('email', `%${searchTerm}%`)
                        .limit(3);

                    if (usersByEmail && usersByEmail.length > 0) {
                        usersByEmail.forEach(user => {
                            // Avoid duplicates
                            if (!searchResults.find(r => r.type === 'user' && r.id === user.id)) {
                                searchResults.push({
                                    id: user.id,
                                    type: 'user',
                                    title: user.name || user.email,
                                    subtitle: `${user.role || 'User'} • ${user.email}`,
                                    url: `/pengaturan/pengguna?search=${encodeURIComponent(user.email || '')}`,
                                    icon: '👥'
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.log('Users email search skipped');
                }
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        // Save to recent searches
        const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        navigate(result.url);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        }
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 px-0.5 rounded">{part}</mark> : part
        );
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        const labels = {
            order: 'Pesanan',
            customer: 'Pelanggan',
            form: 'Formulir',
            product: 'Produk',
            user: 'Pengguna'
        };
        return labels[type];
    };

    const getTypeColor = (type: SearchResult['type']) => {
        const colors = {
            order: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            customer: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
            form: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
            product: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
            user: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
        };
        return colors[type];
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-start justify-center pt-[15vh] px-4">
                <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-700">
                        <SearchIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Cari pesanan, pelanggan, formulir, produk..."
                            className="flex-1 py-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-lg"
                        />
                        {loading && <SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" />}
                        <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
                                ESC
                            </kbd>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* Recent Searches */}
                        {!query && recentSearches.length > 0 && (
                            <div className="p-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pencarian Terakhir</p>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((search, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(search)}
                                            className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            {search}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions - when no query */}
                        {!query && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Akses Cepat</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { icon: '📦', label: 'Pesanan', url: '/pesanan' },
                                        { icon: '👥', label: 'Pelanggan', url: '/pelanggan' },
                                        { icon: '📝', label: 'Formulir', url: '/formulir' },
                                        { icon: '🏷️', label: 'Produk', url: '/produk' },
                                    ].map((item) => (
                                        <button
                                            key={item.url}
                                            onClick={() => { navigate(item.url); onClose(); }}
                                            className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Results */}
                        {query && results.length > 0 && (
                            <ul className="py-2">
                                {results.map((result, index) => (
                                    <li key={`${result.type}-${result.id}`}>
                                        <button
                                            onClick={() => handleSelect(result)}
                                            className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors ${index === selectedIndex
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                }`}
                                        >
                                            <span className="text-2xl flex-shrink-0">{result.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {highlightMatch(result.title, query)}
                                                    </p>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                                                        {getTypeLabel(result.type)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {highlightMatch(result.subtitle, query)}
                                                </p>
                                            </div>
                                            <span className="text-slate-400 text-xs">↵</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* No Results */}
                        {query && !loading && results.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="text-4xl mb-3">🔍</div>
                                <p className="text-slate-500 dark:text-slate-400">Tidak ada hasil untuk "<span className="font-medium">{query}</span>"</p>
                                <p className="text-sm text-slate-400 mt-1">Coba kata kunci lain atau periksa ejaan</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↓</kbd>
                                navigasi
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↵</kbd>
                                pilih
                            </span>
                        </div>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Ctrl</kbd>
                            <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">/</kbd>
                            buka pencarian
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Use portal to render outside of Header's stacking context
    return createPortal(modalContent, document.body);
};

export default GlobalSearch;
