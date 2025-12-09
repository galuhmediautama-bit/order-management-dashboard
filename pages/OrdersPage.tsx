
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Order, OrderStatus, MessageTemplates, Form, ShippingSettings, PaymentSettings, UserRole, User, Brand } from '../types';
import PlusIcon from '../components/icons/PlusIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import ShipIcon from '../components/icons/ShipIcon';
import DotsHorizontalIcon from '../components/icons/DotsHorizontalIcon';
import StatusBadge from '../components/StatusBadge';
import EyeIcon from '../components/icons/EyeIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import SearchIcon from '../components/icons/SearchIcon';
import PhoneIcon from '../components/icons/PhoneIcon';
import MailIcon from '../components/icons/MailIcon';
import LocationMarkerIcon from '../components/icons/LocationMarkerIcon';
import XIcon from '../components/icons/XIcon';
import UserIcon from '../components/icons/UserIcon';
import PlayIcon from '../components/icons/PlayIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import ArrowRightIcon from '../components/icons/ArrowRightIcon';
import UploadIcon from '../components/icons/UploadIcon';
import { supabase } from '../firebase';
import { capitalizeWords, filterDataByBrand, getNormalizedRole } from '../utils';
import { withRetry } from '../utils/errorHandling';
import { paginateArray, PAGE_SIZES } from '../utils/pagination';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import AddressInput, { type AddressData } from '../components/AddressInput';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import FilterIcon from '../components/icons/FilterIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportOrdersModal from '../components/ImportOrdersModal';
import { useToast } from '../contexts/ToastContext';
import { useNotificationCount } from '../contexts/NotificationCountContext';
import { useRolePermissions } from '../contexts/RolePermissionsContext';
import { getCachedForms, getCachedUsers, getCachedCsAgents, getCachedBrands, getCachedProducts, getCachedSettings, getCachedMessageTemplates, getCachedCancellationReasons, warmCache, invalidateOnOrderChange, invalidateCache } from '../utils/cacheHelpers';
import { CACHE_KEYS } from '../utils/cacheHelpers';
import { ColumnVisibilityModal, type ColumnConfig } from '../components/ColumnVisibilityModal';
import SettingsIcon from '../components/icons/SettingsIcon';

// --- Helper Components & Functions ---

const TABS: ('All' | OrderStatus)[] = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled'];

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

// ... Modals will be updated below ...

