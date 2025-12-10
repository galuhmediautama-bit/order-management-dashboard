
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../firebase';
import type { AbandonedCart, User, UserRole, Order } from '../types';
import { capitalizeWords, filterDataByBrand, getNormalizedRole } from '../utils';
import { paginateArray, PAGE_SIZES } from '../utils/pagination';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import TrashIcon from '../components/icons/TrashIcon';
import SearchIcon from '../components/icons/SearchIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import FilterIcon from '../components/icons/FilterIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import XIcon from '../components/icons/XIcon';
import { useToast } from '../contexts/ToastContext';
import { useNotificationCount } from '../contexts/NotificationCountContext';
import ConfirmationModal from '../components/ConfirmationModal';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';

const formatWaNumber = (num: string | null | undefined) => {
    if (!num) return '';
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('62')) {
        return cleaned;
    }
    return '62' + cleaned;
};

const AbandonedCartsPage: React.FC = () => {
    const [carts, setCarts] = useState<AbandonedCart[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { showToast } = useToast();
    const { setNewAbandonedCount } = useNotificationCount();
    const [cartSoundEnabled, setCartSoundEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('abandoned_sound_enabled');
        return stored ? stored === 'true' : true;
    });
    const lastCartIdsRef = useRef<Set<string>>(new Set());
    const audioCtxRef = useRef<AudioContext | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [cartToDelete, setCartToDelete] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'New' | 'Contacted'>('all');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        return { startDate, endDate };
    });
    const [selectedCarts, setSelectedCarts] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    // State untuk NEW carts pending refresh (banner instead of auto-refresh)
    const [pendingNewCarts, setPendingNewCarts] = useState<AbandonedCart[]>([]);
    const [showNewCartsBanner, setShowNewCartsBanner] = useState(false);

    // State untuk modal proses ke pesanan
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [cartToProcess, setCartToProcess] = useState<AbandonedCart | null>(null);
    const [processFormData, setProcessFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        shippingAddress: '',
        province: '',
        city: '',
        district: '',
        paymentMethod: 'COD',
        shippingMethod: 'Regular',
        notes: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

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

            // Delete abandoned carts older than 14 days
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const isoDate = fourteenDaysAgo.toISOString();

            await supabase
                .from('abandoned_carts')
                .delete()
                .lt('timestamp', isoDate);

            const { data: cartsData } = await supabase.from('abandoned_carts').select('*').order('timestamp', { ascending: false });

            const cartsList = (cartsData || []).map(cart => {
                return {
                    ...cart,
                    timestamp: cart.timestamp // already string or Date object handled by JS
                } as AbandonedCart;
            });
            setCarts(cartsList);

            // Track new (uncontacted) abandoned carts for notification badge
            const newCartsCount = (cartsList || []).filter((c: AbandonedCart) => c.status === 'New').length;
            setNewAbandonedCount(newCartsCount);

            lastCartIdsRef.current = new Set(cartsList.map(c => c.id));
        } catch (error) {
            console.error("Error fetching abandoned carts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Handler untuk refresh keranjang baru ---
    const handleRefreshNewCarts = useCallback(() => {
        if (pendingNewCarts.length > 0) {
            setCarts(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNewCarts = pendingNewCarts.filter(c => !existingIds.has(c.id));
                return [...uniqueNewCarts, ...prev];
            });
            setPendingNewCarts([]);
            setShowNewCartsBanner(false);
            showToast(`${pendingNewCarts.length} keranjang baru ditambahkan!`, 'success');
        }
    }, [pendingNewCarts, showToast]);

    // --- Play notification sound (Beep-beep for abandoned carts) ---
    const playNotificationSound = useCallback(() => {
        if (!cartSoundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;

            // Beep-beep alert sound
            const now = ctx.currentTime;

            // First beep - sharp and attention-grabbing
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.value = 800;
            osc1.type = 'square';
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.12);

            // Short silence

            // Second beep - same tone
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.value = 800;
            osc2.type = 'square';
            gain2.gain.setValueAtTime(0.25, now + 0.18);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.30);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.18);
            osc2.stop(now + 0.30);
        } catch (err) {
            console.warn('Audio notification failed:', err);
        }
    }, [cartSoundEnabled]);

    // --- Real-time subscription for new abandoned carts ---
    useEffect(() => {
        if (!currentUser?.id) return; // Wait for user to load

        let subscription: any = null;

        const setupRealtimeListener = async () => {
            try {
                // Each user gets unique channel to prevent cross-user notifications
                subscription = supabase
                    .channel(`abandoned-carts-channel-${currentUser.id}`)
                    .on('postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'abandoned_carts'
                            // Note: Abandoned carts don't have assignedCsId, so all users see all carts
                            // Consider adding filtering logic if needed
                        },
                        async (payload: any) => {
                            console.log('[Real-time] New abandoned cart:', payload.new);

                            const newCart = payload.new as AbandonedCart;

                            // ✅ JANGAN auto-refresh! Simpan ke pending dan tampilkan banner
                            setPendingNewCarts(prev => {
                                if (prev.some(c => c.id === newCart.id)) return prev;
                                return [newCart, ...prev];
                            });
                            setShowNewCartsBanner(true);

                            // Show notification
                            showToast(`🛒 Keranjang baru: ${newCart.customerName || 'Pelanggan'}. Klik refresh untuk melihat.`, 'info');
                            playNotificationSound();

                            // Insert to notifications table
                            try {
                                await supabase.from('notifications').insert({
                                    user_id: currentUser?.id,
                                    type: 'CART_ABANDON',
                                    title: 'Keranjang Ditinggalkan',
                                    message: `🛒 Keranjang ditinggalkan oleh ${newCart.customerName || 'Pelanggan'} - Rp${(newCart.totalPrice || 0).toLocaleString('id-ID')}`,
                                    is_read: false,
                                    metadata: { cart_id: newCart.id },
                                });
                            } catch (err) {
                                console.warn('Failed to insert cart notification:', err);
                            }

                            // Update counter
                            if (newCart.status === 'New') {
                                setNewAbandonedCount(prev => prev + 1);
                            }
                        }
                    )
                    .subscribe((status: any) => {
                        console.log('[Real-time] Abandoned carts subscription status:', status);
                    });
            } catch (err) {
                console.error('Error setting up abandoned carts listener:', err);
            }
        };

        setupRealtimeListener();

        return () => {
            if (subscription) {
                console.log(`[Real-time] Unsubscribing from abandoned-carts-channel-${currentUser?.id}`);
                supabase.removeChannel(subscription);
            }
        };
    }, [showToast, playNotificationSound, setNewAbandonedCount, currentUser?.id]);

    // --- Lightweight polling for new abandoned carts (fallback) ---
    const playTone = (freq: number) => {
        if (!cartSoundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.value = freq;
            gain.gain.value = 0.18;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            oscillator.start(now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            oscillator.stop(now + 0.3);
        } catch (err) {
            console.warn('Audio notification failed:', err);
        }
    };

    const refreshAbandonedSilently = useCallback(async () => {
        try {
            // Optimized: Only fetch recent 200 abandoned carts
            const { data: cartsData, error } = await supabase
                .from('abandoned_carts')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(200);

            if (error) throw error;

            const cartsList = (cartsData || []).map(cart => ({
                ...cart,
                timestamp: cart.timestamp,
            } as AbandonedCart));

            const previousIds = lastCartIdsRef.current;
            const newOnes = cartsList.filter(c => !previousIds.has(c.id));
            console.log('[Polling Carts] Previous:', previousIds.size, 'New:', newOnes.length);
            if (previousIds.size > 0 && newOnes.length > 0) {
                console.log('[Notification Carts] Showing toast for', newOnes.length, 'new carts');
                showToast(`🛒 ${newOnes.length} keranjang baru tercatat`, 'info');
                playTone(660);
            }

            setCarts(cartsList);

            // Update notification count for new abandoned carts
            const newCartsCount = (cartsList || []).filter((c: AbandonedCart) => c.status === 'New').length;
            setNewAbandonedCount(newCartsCount);

            lastCartIdsRef.current = new Set(cartsList.map(c => c.id));
        } catch (err) {
            console.error('Silent refresh abandoned carts failed:', err);
        }
    }, [showToast, playTone, setNewAbandonedCount]);

    // DISABLED: Real-time subscription is sufficient, polling causes high CPU usage
    // useEffect(() => {
    //     const interval = setInterval(() => refreshAbandonedSilently(), 30000); // 30s polling (faster than before)
    //     return () => clearInterval(interval);
    // }, [refreshAbandonedSilently]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('abandoned_sound_enabled', cartSoundEnabled ? 'true' : 'false');
        }
    }, [cartSoundEnabled]);

    const handleFollowUp = async (cart: AbandonedCart) => {
        const waNumber = formatWaNumber(cart.customerPhone);
        if (!waNumber) {
            showToast("Nomor WhatsApp tidak valid.", 'warning');
            return;
        }
        const message = `Halo ${capitalizeWords(cart.customerName)}, kami melihat Anda tertarik dengan produk ${cart.formTitle} (${cart.selectedVariant}). Apakah ada yang bisa kami bantu untuk menyelesaikan pesanan Anda?`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');

        // Auto update status to Contacted after follow up
        if (cart.status === 'New') {
            try {
                await supabase.from('abandoned_carts').update({ status: 'Contacted' }).eq('id', cart.id);
                setCarts(prev => prev.map(c => c.id === cart.id ? { ...c, status: 'Contacted' } : c));
            } catch (error) {
                console.error("Error updating status:", error);
            }
        }
    };

    const handleMarkAsContacted = async (cartId: string) => {
        try {
            await supabase.from('abandoned_carts').update({ status: 'Contacted' }).eq('id', cartId);
            setCarts(prev => prev.map(c => c.id === cartId ? { ...c, status: 'Contacted' } : c));
            showToast("Status berhasil diperbarui.", 'success');
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Gagal memperbarui status.", 'error');
        }
    };

    const confirmDelete = async () => {
        if (!cartToDelete) return;
        try {
            await supabase.from('abandoned_carts').delete().eq('id', cartToDelete);
            setCarts(prev => prev.filter(c => c.id !== cartToDelete));
            showToast("Data berhasil dihapus.", 'success');
        } catch (error) {
            console.error("Error deleting cart:", error);
            showToast("Gagal menghapus data.", 'error');
        } finally {
            setDeleteModalOpen(false);
            setCartToDelete(null);
        }
    };

    const handleDeleteClick = (cartId: string) => {
        setCartToDelete(cartId);
        setDeleteModalOpen(true);
    };

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const dataToExport = filteredCarts.map(cart => ({
                'Tanggal': new Date(cart.timestamp).toLocaleString('id-ID'),
                'Nama Pelanggan': cart.customerName,
                'No. WhatsApp': cart.customerPhone,
                'Email': cart.customerEmail || '-',
                'Formulir': cart.formTitle,
                'Varian': cart.selectedVariant,
                'Total': cart.totalPrice || 0,
                'Status': cart.status === 'New' ? 'Baru' : 'Dihubungi'
            }));

            const csv = [
                Object.keys(dataToExport[0] || {}).join(','),
                ...dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `keranjang-terabaikan_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            showToast('Data berhasil diekspor!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Gagal mengekspor data', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCarts.size === 0) return;

        try {
            for (const cartId of selectedCarts) {
                await supabase.from('abandoned_carts').delete().eq('id', cartId);
            }
            setCarts(prev => prev.filter(c => !selectedCarts.has(c.id)));
            setSelectedCarts(new Set());
            showToast(`${selectedCarts.size} data berhasil dihapus`, 'success');
        } catch (error) {
            console.error('Bulk delete error:', error);
            showToast('Gagal menghapus data', 'error');
        }
    };

    const handleToggleSelect = (cartId: string) => {
        const newSet = new Set(selectedCarts);
        if (newSet.has(cartId)) {
            newSet.delete(cartId);
        } else {
            newSet.add(cartId);
        }
        setSelectedCarts(newSet);
    };

    // handleToggleSelectAll moved after paginatedCarts definition

    const filteredCarts = useMemo(() => {
        let results = filterDataByBrand<AbandonedCart>(carts, currentUser);

        // Status filter
        if (statusFilter !== 'all') {
            results = results.filter(cart => cart.status === statusFilter);
        }

        // Date range filter
        if (dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(23, 59, 59, 999);
            results = results.filter(cart => {
                const d = new Date(cart.timestamp);
                return d >= start && d <= end;
            });
        }

        // Search filter
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(cart =>
                cart.customerName.toLowerCase().includes(lowercasedTerm) ||
                cart.customerPhone.toLowerCase().includes(lowercasedTerm) ||
                cart.formTitle.toLowerCase().includes(lowercasedTerm)
            );
        }
        return results;
    }, [carts, currentUser, searchTerm, statusFilter, dateRange]);

    // --- Pagination State ---
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES.SMALL); // default 10 per page
    const [page, setPage] = useState<number>(1);

    // Reset to first page when filters/search/pageSize change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter, dateRange, pageSize, carts]);

    const paginationResult = useMemo(() => {
        if (!filteredCarts || filteredCarts.length === 0) {
            return {
                data: [],
                page: 1,
                pageSize,
                total: 0,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
        }

        // pageSize === 0 means show all
        const effectivePageSize = pageSize === 0 ? Math.max(1, filteredCarts.length) : pageSize;
        return paginateArray(filteredCarts, page, effectivePageSize);
    }, [filteredCarts, page, pageSize]);

    const paginatedCarts = paginationResult.data;
    const totalPages = paginationResult.totalPages;

    // Toggle Select All (now uses paginatedCarts for current page only)
    const handleToggleSelectAll = () => {
        if (selectedCarts.size === paginatedCarts.length && paginatedCarts.length > 0) {
            setSelectedCarts(new Set());
        } else {
            setSelectedCarts(new Set(paginatedCarts.map(c => c.id)));
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const brandFiltered = filterDataByBrand<AbandonedCart>(carts, currentUser);

        // Potensi Revenue: hanya hitung yang punya nama DAN whatsapp (bisa di-follow up)
        const validForRevenue = brandFiltered.filter(c =>
            c.customerName &&
            c.customerName.trim() !== '' &&
            c.customerPhone &&
            c.customerPhone.trim() !== '' &&
            (c.status === 'New' || c.status === 'Contacted')
        );
        const invalidCarts = brandFiltered.filter(c =>
            !c.customerPhone || c.customerPhone.trim() === ''
        ).length;

        return {
            total: brandFiltered.length,
            new: brandFiltered.filter(c => c.status === 'New').length,
            contacted: brandFiltered.filter(c => c.status === 'Contacted').length,
            totalValue: brandFiltered.reduce((sum, c) => sum + (c.totalPrice || 0), 0),
            potentialRevenue: validForRevenue.reduce((sum, c) => sum + (c.totalPrice || 0), 0),
            validCartsCount: validForRevenue.length,
            invalidCartsCount: invalidCarts
        };
    }, [carts, currentUser]);

    // Handler untuk membuka modal proses ke pesanan
    const handleOpenProcessModal = (cart: AbandonedCart) => {
        setCartToProcess(cart);
        setProcessFormData({
            customerName: cart.customerName || '',
            customerPhone: cart.customerPhone || '',
            customerEmail: (cart as any).customerEmail || '',
            shippingAddress: (cart as any).shippingAddress || '',
            province: (cart as any).province || '',
            city: (cart as any).city || '',
            district: (cart as any).district || '',
            paymentMethod: (cart as any).paymentMethod || 'COD',
            shippingMethod: (cart as any).shippingMethod || 'Regular',
            notes: ''
        });
        setProcessModalOpen(true);
    };

    // Validasi form sebelum proses
    const isFormValid = useMemo(() => {
        return (
            processFormData.customerName.trim() !== '' &&
            processFormData.customerPhone.trim() !== '' &&
            processFormData.shippingAddress.trim() !== ''
        );
    }, [processFormData]);

    // Handler untuk proses abandoned cart ke pesanan
    const handleProcessToOrder = async () => {
        if (!cartToProcess || !isFormValid) return;

        setIsProcessing(true);
        try {
            // Generate order ID
            const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            // Buat order baru
            const newOrder = {
                id: orderId,
                customer: processFormData.customerName,
                customerPhone: processFormData.customerPhone,
                customerEmail: processFormData.customerEmail,
                shippingAddress: `${processFormData.shippingAddress}${processFormData.district ? ', ' + processFormData.district : ''}${processFormData.city ? ', ' + processFormData.city : ''}${processFormData.province ? ', ' + processFormData.province : ''}`,
                status: 'Pending',
                urgency: 'Medium',
                followUps: 0,
                date: new Date().toISOString(),
                productName: cartToProcess.formTitle,
                productPrice: cartToProcess.totalPrice || 0,
                formId: cartToProcess.formId,
                formTitle: cartToProcess.formTitle,
                brandId: cartToProcess.brandId || null,
                shippingMethod: processFormData.shippingMethod,
                paymentMethod: processFormData.paymentMethod,
                totalPrice: cartToProcess.totalPrice || 0,
                variant: cartToProcess.selectedVariant,
                quantity: 1,
                notes: processFormData.notes || `Diproses dari Keranjang Terabaikan`,
                assignedCsId: currentUser?.id,
                sourceForm: cartToProcess.formId,
            };

            // Insert ke tabel orders
            const { error: orderError } = await supabase.from('orders').insert(newOrder);

            if (orderError) {
                console.error('Error creating order:', orderError);
                showToast('Gagal membuat pesanan: ' + orderError.message, 'error');
                return;
            }

            // Hapus abandoned cart
            await supabase.from('abandoned_carts').delete().eq('id', cartToProcess.id);

            // Hapus notifikasi abandoned cart terkait
            await supabase.from('notifications').delete().eq('id', `cart-${cartToProcess.id}`);

            // Update state lokal
            setCarts(prev => prev.filter(c => c.id !== cartToProcess.id));

            showToast(`✅ Pesanan ${orderId} berhasil dibuat!`, 'success');
            setProcessModalOpen(false);
            setCartToProcess(null);
        } catch (error) {
            console.error('Error processing cart to order:', error);
            showToast('Gagal memproses ke pesanan', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                            <ShoppingCartIcon className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Keranjang Terabaikan</h1>
                    </div>
                    <p className="ml-12 text-sm text-slate-600 dark:text-slate-400">Hubungi calon pelanggan yang belum menyelesaikan pesanan.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <button
                        onClick={() => setCartSoundEnabled(prev => !prev)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-md transition-all ${cartSoundEnabled ? 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                        title="Toggle notifikasi suara keranjang"
                    >
                        <span className="text-lg">{cartSoundEnabled ? '🔔' : '🔕'}</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={isExporting || filteredCarts.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-md shadow-green-500/20 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isExporting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                        <span>Ekspor</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center">
                            <ShoppingCartIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-bold">{stats.total}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-blue-100 mt-2">Total Keranjang</h3>
                    <p className="text-[11px] text-blue-200">Semua data</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <span className="text-xl font-bold">{stats.new}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-amber-100 mt-2">Belum Dihubungi</h3>
                    <p className="text-[11px] text-amber-200">Perlu follow up</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center">
                            <CheckCircleFilledIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xl font-bold">{stats.contacted}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-green-100 mt-2">Sudah Dihubungi</h3>
                    <p className="text-[11px] text-green-200">Follow up selesai</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-3 text-white shadow-md hover:shadow-lg transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 bg-white/20 rounded-md flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <span className="text-xl font-bold">Rp {(stats.potentialRevenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <h3 className="text-xs font-semibold text-purple-100 mt-2">Potensi Revenue</h3>
                    <p className="text-[11px] text-purple-200">{stats.validCartsCount} keranjang dengan data lengkap</p>
                    {stats.invalidCartsCount > 0 && (
                        <p className="text-[10px] text-purple-300/70 mt-0.5">⚠️ {stats.invalidCartsCount} tanpa WhatsApp</p>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2 mb-3">
                    {['all', 'New', 'Contacted'].map(status => {
                        const isActive = statusFilter === status;
                        const label = status === 'all' ? 'Semua' : status === 'New' ? 'Belum Dihubungi' : 'Sudah Dihubungi';
                        const count = status === 'all' ? stats.total : status === 'New' ? stats.new : stats.contacted;

                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${isActive
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {label}
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-slate-600 text-amber-600 dark:text-amber-400'
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama pelanggan, nomor WhatsApp, atau produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedCarts.size > 0 && (
                <div className="bg-amber-600 text-white rounded-2xl shadow-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">{selectedCarts.size} data terpilih</span>
                            <button onClick={() => setSelectedCarts(new Set())} className="text-sm underline hover:no-underline">
                                Batal Pilihan
                            </button>
                        </div>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Hapus Terpilih
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ New Carts Banner - Tombol Refresh untuk keranjang baru */}
            {showNewCartsBanner && pendingNewCarts.length > 0 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl shadow-xl p-4 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full">
                                <ShoppingCartIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="font-bold text-lg">{pendingNewCarts.length} Keranjang Baru!</span>
                                <p className="text-sm text-white/80">Klik tombol refresh untuk menampilkan data baru</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setShowNewCartsBanner(false);
                                    setPendingNewCarts([]);
                                }}
                                className="px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={handleRefreshNewCarts}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <SpinnerIcon className="w-12 h-12 text-amber-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat data...</p>
                        </div>
                    ) : filteredCarts.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                                <ShoppingCartIcon className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tidak ada data ditemukan</h3>
                            <p className="text-slate-500 dark:text-slate-400">Coba ubah filter atau kata kunci pencarian.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/30 border-b-2 border-amber-100 dark:border-amber-900/30">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedCarts.size === paginatedCarts.length && paginatedCarts.length > 0}
                                            onChange={handleToggleSelectAll}
                                            className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Auto Hapus</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pelanggan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Produk / Varian</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {paginatedCarts.map(cart => (
                                    <tr key={cart.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-700/30 transition-all group border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                                        <td className="px-4 py-3 align-middle">
                                            <input
                                                type="checkbox"
                                                checked={selectedCarts.has(cart.id)}
                                                onChange={() => handleToggleSelect(cart.id)}
                                                className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                    {new Date(cart.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(cart.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {(() => {
                                                const deleteDate = new Date(cart.timestamp);
                                                deleteDate.setDate(deleteDate.getDate() + 14);
                                                const daysLeft = Math.ceil((deleteDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <span className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        🗑️ {daysLeft} hari
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-900 dark:text-white text-sm">{capitalizeWords(cart.customerName)}</span>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <WhatsAppIcon className="w-3 h-3 text-green-500" />
                                                    {cart.customerPhone}
                                                </div>
                                                {cart.customerEmail && (
                                                    <div className="text-xs text-slate-400">{cart.customerEmail}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="max-w-xs">
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{cart.formTitle}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{cart.selectedVariant}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">Rp {cart.totalPrice?.toLocaleString('id-ID')}</span>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {cart.status === 'New' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                                    </svg>
                                                    Baru
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    <CheckCircleFilledIcon className="w-3 h-3" />
                                                    Dihubungi
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-middle text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleFollowUp(cart)}
                                                    className={`p-2 rounded-lg transition-all hover:scale-110 relative ${cart.status === 'Contacted'
                                                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                        }`}
                                                    title={cart.status === 'Contacted' ? 'Sudah dihubungi via WhatsApp' : 'Hubungi via WhatsApp'}
                                                >
                                                    <WhatsAppIcon className="w-4 h-4" />
                                                    {cart.status === 'Contacted' && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenProcessModal(cart)}
                                                    className="p-2 rounded-lg transition-all hover:scale-110 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                    title="Proses ke Pesanan"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(cart.id)}
                                                    className="p-2 rounded-lg transition-all hover:scale-110 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredCarts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600 dark:text-slate-400">Tampilkan:</label>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(parseInt(e.target.value, 10))}
                                className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                            >
                                <option value={PAGE_SIZES.SMALL}>10</option>
                                <option value={PAGE_SIZES.MEDIUM}>25</option>
                                <option value={PAGE_SIZES.LARGE}>50</option>
                                <option value={PAGE_SIZES.EXTRA_LARGE}>100</option>
                                <option value={0}>Semua</option>
                            </select>
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg font-semibold text-sm">Total: {filteredCarts.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                Prev
                            </button>
                            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg font-semibold text-sm">
                                Halaman {page} / {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {deleteModalOpen && (
                <ConfirmationModal
                    isOpen={deleteModalOpen}
                    title="Hapus Data"
                    message="Anda yakin ingin menghapus data ini?"
                    confirmLabel="Ya, Hapus"
                    variant="danger"
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteModalOpen(false)}
                />
            )}

            {/* Modal Proses ke Pesanan */}
            {processModalOpen && cartToProcess && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Proses ke Pesanan</h2>
                                        <p className="text-xs text-indigo-200">Lengkapi data untuk membuat pesanan</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setProcessModalOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <XIcon className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Info Produk */}
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{cartToProcess.formTitle}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{cartToProcess.selectedVariant}</p>
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                                    Rp {(cartToProcess.totalPrice || 0).toLocaleString('id-ID')}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nama Pelanggan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={processFormData.customerName}
                                        onChange={(e) => setProcessFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${!processFormData.customerName.trim() ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                            } focus:ring-2 focus:ring-indigo-500 outline-none`}
                                        placeholder="Masukkan nama"
                                    />
                                    {!processFormData.customerName.trim() && (
                                        <p className="text-xs text-red-500 mt-1">⚠️ Nama wajib diisi</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        No. WhatsApp <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={processFormData.customerPhone}
                                        onChange={(e) => setProcessFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${!processFormData.customerPhone.trim() ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                            } focus:ring-2 focus:ring-indigo-500 outline-none`}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                    {!processFormData.customerPhone.trim() && (
                                        <p className="text-xs text-red-500 mt-1">⚠️ WhatsApp wajib diisi</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={processFormData.customerEmail}
                                        onChange={(e) => setProcessFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="email@example.com (opsional)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Alamat Lengkap <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={processFormData.shippingAddress}
                                        onChange={(e) => setProcessFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                                        rows={2}
                                        className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ${!processFormData.shippingAddress.trim() ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                                            } focus:ring-2 focus:ring-indigo-500 outline-none resize-none`}
                                        placeholder="Jalan, RT/RW, Kelurahan"
                                    />
                                    {!processFormData.shippingAddress.trim() && (
                                        <p className="text-xs text-red-500 mt-1">⚠️ Alamat wajib diisi</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kecamatan</label>
                                        <input
                                            type="text"
                                            value={processFormData.district}
                                            onChange={(e) => setProcessFormData(prev => ({ ...prev, district: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Kecamatan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kota</label>
                                        <input
                                            type="text"
                                            value={processFormData.city}
                                            onChange={(e) => setProcessFormData(prev => ({ ...prev, city: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Kota"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Provinsi</label>
                                        <input
                                            type="text"
                                            value={processFormData.province}
                                            onChange={(e) => setProcessFormData(prev => ({ ...prev, province: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Provinsi"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metode Pembayaran</label>
                                        <select
                                            value={processFormData.paymentMethod}
                                            onChange={(e) => setProcessFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="COD">COD</option>
                                            <option value="Transfer">Transfer Bank</option>
                                            <option value="QRIS">QRIS</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metode Pengiriman</label>
                                        <select
                                            value={processFormData.shippingMethod}
                                            onChange={(e) => setProcessFormData(prev => ({ ...prev, shippingMethod: e.target.value }))}
                                            className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="Regular">Regular</option>
                                            <option value="Express">Express</option>
                                            <option value="Same Day">Same Day</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
                                    <textarea
                                        value={processFormData.notes}
                                        onChange={(e) => setProcessFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                        placeholder="Catatan tambahan (opsional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-700/50 px-6 py-4 rounded-b-2xl border-t border-slate-200 dark:border-slate-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Total Pesanan</p>
                                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        Rp {(cartToProcess.totalPrice || 0).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setProcessModalOpen(false)}
                                        className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleProcessToOrder}
                                        disabled={!isFormValid || isProcessing}
                                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleFilledIcon className="w-4 h-4" />
                                                Buat Pesanan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {!isFormValid && (
                                <p className="text-xs text-red-500 mt-2 text-right">⚠️ Lengkapi field yang wajib diisi</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AbandonedCartsPage;