const OrdersPage: React.FC = () => {
    const { canUseFeature } = useRolePermissions();
    const [orders, setOrders] = useState<Order[]>([]);
    const [forms, setForms] = useState<Form[]>([]); // For manual order
    const [csUsers, setCsUsers] = useState<User[]>([]); // List of CS agents for assignment
    const [allUsers, setAllUsers] = useState<User[]>([]); // ALL users for modal lookups
    const [csAgents, setCsAgents] = useState<any[]>([]); // CS agents for modal lookups
    const [brands, setBrands] = useState<Brand[]>([]); // All brands for modal lookups
    const [products, setProducts] = useState<any[]>([]); // All products for modal lookups
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { setNewOrdersCount } = useNotificationCount();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [orderSoundEnabled, setOrderSoundEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem('orders_sound_enabled');
        return stored ? stored === 'true' : true;
    });
    const lastOrderIdsRef = useRef<Set<string>>(new Set());
    const audioCtxRef = useRef<AudioContext | null>(null);

    // State for Filters
    const [activeStatusFilter, setActiveStatusFilter] = useState<Set<OrderStatus>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        return { startDate, endDate };
    });
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
    const [selectedProductFilter, setSelectedProductFilter] = useState<string>('all');
    const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<Set<string>>(new Set());
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);

    // Bulk Actions
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    // Dropdown Actions
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Pending Deletions
    const [pendingDeletionsCount, setPendingDeletionsCount] = useState<number>(0);

    // Modal States
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Action Modal States
    const [orderToProcess, setOrderToProcess] = useState<Order | null>(null);
    const [orderToShip, setOrderToShip] = useState<Order | null>(null);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [orderToNotify, setOrderToNotify] = useState<Order | null>(null);
    const [orderToChangePayment, setOrderToChangePayment] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancellationReason, setCancellationReason] = useState<string>('');

    const [templates, setTemplates] = useState<MessageTemplates | null>(null);
    const [cancellationReasons, setCancellationReasons] = useState<string[]>([]);
    // Assignment state for inline CS assign
    const [assignTargetOrderId, setAssignTargetOrderId] = useState<string | null>(null);
    const [assignSelectedCsId, setAssignSelectedCsId] = useState<string>('');

    // Column Visibility State
    const [isColumnVisibilityModalOpen, setIsColumnVisibilityModalOpen] = useState(false);
    const [columnVisibility, setColumnVisibility] = useState<ColumnConfig[]>([
        { key: 'orderId', label: 'Order ID & Tanggal', visible: true },
        { key: 'customer', label: 'Pelanggan', visible: true },
        { key: 'product', label: 'Produk & Total', visible: true },
        { key: 'status', label: 'Status & Pembayaran', visible: true },
        { key: 'platform', label: 'Platform', visible: true },
        { key: 'cs', label: 'CS', visible: true },
        { key: 'followUp', label: 'Follow Up', visible: true },
        { key: 'actions', label: 'Aksi', visible: true },
    ]);
    const [isLoadingColumnPrefs, setIsLoadingColumnPrefs] = useState(false);
    const [isSavingColumnPrefs, setIsSavingColumnPrefs] = useState(false);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.payment-dropdown') && !target.closest('.status-dropdown') && !target.closest('.brand-dropdown') && !target.closest('.product-dropdown')) {
                setPaymentDropdownOpen(false);
                setStatusDropdownOpen(false);
                setBrandDropdownOpen(false);
                setProductDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Data (with caching)
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. User & Role
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userDoc } = await withRetry(() =>
                    supabase.from('users').select('*').eq('id', user.id).single().then(r => ({
                        data: r.data,
                        error: r.error
                    }))
                );
                if (userDoc) {
                    const role = getNormalizedRole(userDoc.role, user.email);
                    setCurrentUser({ id: user.id, ...userDoc, role } as User);

                    // Fetch pending deletions count for admin
                    if (role === 'Admin' || role === 'Super Admin') {
                        console.log('🔍 Fetching pending deletions for role:', role);
                        const { count } = await withRetry(() =>
                            supabase
                                .from('pending_deletions')
                                .select('*', { count: 'exact', head: true })
                                .eq('status', 'pending')
                                .then(r => ({ count: r.count, error: r.error }))
                        );
                        console.log('🔍 Pending deletions result:', { count });
                        if (count !== null) {
                            setPendingDeletionsCount(count);
                            console.log('✅ Set pending deletions count:', count);
                        }
                    }
                } else {
                    const role = getNormalizedRole(undefined, user.email);
                    setCurrentUser({ id: user.id, role, name: 'Owner', email: user.email || '', status: 'Aktif', lastLogin: '' });
                }
            }

            // 2. Orders (exclude soft-deleted orders)
            // Optimized: Only select needed columns + limit to recent 500 orders + withRetry
            const { data: ordersData } = await withRetry(() =>
                supabase
                    .from('orders')
                    .select('id, customer, customerPhone, shippingAddress, totalPrice, status, date, assignedCsId, brandId, formId, variant, quantity, product_id, csCommission, advCommission, deletedAt')
                    .is('deletedAt', null)
                    .order('date', { ascending: false })
                    .limit(500)
                    .then(r => ({ data: r.data, error: r.error }))
            );

            const ordersList = (ordersData || []).map(data => {
                const typed = data as any;
                return {
                    ...typed,
                    productId: typed.product_id ?? typed.productId ?? null,
                } as Order;
            });
            setOrders(ordersList);
            lastOrderIdsRef.current = new Set(ordersList.map(o => o.id));

            // 3. Forms (for manual order dropdown)
            // Optimized: Only select needed columns + withRetry
            // Using caching helper
            const { data: cachedForms } = await getCachedForms();
            setForms((cachedForms || []).map(f => ({ ...f }) as Form));

            // 4. Users (for CS assignment and modal lookups)
            // Optimized: Only select needed columns + withRetry
            // Using caching helper
            const { data: usersData } = await getCachedUsers();
            if (usersData) {
                setAllUsers(usersData as User[]); // Store ALL users
                const cs = usersData.filter((u: any) => getNormalizedRole(u.role) === 'Customer service' && u.status === 'Aktif');
                setCsUsers(cs as User[]);
            }

            // 4.5. CS Agents (for modal lookups - separate table from users)
            // Optimized: Only select needed columns + withRetry
            // Using caching helper
            const { data: csAgentsData } = await getCachedCsAgents();
            if (csAgentsData) {
                setCsAgents(csAgentsData);
            }

            // 5. Brands (for modal lookups)
            // Optimized: Only select needed columns + withRetry
            // Using caching helper
            const { data: brandsData } = await getCachedBrands();
            if (brandsData) {
                setBrands(brandsData as Brand[]);
            }

            // 6. Products (for modal lookups)
            // Optimized: Only select needed columns + withRetry
            // Using caching helper
            const { data: productsData } = await getCachedProducts();
            if (productsData) {
                setProducts(productsData);
            }

            // 7. Templates
            // Using caching helper
            const { data: templatesData } = await getCachedMessageTemplates();
            if (templatesData) {
                setTemplates(templatesData as MessageTemplates);
            }

            // 8. Cancellation Reasons
            // Using caching helper
            const { data: cancellationData } = await getCachedCancellationReasons();
            if (cancellationData && cancellationData.reasons) {
                setCancellationReasons(cancellationData.reasons);
            } else {
                // Default reasons if not in database
                setCancellationReasons([
                    'Pelanggan tidak merespons',
                    'Pelanggan membatalkan sendiri',
                    'Alamat tidak lengkap/salah',
                    'Nomor telepon tidak aktif',
                    'Produk tidak tersedia',
                    'Harga tidak sesuai',
                    'Pembayaran gagal',
                    'Duplikat pesanan',
                    'Lainnya'
                ]);
            }

            // Update notification count
            const pendingCount = (ordersData || []).filter((o: any) => o.status === 'Pending').length;
            setNewOrdersCount(pendingCount);

        } catch (error: any) {
            console.error("Error fetching data:", error);
            console.error("Error details:", {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint
            });
            showToast(`Gagal memuat data pesanan: ${error?.message || 'Unknown error'}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // Load column visibility preferences from currentUser
    const loadColumnPreferences = async () => {
        if (!currentUser?.id) {
            console.log('⏭️ Skipping load column preferences - no currentUser');
            return;
        }
        setIsLoadingColumnPrefs(true);
        try {
            console.log('📂 Loading column preferences for user:', currentUser.id);
            const { data, error } = await supabase
                .from('users')
                .select('columnVisibility')
                .eq('id', currentUser.id)
                .single();

            if (error) {
                // Column might not exist yet - that's OK, just use defaults
                if (error.message?.includes('columnVisibility') || error.message?.includes('column')) {
                    console.warn('⚠️ columnVisibility column not found, using defaults. Run migration: ADD_COLUMN_VISIBILITY_FIELD.sql');
                } else {
                    console.warn('⚠️ Failed to load column preferences:', error);
                }
                return;
            }

            if (data?.columnVisibility) {
                console.log('✅ Loaded column preferences:', data.columnVisibility);
                // Merge saved preferences with default columns
                const saved = data.columnVisibility as Record<string, boolean>;
                const updated = columnVisibility.map(col => ({
                    ...col,
                    visible: saved[col.key] !== undefined ? saved[col.key] : col.visible,
                }));
                setColumnVisibility(updated);
            } else {
                console.log('ℹ️ No saved column preferences found, using defaults');
            }
        } catch (error) {
            console.warn('Failed to load column preferences:', error);
        } finally {
            setIsLoadingColumnPrefs(false);
        }
    };

    // Save column visibility preferences to database
    const saveColumnPreferences = async (columns: ColumnConfig[]) => {
        if (!currentUser?.id) {
            showToast('User ID tidak ditemukan', 'error');
            return;
        }
        setIsSavingColumnPrefs(true);
        try {
            const visibility: Record<string, boolean> = {};
            columns.forEach(col => {
                visibility[col.key] = col.visible;
            });

            console.log('💾 Saving column preferences:', { userId: currentUser.id, visibility });

            const { error } = await supabase
                .from('users')
                .update({ columnVisibility: visibility })
                .eq('id', currentUser.id);

            if (error) {
                console.error('❌ Save error:', error);
                // Check if error is about missing column
                if (error.message?.includes('columnVisibility') || error.message?.includes('column')) {
                    showToast('Database belum diupdate. Hubungi admin untuk menjalankan migration.', 'error');
                } else {
                    showToast(`Gagal menyimpan pengaturan kolom: ${error.message}`, 'error');
                }
                throw error;
            }

            console.log('✅ Column preferences saved successfully');
            setColumnVisibility(columns);
            showToast('Pengaturan kolom berhasil disimpan', 'success');
            setIsColumnVisibilityModalOpen(false);
        } catch (error) {
            console.error('Failed to save column preferences:', error);
        } finally {
            setIsSavingColumnPrefs(false);
        }
    };

    useEffect(() => {
        fetchData();
        loadColumnPreferences();
        // Pre-warm cache on component mount for faster repeat loads
        warmCache().catch(err => console.warn('Cache warming failed:', err));
    }, []);

    // Reload column preferences when currentUser changes
    useEffect(() => {
        if (currentUser?.id) {
            loadColumnPreferences();
        }
    }, [currentUser?.id]);

    // --- Play notification sound (Coin drop for orders) ---
    const playNotificationSound = useCallback(() => {
        if (!orderSoundEnabled) return;
        try {
            const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;

            // Coin drop sound effect - bright and resonant
            const now = ctx.currentTime;

            // Initial impact (high frequency)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.frequency.value = 1800;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0.4, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.08);

            // Bounce 1
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.frequency.value = 1400;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.3, now + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.18);

            // Bounce 2 (final ring)
            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.frequency.value = 1200;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.2, now + 0.2);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.start(now + 0.2);
            osc3.stop(now + 0.35);
        } catch (err) {
            console.warn('Audio notification failed:', err);
        }
    }, [orderSoundEnabled]);

    // --- Real-time subscription for new orders ---
    useEffect(() => {
        if (!currentUser?.id) return; // Wait for user to load

        let subscription: any = null;
        const userRole = getNormalizedRole(currentUser.role);

        const setupRealtimeListener = async () => {
            try {
                // Build filter based on role
                let filterConfig: any = {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders'
                };

                // CS: Only subscribe to assigned orders
                if (userRole === 'Customer service' && currentUser.id) {
                    filterConfig.filter = `assignedCsId=eq.${currentUser.id}`;
                }
                // Advertiser: Only subscribe to brand orders
                else if (userRole === 'Advertiser' && currentUser.assignedBrandIds?.length) {
                    // Note: Supabase real-time doesn't support IN operator well
                    // Will filter client-side after receiving
                }
                // Admin/Super Admin: Subscribe to all (no filter)

                subscription = supabase
                    .channel(`orders-channel-${currentUser.id}`)
                    .on('postgres_changes', filterConfig,
                        async (payload: any) => {
                            console.log('[Real-time] New order detected:', payload.new);

                            // Add new order
                            const newOrder = {
                                ...payload.new,
                                productId: payload.new.product_id ?? payload.new.productId ?? null,
                            } as Order;

                            // Client-side filter for Advertiser role
                            if (userRole === 'Advertiser' && currentUser.assignedBrandIds?.length) {
                                const orderBrandId = newOrder.brandId;
                                if (!orderBrandId || !currentUser.assignedBrandIds.includes(orderBrandId)) {
                                    return; // Skip this order
                                }
                            }

                            setOrders(prev => [newOrder, ...prev]);

                            // Show notification
                            showToast('📦 Pesanan baru masuk!', 'success');
                            playNotificationSound();

                            // Insert to notifications table
                            try {
                                await supabase.from('notifications').insert({
                                    id: `order-${newOrder.id}`,
                                    type: 'new_order',
                                    message: `📦 Pesanan baru dari ${newOrder.customer || 'Pelanggan'} - Rp${(newOrder.totalPrice || 0).toLocaleString('id-ID')}`,
                                    read: false,
                                    timestamp: new Date().toISOString(),
                                    user_id: currentUser?.id,
                                    order_id: newOrder.id,
                                    created_at: new Date().toISOString(),
                                });
                            } catch (err) {
                                console.warn('Failed to insert notification:', err);
                            }

                            // Update counter
                            if (newOrder.status === 'Pending') {
                                setNewOrdersCount(prev => prev + 1);
                            }
                        }
                    )
                    .subscribe((status: any) => {
                        console.log('[Real-time] Subscription status:', status);
                    });
            } catch (err) {
                console.error('Error setting up real-time listener:', err);
            }
        };

        setupRealtimeListener();

        return () => {
            if (subscription) {
                console.log(`[Real-time] Unsubscribing from orders-channel-${currentUser?.id}`);
                supabase.removeChannel(subscription);
            }
        };
    }, [showToast, playNotificationSound, setNewOrdersCount, currentUser?.id, currentUser?.role, currentUser?.assignedBrandIds]);

    // --- Fallback polling for new orders (faster interval) ---
    const refreshOrdersSilently = useCallback(async () => {
        try {
            // Optimized: Only fetch recent orders for notification check
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, customer, customerPhone, shippingAddress, totalPrice, status, date, assignedCsId, brandId, formId, variant, quantity, product_id, csCommission, advCommission, deletedAt')
                .is('deletedAt', null)
                .order('date', { ascending: false })
                .limit(100);

            if (ordersError) throw ordersError;

            const ordersList = (ordersData || []).map(data => {
                const typed = data as any;
                return {
                    ...typed,
                    productId: typed.product_id ?? typed.productId ?? null,
                } as Order;
            });

            // Detect new arrivals
            const previousIds = lastOrderIdsRef.current;
            const newOnes = ordersList.filter(o => !previousIds.has(o.id));

            if (previousIds.size > 0 && newOnes.length > 0) {
                console.log('[Polling] New orders detected:', newOnes.length);
                showToast(`📦 ${newOnes.length} pesanan baru masuk`, 'success');
                playNotificationSound();
            }

            setOrders(ordersList);

            // Update notification count for pending orders
            const pendingCount = (ordersList || []).filter((o: any) => o.status === 'Pending').length;
            setNewOrdersCount(pendingCount);

            lastOrderIdsRef.current = new Set(ordersList.map(o => o.id));
        } catch (err) {
            console.error('Polling refresh failed:', err);
        }
    }, [showToast, playNotificationSound, setNewOrdersCount]);

    // --- Polling interval (fallback if real-time fails) ---
    // DISABLED: Real-time subscription is sufficient, polling causes high CPU usage
    // useEffect(() => {
    //   const interval = setInterval(() => {
    //       refreshOrdersSilently();
    //   }, 15000); // 15s polling (faster than before)
    //   return () => clearInterval(interval);
    // }, [refreshOrdersSilently]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('orders_sound_enabled', orderSoundEnabled ? 'true' : 'false');
        }
    }, [orderSoundEnabled]);

    // --- Actions ---

    const handleSaveManualOrder = async (newOrderData: Omit<Order, 'id'>) => {
        try {
            // If editing existing order (selectedOrder exists), update it
            if (selectedOrder) {
                const { error } = await supabase.from('orders')
                    .update({
                        customer: newOrderData.customer,
                        customerPhone: newOrderData.customerPhone,
                        shippingAddress: newOrderData.shippingAddress,
                        totalPrice: newOrderData.totalPrice,
                        assignedCsId: newOrderData.assignedCsId,
                        notes: newOrderData.notes,
                        variant: newOrderData.variant,
                        quantity: newOrderData.quantity
                    })
                    .eq('id', selectedOrder.id);

                if (error) throw error;

                // Invalidate cache after order mutation
                await invalidateOnOrderChange(selectedOrder.id);

                setOrders(prev => prev.map(o =>
                    o.id === selectedOrder.id
                        ? { ...o, ...newOrderData }
                        : o
                ));
                showToast("Pesanan berhasil diupdate.", "success");
            } else {
                // Create new order
                const { productId, ...restOrder } = newOrderData as any;
                const dataWithTimestamp = {
                    ...restOrder,
                    product_id: productId ?? null,
                    date: new Date().toISOString()
                };
                const { data, error } = await supabase.from('orders').insert(dataWithTimestamp).select().single();

                // Invalidate cache after order creation
                await invalidateOnOrderChange((data as any).id);
                if (error) throw error;

                const newOrder = {
                    ...(data as Order),
                    productId: (data as any)?.product_id ?? (data as any)?.productId ?? null,
                } as Order;
                setOrders(prev => [newOrder, ...prev]);
                showToast("Pesanan manual berhasil dibuat.", "success");
            }

            setIsManualOrderModalOpen(false);
            setSelectedOrder(null);
        } catch (error) {
            console.error("Error saving order:", error);
            showToast(selectedOrder ? "Gagal update pesanan." : "Gagal membuat pesanan.", "error");
        }
    };

    const handleCancelOrder = async () => {
        if (!orderToCancel || !cancellationReason) {
            showToast("Mohon pilih alasan pembatalan.", "error");
            return;
        }

        try {
            const { error } = await supabase.from('orders').update({
                status: 'Canceled',
                "cancellationReason": cancellationReason
            }).eq('id', orderToCancel.id);

            if (error) {
                console.error("Update error details:", error);
                throw error;

                // Invalidate cache after order cancellation
                await invalidateOnOrderChange(orderToCancel.id);
            }

            setOrders(prev => prev.map(o =>
                o.id === orderToCancel.id
                    ? { ...o, status: 'Canceled', cancellationReason: cancellationReason }
                    : o
            ));

            showToast("Pesanan berhasil dibatalkan.", "success");
            setOrderToCancel(null);
            setCancellationReason('');

        } catch (error: any) {
            console.error("Error canceling order:", error);
            const errorMsg = error?.message || error?.error_description || "Gagal membatalkan pesanan";
            showToast(`Gagal membatalkan pesanan: ${errorMsg}`, "error");
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, extraData?: Partial<Order>) => {
        // Check permission to change order status
        if (!currentUser || !canUseFeature('change_order_status', getNormalizedRole(currentUser.role))) {
            showToast("Anda tidak memiliki izin untuk mengubah status pesanan.", "error");
            return;
        }

        try {
            const { error } = await supabase.from('orders').update({ status: newStatus, ...extraData }).eq('id', orderId);

            // Invalidate cache after status update
            await invalidateOnOrderChange(orderId);
            if (error) throw error;

            const updatedOrder = orders.find(o => o.id === orderId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o));

            // Close modals if open
            setOrderToProcess(null);
            setOrderToShip(null);
            setOrderToDelete(null);

            showToast(`Status pesanan diperbarui menjadi ${newStatus}.`, "success");

            // Insert notification for status change
            try {
                const statusMessages: Record<string, string> = {
                    'Processing': '⚙️ Pesanan sedang diproses',
                    'Shipped': '🚚 Pesanan telah dikirim',
                    'Delivered': '✅ Pesanan telah diterima',
                    'Canceled': '❌ Pesanan dibatalkan',
                };

                const message = statusMessages[newStatus] || `Status pesanan berubah menjadi ${newStatus}`;

                await supabase.from('notifications').insert({
                    id: `order-status-${orderId}-${Date.now()}`,
                    type: 'order_status_change',
                    message: `${message} - ${updatedOrder?.customer || 'Pesanan'}`,
                    read: false,
                    timestamp: new Date().toISOString(),
                    user_id: currentUser?.id,
                    order_id: orderId,
                    created_at: new Date().toISOString(),
                });
            } catch (err) {
                console.warn('Failed to insert status change notification:', err);
            }

            // Trigger notification modal if shipped
            if (newStatus === 'Shipped') {
                if (updatedOrder) setOrderToNotify({ ...updatedOrder, status: 'Shipped', ...extraData });
            }

        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Gagal memperbarui status.", "error");
        }
    };

    const handleFollowUp = async (orderId: string) => {
        // Just update the counter locally and in DB, the WhatsApp link is handled in the component
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            const newCount = (order.followUps || 0) + 1;
            await supabase.from('orders').update({ followUps: newCount }).eq('id', orderId);
            // Invalidate cache after follow-up update
            await invalidateOnOrderChange(orderId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, followUps: newCount } : o));
        } catch (error) {
            console.error("Error updating follow up:", error);
        }
    };

    const handleChangePayment = async (method: string) => {
        if (!orderToChangePayment) return;
        try {
            await supabase.from('orders').update({ paymentMethod: method }).eq('id', orderToChangePayment.id);
            // Invalidate cache after payment method update
            await invalidateOnOrderChange(orderToChangePayment.id);
            setOrders(prev => prev.map(o => o.id === orderToChangePayment.id ? { ...o, paymentMethod: method } : o));
            setOrderToChangePayment(null);
            showToast("Metode pembayaran berhasil diubah.", "success");
        } catch (error) {
            console.error("Error changing payment:", error);
            showToast("Gagal mengubah metode pembayaran.", "error");
        }
    };

    // --- CS Assignment Handlers ---
    const handleOpenAssign = (orderId: string) => {
        setAssignTargetOrderId(orderId);
        setAssignSelectedCsId(csUsers[0]?.id || '');
    };

    const handleCancelAssign = () => {
        setAssignTargetOrderId(null);
        setAssignSelectedCsId('');
    };

    const handleSaveAssign = async (orderId: string) => {
        if (!assignSelectedCsId) {
            showToast('Pilih CS terlebih dahulu.', 'error');
            return;
        }

        try {
            const { error } = await supabase.from('orders').update({ assignedCsId: assignSelectedCsId }).eq('id', orderId);

            // Invalidate cache after CS assignment
            await invalidateOnOrderChange(orderId);
            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, assignedCsId: assignSelectedCsId } : o));
            showToast('CS berhasil ditugaskan.', 'success');
            setAssignTargetOrderId(null);
            setAssignSelectedCsId('');
        } catch (err) {
            console.error('Error assigning CS:', err);
            showToast('Gagal menugaskan CS.', 'error');
        }
    };

    // Export to Excel Function
    const handleExportExcel = () => {
        setIsExporting(true);
        try {
            const dataToExport = filteredOrders.map(order => ({
                'ID Pesanan': order.id,
                'Tanggal': new Date(order.date).toLocaleString('id-ID'),
                'Pelanggan': order.customer,
                'WhatsApp': order.customerPhone,
                'Email': order.customerEmail,
                'Alamat': order.shippingAddress,
                'Produk': order.productName,
                'Harga Produk': order.productPrice,
                'Total': order.totalPrice,
                'Status': order.status,
                'Pembayaran': order.paymentMethod || 'COD',
                'Pengiriman': order.shippingMethod || '-',
                'Resi': order.shippingResi || '-',
                'CS': csUsers.find(u => u.id === order.assignedCsId)?.name || 'Unassigned',
                'Follow Up': order.followUps
            }));

            const csv = [
                Object.keys(dataToExport[0] || {}).join(','),
                ...dataToExport.map(row => Object.values(row).map(v => `"${v}"`).join(','))
            ].join('\\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `pesanan_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            showToast('Data berhasil diekspor!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Gagal mengekspor data', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    // Bulk Delete - All users must create deletion request for review
    const handleBulkDelete = async () => {
        if (selectedOrders.size === 0 || !currentUser) return;

        try {
            // All users (including Super Admin) must create deletion request
            const deletionRequests = Array.from(selectedOrders).map(orderId => {
                const order = orders.find(o => o.id === orderId);
                if (!order) return null;

                return {
                    orderId: order.id,
                    orderNumber: order.id.substring(0, 8),
                    customerName: order.customer,
                    customerPhone: order.customerPhone,
                    totalPrice: order.totalPrice,
                    requestedBy: currentUser.name,
                    requestedByEmail: currentUser.email,
                    reason: 'Bulk deletion request',
                    status: 'pending'
                };
            }).filter(Boolean);

            const { error: insertError } = await supabase
                .from('pending_deletions')
                .insert(deletionRequests);

            if (insertError) throw insertError;

            showToast(`${selectedOrders.size} permintaan hapus berhasil dibuat. Menunggu review di Permintaan Hapus.`, 'success');

            // Refresh pending deletions count
            const { count } = await supabase
                .from('pending_deletions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (count !== null) setPendingDeletionsCount(count);

            setSelectedOrders(new Set());

        } catch (error) {
            console.error('Bulk delete error:', error);
            showToast('Gagal menghapus pesanan', 'error');
        }
    };

    const openDeleteConfirmation = (order: Order) => {
        setOrderToDelete(order);
    };

    const confirmDeleteOrder = async () => {
        if (!orderToDelete || !currentUser) return;

        // Check permission to delete order
        if (!canUseFeature('delete_order', getNormalizedRole(currentUser.role))) {
            showToast("Anda tidak memiliki izin untuk menghapus pesanan.", "error");
            setOrderToDelete(null);
            return;
        }

        try {
            // All users (including Super Admin) must create deletion request for review
            const { error: insertError } = await supabase
                .from('pending_deletions')
                .insert({
                    orderId: orderToDelete.id,
                    orderNumber: orderToDelete.id.substring(0, 8),
                    customerName: orderToDelete.customer,
                    customerPhone: orderToDelete.customerPhone,
                    totalPrice: orderToDelete.totalPrice,
                    requestedBy: currentUser.name,
                    requestedByEmail: currentUser.email,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            showToast('Permintaan hapus pesanan berhasil dibuat. Menunggu review di Permintaan Hapus.', 'success');

            // Refresh pending deletions count
            const { count } = await supabase
                .from('pending_deletions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (count !== null) setPendingDeletionsCount(count);

            setOrderToDelete(null);

        } catch (error) {
            console.error('Error deleting order:', error);
            showToast('Gagal menghapus pesanan', 'error');
        }
    };



    // --- Filtering Logic ---
    const statusCounts = useMemo(() => {
        const baseOrders = filterDataByBrand<Order>(orders, currentUser);

        const counts: Record<string, number> = {
            All: baseOrders.length,
            Pending: 0,
            Processing: 0,
            Shipped: 0,
            Delivered: 0,
            Canceled: 0
        };

        baseOrders.forEach(order => {
            const statusKey = order.status;
            if (counts[statusKey] !== undefined) {
                counts[statusKey]++;
            }
        });

        return counts;
    }, [orders, currentUser]);

    const filteredOrders = useMemo(() => {
        // 1. Brand Filter
        let result = filterDataByBrand<Order>(orders, currentUser);

        // 2. Status Filter
        if (activeStatusFilter.size > 0) {
            result = result.filter(o => activeStatusFilter.has(o.status));
        }

        // 3. Brand Filter
        if (selectedBrandFilter !== 'all') {
            result = result.filter(o => o.brandId === selectedBrandFilter);
        }

        // 4. Product Filter
        if (selectedProductFilter !== 'all') {
            result = result.filter(o => o.productName === selectedProductFilter);
        }

        // 5. Payment Filter
        if (selectedPaymentFilter.size > 0) {
            result = result.filter(o => o.paymentMethod && selectedPaymentFilter.has(o.paymentMethod));
        }

        // 6. Date Range
        if (dateRange.startDate && dateRange.endDate) {
            // Create start and end dates in UTC to avoid timezone mismatch
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(23, 59, 59, 999);
            result = result.filter(o => {
                const d = new Date(o.date);
                return d >= start && d <= end;
            });
        }

        // 7. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.customer.toLowerCase().includes(lower) ||
                o.id.toLowerCase().includes(lower) ||
                o.customerPhone.includes(lower)
            );
        }

        return result;
    }, [orders, activeStatusFilter, searchTerm, dateRange, selectedBrandFilter, selectedProductFilter, selectedPaymentFilter, currentUser]);

    // Statistics Cards Data
    const stats = useMemo(() => {
        const filtered = filterDataByBrand<Order>(orders, currentUser).filter(o => o.status !== 'Pending Deletion');

        return {
            totalOrders: filtered.length,
            totalRevenue: filtered.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
            pendingCount: filtered.filter(o => o.status === 'Pending').length,
            processingCount: filtered.filter(o => o.status === 'Processing').length,
            shippedCount: filtered.filter(o => o.status === 'Shipped').length,
            deliveredCount: filtered.filter(o => o.status === 'Delivered').length,
            canceledCount: filtered.filter(o => o.status === 'Canceled').length,
        };
    }, [orders, currentUser]);

    // Get unique brands for filter (with brand name lookup)
    const uniqueBrands = useMemo(() => {
        const brandIds = new Set<string>();
        orders.forEach(o => {
            if (o.brandId) brandIds.add(o.brandId);
        });
        // Return array with names from brands state
        return Array.from(brandIds).map(id => {
            const brandObj = brands.find(b => b.id === id);
            return {
                id,
                name: brandObj?.name || id
            };
        });
    }, [orders, brands]);

    // Get unique products for filter
    const uniqueProducts = useMemo(() => {
        const products = new Set<string>();
        orders.forEach(o => {
            if (o.productName) products.add(o.productName);
        });
        return Array.from(products).sort();
    }, [orders]);

    // Get unique payment methods for filter
    const uniquePaymentMethods = useMemo(() => {
        const methods = new Set<string>();
        orders.forEach(o => {
            if (o.paymentMethod) methods.add(o.paymentMethod);
        });
        return Array.from(methods);
    }, [orders]);

    // --- Pagination State ---
    const [pageSize, setPageSize] = useState<number>(PAGE_SIZES.MEDIUM); // default 25 per page
    const [page, setPage] = useState<number>(1);

    // Reset to first page when filters/search/pageSize change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, activeStatusFilter, dateRange, pageSize, orders]);

    const paginationResult = useMemo(() => {
        if (!filteredOrders || filteredOrders.length === 0) {
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
        const effectivePageSize = pageSize === 0 ? Math.max(1, filteredOrders.length) : pageSize;
        return paginateArray(filteredOrders, page, effectivePageSize);
    }, [filteredOrders, page, pageSize]);

    const paginatedOrders = paginationResult.data;
    const totalPages = paginationResult.totalPages;

    // Toggle Select All (defined after paginatedOrders)
    const handleToggleSelectAll = () => {
        if (selectedOrders.size === paginatedOrders.length) {
            setSelectedOrders(new Set());
        } else {
            setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
        }
    };

    // Toggle Individual Selection
    const handleToggleSelect = (orderId: string) => {
        const newSet = new Set(selectedOrders);
        if (newSet.has(orderId)) {
            newSet.delete(orderId);
        } else {
            newSet.add(orderId);
        }
        setSelectedOrders(newSet);
    };


    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-4 rounded-xl border border-indigo-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Daftar Pesanan</h1>
                    </div>
                    <p className="ml-12 text-sm text-slate-600 dark:text-slate-400">Kelola semua pesanan masuk, proses, dan pengiriman.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setOrderSoundEnabled(prev => !prev)}
                            className={`flex items-center justify-center w-10 h-10 rounded-lg shadow-md transition-all ${orderSoundEnabled ? 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                            title="Toggle notifikasi suara pesanan"
                        >
                            <span className="text-lg">{orderSoundEnabled ? '🔔' : '🔕'}</span>
                        </button>
                        {/* Import Orders Button */}
                        {currentUser && canUseFeature('manual_order_creation', getNormalizedRole(currentUser.role)) && (
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all h-10"
                                title="Import Pesanan dari CSV"
                            >
                                <UploadIcon className="w-4 h-4" />
                                <span>Import</span>
                            </button>
                        )}
                        {currentUser && canUseFeature('manual_order_creation', getNormalizedRole(currentUser.role)) && (
                            <button onClick={() => setIsManualOrderModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all h-10">
                                <PlusIcon className="w-4 h-4" />
                                <span>Pesanan</span>
                            </button>
                        )}
                        {/* Pending Deletions Button - Only for Admin/Super Admin */}
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                            <Link to="/pengaturan/permintaan-hapus" className="relative flex items-center justify-center w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all" title="Permintaan Hapus">
                                <TrashIcon className="w-4 h-4" />
                                {pendingDeletionsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                                        {pendingDeletionsCount}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <ShoppingCartIcon className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold">{stats.totalOrders}</span>
                    </div>
                    <h3 className="text-sm font-medium text-blue-100 mt-2">Total Pesanan</h3>
                    <p className="text-xs text-blue-200">Semua status</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <BanknotesIcon className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold">Rp {(stats.totalRevenue / 1000000).toFixed(1)}M</span>
                    </div>
                    <h3 className="text-sm font-medium text-green-100 mt-2">Total Omzet</h3>
                    <p className="text-xs text-green-200">Revenue keseluruhan</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <span className="text-2xl font-bold">{stats.pendingCount}</span>
                    </div>
                    <h3 className="text-sm font-medium text-amber-100 mt-2">Pending</h3>
                    <p className="text-xs text-amber-200">Menunggu diproses</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <span className="text-2xl font-bold">{stats.deliveredCount}</span>
                    </div>
                    <h3 className="text-sm font-medium text-purple-100 mt-2">Delivered</h3>
                    <p className="text-xs text-purple-200">Pesanan selesai</p>
                </div>
            </div>

            {/* --- Filter & Search Section --- */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari ID, Nama, atau No. WA..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Brand Filter */}
                    <div className="relative brand-dropdown">
                        <button
                            onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[140px]"
                        >
                            <span className="flex-1 text-left truncate">
                                {selectedBrandFilter === 'all' ? 'Brand' : uniqueBrands.find(b => b.id === selectedBrandFilter)?.name || selectedBrandFilter}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                        {brandDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedBrandFilter('all');
                                            setBrandDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedBrandFilter === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                    >
                                        Semua Brand
                                    </button>
                                    {uniqueBrands.map(brand => (
                                        <button
                                            key={brand.id}
                                            onClick={() => {
                                                setSelectedBrandFilter(brand.id);
                                                setBrandDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedBrandFilter === brand.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                        >
                                            {brand.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Filter */}
                    <div className="relative product-dropdown">
                        <button
                            onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[160px]"
                        >
                            <span className="flex-1 text-left truncate">
                                {selectedProductFilter === 'all' ? 'Produk' : selectedProductFilter}
                            </span>
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                        {productDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedProductFilter('all');
                                            setProductDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedProductFilter === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                    >
                                        Semua Produk
                                    </button>
                                    {uniqueProducts.map(product => (
                                        <button
                                            key={product}
                                            onClick={() => {
                                                setSelectedProductFilter(product);
                                                setProductDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm truncate ${selectedProductFilter === product ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                                            title={product}
                                        >
                                            {product}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method Multi-Select */}
                    <div className="relative payment-dropdown">
                        <button
                            onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[160px]"
                        >
                            <span className="flex-1 text-left">
                                {selectedPaymentFilter.size === 0 ? 'Metode Bayar' : `${selectedPaymentFilter.size} dipilih`}
                            </span>
                            <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        {paymentDropdownOpen && (
                            <div className="absolute top-full mt-1 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    {uniquePaymentMethods.map(method => (
                                        <label key={method} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedPaymentFilter.has(method)}
                                                onChange={(e) => {
                                                    const newSet = new Set(selectedPaymentFilter);
                                                    if (e.target.checked) {
                                                        newSet.add(method);
                                                    } else {
                                                        newSet.delete(method);
                                                    }
                                                    setSelectedPaymentFilter(newSet);
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm">{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Multi-Select */}
                    <div className="relative status-dropdown">
                        <button
                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 min-w-[140px]"
                        >
                            <span className="flex-1 text-left">
                                {activeStatusFilter.size === 0 ? 'Status' : `${activeStatusFilter.size} dipilih`}
                            </span>
                            <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        {statusDropdownOpen && (
                            <div className="absolute top-full mt-1 right-0 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    {TABS.filter(s => s !== 'All').map(status => (
                                        <label key={status} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={activeStatusFilter.has(status as OrderStatus)}
                                                onChange={(e) => {
                                                    const newSet = new Set(activeStatusFilter);
                                                    if (e.target.checked) {
                                                        newSet.add(status as OrderStatus);
                                                    } else {
                                                        newSet.delete(status as OrderStatus);
                                                    }
                                                    setActiveStatusFilter(newSet);
                                                }}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-sm">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Deletions Alert */}
            {pendingDeletionsCount > 0 && (currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-500 rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                <TrashIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                                    Ada {pendingDeletionsCount} pesanan menunggu konfirmasi hapus
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-300">Tinjau dan proses permintaan penghapusan</p>
                            </div>
                        </div>
                        <Link
                            to="/pengaturan/permintaan-hapus"
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            Lihat Permintaan
                            <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            )}

            {/* Bulk Actions Toolbar */}
            {selectedOrders.size > 0 && (
                <div className="bg-indigo-600 text-white rounded-2xl shadow-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-semibold">{selectedOrders.size} pesanan terpilih</span>
                            <button
                                onClick={() => setSelectedOrders(new Set())}
                                className="text-sm underline hover:no-underline"
                            >
                                Batal Pilihan
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Hapus Terpilih
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                <div className="min-w-[700px] md:min-w-0">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <SpinnerIcon className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat data pesanan...</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Settings Bar */}
                            <div className="flex justify-end mb-4 px-2">
                                <button
                                    onClick={() => setIsColumnVisibilityModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                                    title="Atur tampilan kolom"
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                    Tampilan Kolom
                                </button>
                            </div>

                            {/* Table */}
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/30 border-b-2 border-indigo-100 dark:border-indigo-900/30">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                                                onChange={handleToggleSelectAll}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                        </th>
                                        {columnVisibility.find(c => c.key === 'orderId')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Order ID & Tanggal</th>}
                                        {columnVisibility.find(c => c.key === 'customer')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pelanggan</th>}
                                        {columnVisibility.find(c => c.key === 'product')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Produk & Total</th>}
                                        {columnVisibility.find(c => c.key === 'status')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status & Pembayaran</th>}
                                        {columnVisibility.find(c => c.key === 'platform')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Platform</th>}
                                        {columnVisibility.find(c => c.key === 'cs')?.visible && currentUser?.role !== 'Customer service' && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CS</th>}
                                        {columnVisibility.find(c => c.key === 'followUp')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">Follow Up</th>}
                                        {columnVisibility.find(c => c.key === 'actions')?.visible && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {paginatedOrders.map(order => {
                                        // Find CS info if viewing as admin
                                        const assignedCS = csUsers.find(u => u.id === order.assignedCsId);

                                        return (
                                            <tr key={order.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-700/30 transition-all group border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                                                <td className="px-6 py-5 align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrders.has(order.id)}
                                                        onChange={() => handleToggleSelect(order.id)}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                    />
                                                </td>
                                                {columnVisibility.find(c => c.key === 'orderId')?.visible && (
                                                    <td className="px-6 py-5 align-top">
                                                        <div className="flex flex-col">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setIsDetailModalOpen(true);
                                                                }}
                                                                className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base mb-1 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer text-left hover:underline"
                                                            >
                                                                #{order.id.substring(0, 8)}
                                                            </button>
                                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                                <CalendarIcon className="w-4 h-4" /> {new Date(order.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {new Date(order.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'customer')?.visible && (
                                                    <td className="px-6 py-5 align-top">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900 dark:text-white text-base mb-1">{capitalizeWords(order.customer)}</span>
                                                            <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                                                <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
                                                                {order.customerPhone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'product')?.visible && (
                                                    <td className="px-6 py-5 align-top">
                                                        <div className="max-w-xs">
                                                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-1" title={order.productName}>{order.productName}</p>
                                                            <p className="font-bold text-slate-900 dark:text-white">Rp {order.totalPrice?.toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'status')?.visible && (
                                                    <td className="px-6 py-5 align-top">
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <StatusBadge status={order.status} />
                                                            <button
                                                                onClick={() => setOrderToChangePayment(order)}
                                                                className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 transition-colors"
                                                            >
                                                                <CreditCardIcon className="w-3 h-3" />
                                                                {order.paymentMethod || 'COD'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'platform')?.visible && (
                                                    <td className="px-6 py-5 align-top">
                                                        <div className="flex items-center gap-2">
                                                            {order.utmSource ? (
                                                                <>
                                                                    {order.utmSource.toLowerCase() === 'meta' && (
                                                                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                                                            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                                                            Meta
                                                                        </div>
                                                                    )}
                                                                    {order.utmSource.toLowerCase() === 'tiktok' && (
                                                                        <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/10 dark:bg-slate-700 text-slate-900 dark:text-slate-200 rounded text-xs font-medium">
                                                                            <div className="w-4 h-4 bg-slate-900 dark:bg-slate-300 rounded-full"></div>
                                                                            TikTok
                                                                        </div>
                                                                    )}
                                                                    {order.utmSource.toLowerCase() === 'google' && (
                                                                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                                                                            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                                                            Google
                                                                        </div>
                                                                    )}
                                                                    {order.utmSource.toLowerCase() === 'snack' && (
                                                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                                                            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                                                                            Snack
                                                                        </div>
                                                                    )}
                                                                    {!['meta', 'tiktok', 'google', 'snack'].includes(order.utmSource.toLowerCase()) && (
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">{order.utmSource}</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'cs')?.visible && currentUser?.role !== 'Customer service' && (
                                                    <td className="px-6 py-5 align-top">
                                                        {assignedCS ? (
                                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                                                                    {assignedCS.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="truncate max-w-[80px]">{assignedCS.name.split(' ')[0]}</span>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                {assignTargetOrderId === order.id ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <select value={assignSelectedCsId} onChange={e => setAssignSelectedCsId(e.target.value)} className="p-1 border rounded bg-white dark:bg-slate-800 text-sm">
                                                                            <option value="">Pilih CS...</option>
                                                                            {csUsers.map(cs => (
                                                                                <option key={cs.id} value={cs.id}>{cs.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <button onClick={() => handleSaveAssign(order.id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Simpan</button>
                                                                        <button onClick={handleCancelAssign} className="px-2 py-1 border rounded text-sm">Batal</button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                                                                        <button onClick={() => handleOpenAssign(order.id)} className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">Assign</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'followUp')?.visible && (
                                                    <td className="px-6 py-5 align-middle">
                                                        <div className="flex justify-center">
                                                            <FollowUpIndicator order={order} onFollowUp={handleFollowUp} templates={templates} />
                                                        </div>
                                                    </td>
                                                )}
                                                {columnVisibility.find(c => c.key === 'actions')?.visible && (
                                                    <td className="px-6 py-5 align-middle text-right">
                                                        <div className="relative flex items-center justify-end">
                                                            <button
                                                                onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                                                                className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                                title="Aksi"
                                                            >
                                                                <DotsHorizontalIcon className="w-5 h-5" />
                                                            </button>

                                                            {openDropdownId === order.id && (
                                                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedOrder(order);
                                                                            setIsDetailModalOpen(true);
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                    >
                                                                        <EyeIcon className="w-5 h-5 text-indigo-600" />
                                                                        <span>Detail</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedOrder(order);
                                                                            setIsManualOrderModalOpen(true);
                                                                            setOpenDropdownId(null);
                                                                        }}
                                                                        className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                    >
                                                                        <PencilIcon className="w-5 h-5 text-slate-600" />
                                                                        <span>Edit</span>
                                                                    </button>

                                                                    {order.status === 'Pending' && currentUser && canUseFeature('change_order_status', getNormalizedRole(currentUser.role)) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setOrderToProcess(order);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                        >
                                                                            <PlayIcon className="w-5 h-5 text-blue-600" />
                                                                            <span>Proses</span>
                                                                        </button>
                                                                    )}

                                                                    {order.status === 'Processing' && currentUser && canUseFeature('change_order_status', getNormalizedRole(currentUser.role)) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setOrderToShip(order);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                        >
                                                                            <ShipIcon className="w-5 h-5 text-cyan-600" />
                                                                            <span>Kirim (Input Resi)</span>
                                                                        </button>
                                                                    )}

                                                                    {order.status === 'Shipped' && currentUser && canUseFeature('change_order_status', getNormalizedRole(currentUser.role)) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                handleUpdateStatus(order.id, 'Delivered');
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                        >
                                                                            <CheckCircleFilledIcon className="w-5 h-5 text-green-600" />
                                                                            <span>Selesai (Delivered)</span>
                                                                        </button>
                                                                    )}

                                                                    {order.status !== 'Canceled' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setOrderToCancel(order);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                                                                        >
                                                                            <XCircleIcon className="w-5 h-5 text-orange-600" />
                                                                            <span>Batalkan</span>
                                                                        </button>
                                                                    )}

                                                                    <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>

                                                                    {currentUser && canUseFeature('delete_order', getNormalizedRole(currentUser.role)) && (
                                                                        <button
                                                                            onClick={() => {
                                                                                openDeleteConfirmation(order);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                                                                        >
                                                                            <TrashIcon className="w-5 h-5" />
                                                                            <span>Hapus</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>

            {/* Column Visibility Modal */}
            <ColumnVisibilityModal
                isOpen={isColumnVisibilityModalOpen}
                onClose={() => setIsColumnVisibilityModalOpen(false)}
                columns={columnVisibility}
                onSave={saveColumnPreferences}
                isSaving={isSavingColumnPrefs}
            />

            {/* Pagination Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-medium">Jumlah per halaman:</span>
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(parseInt(e.target.value, 10))}
                            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value={PAGE_SIZES.SMALL}>10</option>
                            <option value={PAGE_SIZES.MEDIUM}>25</option>
                            <option value={PAGE_SIZES.LARGE}>50</option>
                            <option value={PAGE_SIZES.EXTRA_LARGE}>100</option>
                            <option value={0}>Semua</option>
                        </select>
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold">Total: {filteredOrders.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>
                        <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold">Halaman {page} / {totalPages}</div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Next</button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Load More
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {isDetailModalOpen && selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={() => { setIsDetailModalOpen(false); setSelectedOrder(null); }} allUsers={allUsers} csAgents={csAgents} brands={brands} products={products} />
            )}

            {isManualOrderModalOpen && (
                <ManualOrderModal
                    forms={forms}
                    csUsers={csUsers}
                    currentUser={currentUser}
                    editOrder={selectedOrder}
                    onClose={() => {
                        setIsManualOrderModalOpen(false);
                        setSelectedOrder(null);
                    }}
                    onSave={handleSaveManualOrder}
                />
            )}

            {orderToProcess && (
                <ConfirmProcessModal
                    orderToAction={orderToProcess}
                    onClose={() => setOrderToProcess(null)}
                    onConfirm={() => handleUpdateStatus(orderToProcess.id, 'Processing')}
                    isVerification={orderToProcess.paymentMethod !== 'Bayar di Tempat (COD)'}
                />
            )}

            {orderToShip && (
                <ResiInputModal
                    orderToAction={orderToShip}
                    onClose={() => setOrderToShip(null)}
                    onSave={(resi) => handleUpdateStatus(orderToShip.id, 'Shipped', { shippingResi: resi })}
                />
            )}

            {orderToNotify && (
                <ShippingNotificationModal
                    order={orderToNotify}
                    templates={templates}
                    onClose={() => setOrderToNotify(null)}
                />
            )}

            {orderToChangePayment && (
                <ChangePaymentMethodModal
                    order={orderToChangePayment}
                    onClose={() => setOrderToChangePayment(null)}
                    onSave={handleChangePayment}
                />
            )}

            {orderToDelete && (
                <ConfirmationModal
                    isOpen={!!orderToDelete}
                    title="Pindahkan ke Sampah"
                    message={`Apakah Anda yakin ingin memindahkan pesanan #${orderToDelete.id.substring(0, 8)} ke sampah?`}
                    confirmLabel="Ya, Pindahkan"
                    cancelLabel="Batal"
                    variant="danger"
                    onConfirm={confirmDeleteOrder}
                    onClose={() => setOrderToDelete(null)}
                />
            )}

            {orderToCancel && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setOrderToCancel(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Konfirmasi Pembatalan Pesanan</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-700 dark:text-slate-300">
                                Apakah Anda yakin ingin membatalkan pesanan <span className="font-semibold">#{orderToCancel.id.substring(0, 8)}</span>?
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Alasan Pembatalan <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={cancellationReason}
                                    onChange={(e) => setCancellationReason(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Pilih alasan pembatalan...</option>
                                    {cancellationReasons.map((reason) => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-slate-700 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setOrderToCancel(null);
                                    setCancellationReason('');
                                }}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={!cancellationReason}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Konfirmasi Batalkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Orders Modal */}
            <ImportOrdersModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportSuccess={() => {
                    invalidateCache(CACHE_KEYS.ORDERS);
                    fetchOrders();
                }}
                forms={forms}
                csAgents={csAgents}
            />

        </div>
    );
};

// --- Sub Components Definition ---

const FollowUpIndicator: React.FC<{
    order: Order;
    onFollowUp: (orderId: string) => void;
    templates: MessageTemplates | null;
}> = ({ order, onFollowUp, templates }) => {
    const { id, followUps, status, customerPhone } = order;
    const totalFollowUps = 5;
    const isActionable = status === 'Pending' || status === 'Processing';

    return (
        <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalFollowUps }).map((_, i) => {
                const followUpNumber = i + 1;
                const isCompleted = followUpNumber <= (followUps || 0);
                const isNext = followUpNumber === (followUps || 0) + 1;

                const handleClick = async () => {
                    const waNumber = formatWaNumber(customerPhone);
                    if (!waNumber) return;

                    const followUpTemplateKey = `followUp${followUpNumber}` as keyof MessageTemplates;
                    let messageTemplate = templates?.[followUpTemplateKey] || `Halo [CUSTOMER_NAME], ini follow up ke-${followUpNumber} untuk pesanan Anda dengan ID [ORDER_ID].`;

                    const message = messageTemplate
                        .replace(/\[CUSTOMER_NAME\]/g, capitalizeWords(order.customer))
                        .replace(/\[ORDER_ID\]/g, order.id)
                        .replace(/\[PRODUCT_NAME\]/g, order.productName)
                        .replace(/\[TOTAL_PRICE\]/g, `Rp ${order.totalPrice?.toLocaleString('id-ID') || '0'}`);

                    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');

                    if (isNext && isActionable) {
                        onFollowUp(id);
                    }
                };

                let bgClass = 'bg-slate-100 dark:bg-slate-700 text-slate-400';
                if (isCompleted) bgClass = 'bg-green-500 text-white shadow-md ring-2 ring-green-200 dark:ring-green-900';
                else if (isNext && isActionable) bgClass = 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-lg';

                return (
                    <button
                        key={followUpNumber}
                        onClick={handleClick}
                        disabled={(!isNext && !isCompleted) || !customerPhone}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${bgClass} ${isNext && isActionable ? 'hover:scale-110 cursor-pointer' : ''} ${isCompleted ? 'animate-pulse-slow' : ''}`}
                        title={`Follow Up ${followUpNumber} ${isCompleted ? '(Selesai)' : isNext ? '(Berikutnya)' : ''}`}
                    >
                        {isCompleted ? (
                            <span className="inline-flex items-center justify-center">
                                <CheckCircleFilledIcon className="w-5 h-5" />
                            </span>
                        ) : (
                            <span>{followUpNumber}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

const OrderDetailModal: React.FC<{
    order: Order;
    onClose: () => void;
    allUsers: User[];
    csAgents: any[];
    brands: Brand[];
    products: any[];
}> = ({ order, onClose, allUsers, csAgents, brands, products }) => {
    const csInfo = csAgents.find(cs => cs.id === order.assignedCsId);
    const brandInfo = brands.find(b => b.id === order.brandId);
    const advertiserInfo = allUsers.find(u => u.id === order.assignedAdvertiserId);
    const productInfo = products.find(p => p.id === order.productId);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detail Pesanan</h2>
                    <button onClick={onClose} className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-1 transition">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    {/* Order Info */}
                    <div>
                        <h3 className="font-bold text-lg mb-3">Informasi Pesanan</h3>
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                            <div><p className="text-slate-500 text-sm">ID</p><p className="font-mono font-bold">{order.id}</p></div>
                            <div><p className="text-slate-500 text-sm">Tanggal</p><p className="font-medium">{order.date ? new Date(order.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p></div>
                            <div><p className="text-slate-500 text-sm">Status</p><div className="mt-1"><StatusBadge status={order.status} /></div></div>
                            <div>
                                <p className="text-slate-500 text-sm">Metode Bayar</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {order.paymentMethod || 'COD (Bayar di Tempat)'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <h3 className="font-bold text-lg mb-3">Data Pelanggan</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div><p className="text-slate-500 text-sm">Nama</p><p className="font-medium text-slate-900 dark:text-white">{order.customer || '-'}</p></div>
                            <div><p className="text-slate-500 text-sm">WhatsApp</p><p className="font-medium text-slate-900 dark:text-white">{order.customerPhone || '-'}</p></div>
                            {order.customerEmail && <div><p className="text-slate-500 text-sm">Email</p><p className="font-medium text-slate-900 dark:text-white">{order.customerEmail}</p></div>}
                            
                            {/* Address Details - Show grid only if we have separate address fields */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-slate-500 text-sm font-medium mb-2">Alamat Pengiriman</p>
                                
                                {/* Show detailed address grid only if at least one field exists */}
                                {(order.province || order.city || order.district || order.village || order.postalCode) ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {order.province && <div><p className="text-slate-400 text-xs">Provinsi</p><p className="text-slate-900 dark:text-white">{order.province}</p></div>}
                                            {order.city && <div><p className="text-slate-400 text-xs">Kota/Kabupaten</p><p className="text-slate-900 dark:text-white">{order.city}</p></div>}
                                            {order.district && <div><p className="text-slate-400 text-xs">Kecamatan</p><p className="text-slate-900 dark:text-white">{order.district}</p></div>}
                                            {order.village && <div><p className="text-slate-400 text-xs">Kelurahan/Desa</p><p className="text-slate-900 dark:text-white">{order.village}</p></div>}
                                            {order.postalCode && <div><p className="text-slate-400 text-xs">Kode Pos</p><p className="text-slate-900 dark:text-white">{order.postalCode}</p></div>}
                                        </div>
                                        {order.shippingAddress && (
                                            <div>
                                                <p className="text-slate-400 text-xs">Detail Alamat</p>
                                                <p className="text-slate-900 dark:text-white">{order.shippingAddress}</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Fallback: Show full address string for legacy orders */
                                    <p className="text-slate-900 dark:text-white">{order.shippingAddress || '-'}</p>
                                )}
                            </div>
                            
                            {order.shippingMethod && (
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-500 text-sm">Metode Pengiriman</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{order.shippingMethod}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tracking */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <h3 className="font-bold text-lg mb-3">Pelacakan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg"><p className="text-slate-500 text-sm">Merek</p><p className="font-semibold">{brandInfo?.name || order.brandId || '-'}</p></div>
                            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                <p className="text-slate-500 text-sm">CS Ditugaskan</p>
                                <p className="font-semibold">{csInfo?.name || order.assignedCsId || '-'}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg"><p className="text-slate-500 text-sm">Advertiser</p><p className="font-semibold">{advertiserInfo?.name || order.assignedAdvertiserId || '-'}</p></div>
                            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg"><p className="text-slate-500 text-sm">Produk</p><p className="font-semibold">{productInfo?.name || order.productName || '-'}</p></div>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <h3 className="font-bold text-lg mb-3">Produk</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div><p className="text-slate-500 text-sm">Nama Produk</p><p className="font-medium text-slate-900 dark:text-white">{order.productName || '-'}</p></div>
                            {order.variant && <div><p className="text-slate-500 text-sm">Varian</p><p className="text-slate-900 dark:text-white">{order.variant}</p></div>}
                            <div><p className="text-slate-500 text-sm">Jumlah</p><p className="text-slate-900 dark:text-white">{order.quantity || 1}</p></div>
                            {order.notes && <div><p className="text-slate-500 text-sm">Catatan</p><p className="text-slate-900 dark:text-white">{order.notes}</p></div>}
                        </div>
                    </div>

                    {/* Pricing & Shipping */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <h3 className="font-bold text-lg mb-3">Rincian Pembayaran</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <p className="text-slate-500 text-sm">Harga Produk</p>
                                <p className="font-medium text-slate-900 dark:text-white">Rp {(order.productPrice || 0).toLocaleString('id-ID')}</p>
                            </div>
                            
                            {/* Shipping */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-slate-500 text-sm">Pengiriman</p>
                                    <p className="text-xs text-slate-400">{order.shippingMethod || 'Regular'}</p>
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white">Rp {(order.shippingCost || 0).toLocaleString('id-ID')}</p>
                            </div>
                            
                            {/* COD Fee */}
                            {order.codFee !== undefined && order.codFee > 0 && (
                                <div className="flex justify-between items-center">
                                    <p className="text-slate-500 text-sm">Biaya Penanganan COD</p>
                                    <p className="font-medium text-orange-600">Rp {order.codFee.toLocaleString('id-ID')}</p>
                                </div>
                            )}
                            
                            {/* Total */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <p className="font-bold text-slate-900 dark:text-white">Total</p>
                                <p className="text-2xl font-bold text-indigo-600">Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>

                    {order.status === 'Canceled' && order.cancellationReason && (
                        <div className="border-t dark:border-slate-700 pt-6">
                            <h3 className="font-bold text-lg mb-3">Alasan Pembatalan</h3>
                            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg"><p className="font-semibold text-red-900">{order.cancellationReason}</p></div>
                        </div>
                    )}

                    {(order.status === 'Shipped' || order.status === 'Delivered') && order.shippingResi && (
                        <div className="border-t dark:border-slate-700 pt-6">
                            <h3 className="font-bold text-lg mb-3">Nomor Resi</h3>
                            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg"><p className="font-mono font-bold text-lg">{order.shippingResi}</p></div>
                        </div>
                    )}

                    {(order.csCommission || order.advCommission) && (
                        <div className="border-t dark:border-slate-700 pt-6">
                            <h3 className="font-bold text-lg mb-3">Komisi</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.csCommission !== undefined && (
                                    <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg"><p className="text-slate-500 text-sm">Komisi CS</p><p className="font-bold text-orange-700">Rp {order.csCommission?.toLocaleString('id-ID')}</p></div>
                                )}
                                {order.advCommission !== undefined && (
                                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg"><p className="text-slate-500 text-sm">Komisi Advertiser</p><p className="font-bold text-yellow-700">Rp {order.advCommission?.toLocaleString('id-ID')}</p></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManualOrderModal: React.FC<{
    forms: Form[];
    csUsers: User[];
    currentUser: User | null;
    editOrder?: Order | null;
    onClose: () => void;
    onSave: (o: Omit<Order, 'id'>) => void
}> = ({ forms, csUsers, currentUser, editOrder, onClose, onSave }) => {
    const [selectedFormId, setSelectedFormId] = useState(editOrder?.formId || forms[0]?.id || '');
    const [customerData, setCustomerData] = useState({
        name: editOrder?.customer || '',
        phone: editOrder?.customerPhone || '',
        email: editOrder?.customerEmail || '',
        address: editOrder?.shippingAddress || ''
    });
    const [addressData, setAddressData] = useState<AddressData>({
        province: editOrder?.province || '',
        city: editOrder?.city || '',
        district: editOrder?.district || '',
        village: editOrder?.village || '',
        postalCode: editOrder?.postalCode || '',
        detailAddress: editOrder?.shippingAddress || '',
        fullAddress: editOrder?.shippingAddress || ''
    });
    const [orderTotal, setOrderTotal] = useState<number>(editOrder?.totalPrice || 0);
    const [productPrice, setProductPrice] = useState<number>(editOrder?.productPrice || 0);
    const [shippingCost, setShippingCost] = useState<number>(editOrder?.shippingCost || 0);
    const [codFee, setCodFee] = useState<number>(editOrder?.codFee || 0);
    const [shippingMethod, setShippingMethod] = useState<string>(editOrder?.shippingMethod || 'Regular');
    const [paymentMethod, setPaymentMethod] = useState<string>(editOrder?.paymentMethod || 'Bayar di Tempat (COD)');
    const [selectedCsId, setSelectedCsId] = useState<string>(editOrder?.assignedCsId || '');
    const [notes, setNotes] = useState<string>(editOrder?.notes || '');
    const [variant, setVariant] = useState<string>(editOrder?.variant || '');
    const [quantity, setQuantity] = useState<number>(editOrder?.quantity || 1);

    // Update state when editOrder changes (when opening modal for edit)
    useEffect(() => {
        if (editOrder) {
            setSelectedFormId(editOrder.formId || forms[0]?.id || '');
            setCustomerData({
                name: editOrder.customer || '',
                phone: editOrder.customerPhone || '',
                email: editOrder.customerEmail || '',
                address: editOrder.shippingAddress || ''
            });
            // Set address data from separate fields
            setAddressData({
                province: editOrder.province || '',
                city: editOrder.city || '',
                district: editOrder.district || '',
                village: editOrder.village || '',
                postalCode: editOrder.postalCode || '',
                detailAddress: editOrder.shippingAddress || '',
                fullAddress: editOrder.shippingAddress || ''
            });
            setOrderTotal(editOrder.totalPrice || 0);
            setProductPrice(editOrder.productPrice || 0);
            setShippingCost(editOrder.shippingCost || 0);
            setCodFee(editOrder.codFee || 0);
            setShippingMethod(editOrder.shippingMethod || 'Regular');
            setPaymentMethod(editOrder.paymentMethod || 'Bayar di Tempat (COD)');
            setSelectedCsId(editOrder.assignedCsId || '');
            setNotes(editOrder.notes || '');
            setVariant(editOrder.variant || '');
            setQuantity(editOrder.quantity || 1);
        } else {
            // Reset when creating new order
            setSelectedFormId(forms[0]?.id || '');
            setCustomerData({ name: '', phone: '', email: '', address: '' });
            setAddressData({
                province: '',
                city: '',
                district: '',
                village: '',
                postalCode: '',
                detailAddress: '',
                fullAddress: ''
            });
            setOrderTotal(0);
            setProductPrice(0);
            setShippingCost(0);
            setCodFee(0);
            setShippingMethod('Regular');
            setPaymentMethod('Bayar di Tempat (COD)');
            setSelectedCsId('');
            setNotes('');
            setVariant('');
            setQuantity(1);
        }
    }, [editOrder, forms]);

    // Pre-select CS if user is CS
    useEffect(() => {
        if (currentUser && currentUser.role === 'Customer service' && !editOrder) {
            setSelectedCsId(currentUser.id);
        }
    }, [currentUser, editOrder]);

    // Update customerData.address when addressData changes
    useEffect(() => {
        setCustomerData(prev => ({
            ...prev,
            address: addressData.fullAddress || addressData.detailAddress
        }));
    }, [addressData]);

    // Auto-calculate total
    useEffect(() => {
        setOrderTotal(productPrice + shippingCost + codFee);
    }, [productPrice, shippingCost, codFee]);

    const handleSubmit = () => {
        const form = forms.find(f => f.id === selectedFormId);
        if (!form) return;

        onSave({
            customer: customerData.name,
            customerPhone: customerData.phone,
            customerEmail: customerData.email || '',
            shippingAddress: addressData.detailAddress || customerData.address,
            // Separate address fields
            province: addressData.province || undefined,
            city: addressData.city || undefined,
            district: addressData.district || undefined,
            village: addressData.village || undefined,
            postalCode: addressData.postalCode || undefined,
            productName: form.title,
            productPrice: productPrice,
            shippingMethod: shippingMethod,
            shippingCost: shippingCost,
            codFee: codFee,
            paymentMethod: paymentMethod,
            totalPrice: orderTotal,
            status: editOrder?.status || 'Pending',
            urgency: editOrder?.urgency || 'Low',
            followUps: editOrder?.followUps || 0,
            date: editOrder?.date || new Date().toISOString(),
            formId: form.id,
            formTitle: form.title,
            brandId: form.brandId || '',
            assignedCsId: selectedCsId || undefined,
            notes: notes || undefined,
            variant: variant || undefined,
            quantity: quantity || 1
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl p-6 my-8">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{editOrder ? 'Edit Pesanan' : 'Buat Pesanan Manual'}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kolom Kiri */}
                    <div className="space-y-4">
                        {/* Product/Form Field - Only show when creating new order */}
                        {!editOrder && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Produk (Formulir)</label>
                                <select className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600" value={selectedFormId} onChange={e => setSelectedFormId(e.target.value)}>
                                    {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                                </select>
                            </div>
                        )}

                        {/* CS Assignment Field - Only for Admin */}
                        {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin') && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Tugaskan ke CS</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    value={selectedCsId}
                                    onChange={e => setSelectedCsId(e.target.value)}
                                >
                                    <option value="">Pilih CS...</option>
                                    {csUsers.map(cs => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pelanggan</label>
                            <input
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                placeholder="Nama Pelanggan"
                                value={customerData.name}
                                onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                            <input
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                placeholder="WhatsApp (e.g. 0812...)"
                                value={customerData.phone}
                                onChange={e => setCustomerData({ ...customerData, phone: e.target.value })}
                            />
                        </div>

                        {(() => {
                            const selectedForm = forms.find(f => f.id === selectedFormId);
                            const variants = selectedForm?.variantCombinations || [];

                            // Find matching variant index based on stored variant string
                            const matchingIndex = variants.findIndex((v) => {
                                const variantLabel = Object.entries(v.attributes || {})
                                    .map(([key, val]) => `${key}: ${val}`)
                                    .join(', ');
                                return variant === variantLabel;
                            });

                            const currentValue = matchingIndex >= 0 ? `${matchingIndex}::${variant}` : variant;

                            return (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Variant</label>
                                    {variants.length > 0 ? (
                                        <select
                                            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                            value={currentValue}
                                            onChange={e => {
                                                const selectedIndex = parseInt(e.target.value.split('::')[0]);
                                                const selectedVariant = variants[selectedIndex];
                                                const variantName = e.target.value.split('::')[1] || e.target.value;
                                                setVariant(variantName);
                                                // Auto-update price when variant changes
                                                if (selectedVariant?.sellingPrice) {
                                                    setProductPrice(selectedVariant.sellingPrice * quantity);
                                                }
                                            }}
                                        >
                                            <option value="">Pilih Variant...</option>
                                            {variants.map((v, idx) => {
                                                const variantLabel = Object.entries(v.attributes || {})
                                                    .map(([key, val]) => `${key}: ${val}`)
                                                    .join(', ');
                                                const variantValue = `${idx}::${variantLabel}`;
                                                return (
                                                    <option key={idx} value={variantValue}>
                                                        {variantLabel} - Rp {v.sellingPrice?.toLocaleString('id-ID') || 0}
                                                    </option>
                                                );
                                            })}
                                            {/* Show current variant even if not in list */}
                                            {variant && matchingIndex < 0 && (
                                                <option value={variant}>{variant} (Tidak tersedia)</option>
                                            )}
                                        </select>
                                    ) : (
                                        variant ? (
                                            <input
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                                value={variant}
                                                onChange={e => setVariant(e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 bg-gray-100 dark:bg-gray-900"
                                                placeholder="Tidak ada variant"
                                                value=""
                                                disabled
                                            />
                                        )
                                    )}
                                </div>
                            );
                        })()}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                placeholder="1"
                                value={quantity}
                                onChange={e => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    setQuantity(newQty);
                                    // Auto-calculate total if variant is selected
                                    const selectedForm = forms.find(f => f.id === selectedFormId);
                                    const variants = selectedForm?.variantCombinations || [];
                                    // Try to find variant by checking if current variant matches any variant label
                                    const selectedVariant = variants.find((v, idx) => {
                                        const variantLabel = Object.entries(v.attributes || {})
                                            .map(([key, val]) => `${key}: ${val}`)
                                            .join(', ');
                                        return variant === variantLabel || variant === `${idx}::${variantLabel}`;
                                    });
                                    if (selectedVariant?.sellingPrice) {
                                        setProductPrice(selectedVariant.sellingPrice * newQty);
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Produk</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                                <input
                                    type="number"
                                    className="w-full p-3 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    placeholder="0"
                                    value={productPrice}
                                    onChange={e => setProductPrice(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metode Pengiriman</label>
                                <select
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    value={shippingMethod}
                                    onChange={e => setShippingMethod(e.target.value)}
                                >
                                    <option value="Regular">Regular</option>
                                    <option value="Gratis Ongkir">Gratis Ongkir</option>
                                    <option value="Flat Ongkir Pulau Jawa">Flat Ongkir Pulau Jawa</option>
                                    <option value="Flat Ongkir Pulau Bali">Flat Ongkir Pulau Bali</option>
                                    <option value="Flat Ongkir Pulau Sumatra">Flat Ongkir Pulau Sumatra</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biaya Ongkir</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                                    <input
                                        type="number"
                                        className="w-full p-3 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                        placeholder="0"
                                        value={shippingCost}
                                        onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Metode Pembayaran</label>
                                <select
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="Bayar di Tempat (COD)">Bayar di Tempat (COD)</option>
                                    <option value="QRIS">QRIS</option>
                                    <option value="Transfer Bank">Transfer Bank</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biaya COD</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                                    <input
                                        type="number"
                                        className="w-full p-3 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                        placeholder="0"
                                        value={codFee}
                                        onChange={e => setCodFee(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                            <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Total Harga</label>
                            <p className="text-2xl font-bold text-indigo-600">Rp {orderTotal.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-indigo-500 mt-1">Harga Produk + Ongkir + COD</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan</label>
                            <textarea
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
                                placeholder="Catatan tambahan untuk pesanan ini"
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                            <AddressInput
                                value={addressData}
                                onChange={setAddressData}
                                required={true}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">Batal</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan</button>
                </div>
            </div>
        </div>
    )
};

const ConfirmProcessModal: React.FC<any> = ({ onClose, onConfirm, isVerification }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{isVerification ? 'Verifikasi Pembayaran' : 'Proses Pesanan'}</h3>
            <p className="mb-6 text-slate-600 dark:text-slate-400">Lanjutkan proses pesanan ini?</p>
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg font-medium">Batal</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Ya, Lanjut</button>
            </div>
        </div>
    </div>
);

const ResiInputModal: React.FC<any> = ({ onClose, onSave }) => {
    const [resi, setResi] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full">
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Input Resi</h3>
                <input autoFocus value={resi} onChange={e => setResi(e.target.value)} className="w-full p-3 border rounded-lg mb-6 dark:bg-slate-700 dark:border-slate-600" placeholder="Nomor Resi" />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">Batal</button>
                    <button onClick={() => onSave(resi)} disabled={!resi} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Simpan</button>
                </div>
            </div>
        </div>
    );
};

const ShippingNotificationModal: React.FC<{
    onClose: () => void;
    order: Order;
    templates: MessageTemplates | null;
}> = ({ onClose, order, templates }) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        let template = templates?.shipped || 'Halo [CUSTOMER_NAME], pesanan Anda [ORDER_ID] telah dikirim! Resi: [RESI_NUMBER].';
        const msg = template
            .replace(/\[CUSTOMER_NAME\]/g, capitalizeWords(order.customer))
            .replace(/\[ORDER_ID\]/g, order.id)
            .replace(/\[RESI_NUMBER\]/g, order.shippingResi || '-')
            .replace(/\[PRODUCT_NAME\]/g, order.productName)
            .replace(/\[TOTAL_PRICE\]/g, `Rp ${order.totalPrice?.toLocaleString('id-ID') || '0'}`);
        setMessage(msg);
    }, [order, templates]);

    const handleSend = () => {
        window.open(`https://wa.me/${formatWaNumber(order.customerPhone)}?text=${encodeURIComponent(message)}`, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <WhatsAppIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kirim Notifikasi Resi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pratinjau pesan sebelum dikirim.</p>
                    </div>
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg mb-4 text-sm bg-slate-50 dark:bg-slate-700/50 dark:text-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                />

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium">Nanti</button>
                    <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-500/30">Buka WhatsApp</button>
                </div>
            </div>
        </div>
    );
};

const ChangePaymentMethodModal: React.FC<any> = ({ onClose, onSave }) => {
    const [method, setMethod] = useState('COD');
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Ubah Metode Bayar</h3>
                <select value={method} onChange={e => setMethod(e.target.value)} className="w-full p-3 border rounded-lg mb-6 dark:bg-slate-700 dark:border-slate-600">
                    <option value="Bayar di Tempat (COD)">COD</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                </select>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg">Batal</button>
                    <button onClick={() => onSave(method)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Simpan</button>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
