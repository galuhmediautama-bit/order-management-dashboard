
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
import { supabase } from '../supabase';
import { capitalizeWords, filterDataByBrand, getNormalizedRole } from '../utils';
import DateRangePicker, { type DateRange } from '../components/DateRangePicker';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import AddressInput, { type AddressData } from '../components/AddressInput';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import FilterIcon from '../components/icons/FilterIcon'; 
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { useNotificationCount } from '../contexts/NotificationCountContext';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Assignment state for inline CS assign
    const [assignTargetOrderId, setAssignTargetOrderId] = useState<string | null>(null);
    const [assignSelectedCsId, setAssignSelectedCsId] = useState<string>('');

  // Close dropdowns when clicking outside
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

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. User & Role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
             const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
             if (userDoc) {
                 const role = getNormalizedRole(userDoc.role, user.email);
                 setCurrentUser({ id: user.id, ...userDoc, role } as User);
                 
                 // Fetch pending deletions count for admin
                 if (role === 'Admin' || role === 'Super Admin') {
                     console.log('🔍 Fetching pending deletions for role:', role);
                     const { count, error: pendingError } = await supabase
                         .from('pending_deletions')
                         .select('*', { count: 'exact', head: true })
                         .eq('status', 'pending');
                     console.log('🔍 Pending deletions result:', { count, error: pendingError });
                     if (!pendingError && count !== null) {
                         setPendingDeletionsCount(count);
                         console.log('✅ Set pending deletions count:', count);
                     } else if (pendingError) {
                         console.error('❌ Error fetching pending deletions:', pendingError);
                     }
                 }
             } else {
                 const role = getNormalizedRole(undefined, user.email);
                 setCurrentUser({ id: user.id, role, name: 'Owner', email: user.email || '', status: 'Aktif', lastLogin: '' });
             }
        }

        // 2. Orders (exclude soft-deleted orders)
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .is('deletedAt', null)
            .order('date', { ascending: false });
        
        if (ordersError) throw ordersError;
        
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
        const { data: formsData } = await supabase.from('forms').select('*');
        setForms((formsData || []).map(f => ({ ...f }) as Form));

        // 4. Users (for CS assignment and modal lookups)
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) {
            setAllUsers(usersData as User[]); // Store ALL users
            const cs = usersData.filter((u: any) => getNormalizedRole(u.role) === 'Customer service' && u.status === 'Aktif');
            setCsUsers(cs as User[]);
        }

        // 4.5. CS Agents (for modal lookups - separate table from users)
        const { data: csAgentsData } = await supabase.from('cs_agents').select('*');
        if (csAgentsData) {
            setCsAgents(csAgentsData);
        }

        // 5. Brands (for modal lookups)
        const { data: brandsData } = await supabase.from('brands').select('*');
        if (brandsData) {
            setBrands(brandsData as Brand[]);
        }

        // 6. Products (for modal lookups)
        const { data: productsData } = await supabase.from('products').select('*');
        if (productsData) {
            setProducts(productsData);
        }

        // 7. Templates
        const { data: templatesData } = await supabase.from('settings').select('*').eq('id', 'messageTemplates').single();
        if (templatesData) {
            setTemplates(templatesData as MessageTemplates);
        }

        // 8. Cancellation Reasons
        const { data: cancellationData } = await supabase.from('settings').select('*').eq('id', 'cancellationReasons').single();
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

    } catch (error) {
        console.error("Error fetching data:", error);
        showToast("Gagal memuat data pesanan.", "error");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
        fetchData();
  }, []);

    // --- Lightweight polling for new orders ---
    const playTone = (freq: number) => {
        if (!orderSoundEnabled) return;
        try {
                const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                audioCtxRef.current = ctx;
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                gain.gain.value = 0.2;
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

  const refreshOrdersSilently = useCallback(async () => {
    try {
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .is('deletedAt', null)
            .order('date', { ascending: false });

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
        console.log('[Polling] Previous IDs:', previousIds.size, 'New orders:', newOnes.length);
        if (previousIds.size > 0 && newOnes.length > 0) {
            console.log('[Notification] Showing toast for', newOnes.length, 'new orders');
            showToast(`${newOnes.length} pesanan baru masuk`, 'success');
            playTone(880);
        }

        setOrders(ordersList);
        
        // Update notification count for pending orders
        const pendingCount = (ordersList || []).filter((o: any) => o.status === 'Pending').length;
        setNewOrdersCount(pendingCount);
        
        lastOrderIdsRef.current = new Set(ordersList.map(o => o.id));
    } catch (err) {
        console.error('Silent refresh orders failed:', err);
    }
  }, [showToast, playTone, setNewOrdersCount]);

  useEffect(() => {
    const interval = setInterval(() => {
        refreshOrdersSilently();
    }, 45000); // 45s polling
    return () => clearInterval(interval);
  }, [refreshOrdersSilently]);

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
      try {
          const { error } = await supabase.from('orders').update({ status: newStatus, ...extraData }).eq('id', orderId);
          if (error) throw error;

          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o));
          
          // Close modals if open
          setOrderToProcess(null);
          setOrderToShip(null);
          setOrderToDelete(null);

          showToast(`Status pesanan diperbarui menjadi ${newStatus}.`, "success");

          // Trigger notification modal if shipped
          if (newStatus === 'Shipped') {
              const updatedOrder = orders.find(o => o.id === orderId);
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
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, followUps: newCount } : o));
      } catch (error) {
          console.error("Error updating follow up:", error);
      }
  };

  const handleChangePayment = async (method: string) => {
      if (!orderToChangePayment) return;
      try {
          await supabase.from('orders').update({ paymentMethod: method }).eq('id', orderToChangePayment.id);
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
          start.setUTCHours(0,0,0,0);
          end.setUTCHours(23,59,59,999);
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

  // Get unique brands for filter
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    orders.forEach(o => {
      if (o.brandId) brands.add(o.brandId);
    });
    return Array.from(brands);
  }, [orders]);

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
    const [pageSize, setPageSize] = useState<number>(10); // default 10 per page
    const [page, setPage] = useState<number>(1);

    const pageSizeEffective = pageSize === 0 ? filteredOrders.length || 1 : pageSize;
    const totalPages = Math.max(1, Math.ceil((filteredOrders.length || 0) / pageSizeEffective));

    useEffect(() => {
        // reset to first page when filters/search/pageSize change
        setPage(1);
    }, [searchTerm, activeStatusFilter, dateRange, pageSize, orders]);

    const paginatedOrders = useMemo(() => {
        if (!filteredOrders || filteredOrders.length === 0) return [];
        if (pageSize === 0) return filteredOrders;
        const start = (page - 1) * pageSizeEffective;
        return filteredOrders.slice(start, start + pageSizeEffective);
    }, [filteredOrders, page, pageSize, pageSizeEffective]);

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
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
                        <button
                            onClick={() => setOrderSoundEnabled(prev => !prev)}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold shadow-md transition-all ${orderSoundEnabled ? 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                            title="Toggle notifikasi suara pesanan"
                        >
                            <span>{orderSoundEnabled ? '🔔 Suara ON' : '🔕 Suara OFF'}</span>
                        </button>
            <button 
              onClick={handleExportExcel} 
              disabled={isExporting || filteredOrders.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-md shadow-green-500/20 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                <span>Ekspor CSV</span>
            </button>
            <button onClick={() => setIsManualOrderModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-600 font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all">
                <PlusIcon className="w-4 h-4" />
                <span>Pesanan Manual</span>
            </button>
            {/* Pending Deletions Button - Only for Admin/Super Admin */}
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                <Link to="/pengaturan/permintaan-hapus" className="relative p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all" title="Permintaan Hapus">
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
                      {selectedBrandFilter === 'all' ? 'Brand' : selectedBrandFilter}
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
                            key={brand}
                            onClick={() => {
                              setSelectedBrandFilter(brand);
                              setBrandDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${selectedBrandFilter === brand ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : ''}`}
                          >
                            {brand}
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
              ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-20">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                          <SearchIcon className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tidak ada pesanan ditemukan</h3>
                      <p className="text-slate-500 dark:text-slate-400">Coba ubah filter status atau kata kunci pencarian Anda.</p>
                  </div>
              ) : (
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
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Order ID & Tanggal</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pelanggan</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Produk & Total</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status & Pembayaran</th>
                              {currentUser?.role !== 'Customer service' && <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CS</th>}
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center">Follow Up</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">Aksi</th>
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
                                              <CalendarIcon className="w-4 h-4" /> {new Date(order.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                      <div className="flex flex-col">
                                          <span className="font-semibold text-slate-900 dark:text-white text-base mb-1">{capitalizeWords(order.customer)}</span>
                                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                              <WhatsAppIcon className="w-3.5 h-3.5 text-green-500" />
                                              {order.customerPhone}
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 align-top">
                                      <div className="max-w-xs">
                                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-1" title={order.productName}>{order.productName}</p>
                                          <p className="font-bold text-slate-900 dark:text-white">Rp {order.totalPrice?.toLocaleString('id-ID')}</p>
                                      </div>
                                  </td>
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
                                  {currentUser?.role !== 'Customer service' && (
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
                                  <td className="px-6 py-5 align-middle">
                                      <div className="flex justify-center">
                                          <FollowUpIndicator order={order} onFollowUp={handleFollowUp} templates={templates} />
                                      </div>
                                  </td>
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
                                                  
                                                  {order.status === 'Pending' && (
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
                                                  
                                                  {order.status === 'Processing' && (
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

                                                  {order.status === 'Shipped' && (
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
                                              </div>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          )})}
                      </tbody>
                  </table>
              )}
          </div>
          </div>

          {/* Pagination Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Jumlah per halaman:</span>
                  <select value={pageSize} onChange={e => setPageSize(parseInt(e.target.value, 10))} className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                  </select>
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold">Total: {filteredOrders.length}</span>
              </div>

              <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Prev</button>
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold">Halaman {page} / {totalPages}</div>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Next</button>
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
        const isCompleted = followUpNumber <= followUps;
        const isNext = followUpNumber === followUps + 1;

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
        if (isCompleted) bgClass = 'bg-green-500 text-white';
        else if (isNext && isActionable) bgClass = 'bg-indigo-600 text-white ring-2 ring-indigo-200 dark:ring-indigo-900';

        return (
          <button
            key={followUpNumber}
            onClick={handleClick}
            disabled={(!isNext && !isCompleted) || !customerPhone}
            className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${bgClass} ${isNext && isActionable ? 'hover:scale-110 cursor-pointer' : ''}`}
            title={`Follow Up ${followUpNumber}`}
          >
            {isCompleted ? <CheckCircleFilledIcon className="w-5 h-5" /> : followUpNumber}
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
                            <div><p className="text-slate-500 text-sm">Tanggal</p><p className="font-medium">{order.date}</p></div>
                            <div><p className="text-slate-500 text-sm">Status</p><div className="mt-1"><StatusBadge status={order.status} /></div></div>
                            <div><p className="text-slate-500 text-sm">Metode Bayar</p><p className="font-medium">{order.paymentMethod || '-'}</p></div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="border-t dark:border-slate-700 pt-6">
                        <h3 className="font-bold text-lg mb-3">Data Pelanggan</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg space-y-3">
                            <div><p className="text-slate-500 text-sm">Nama</p><p>{order.customer}</p></div>
                            <div><p className="text-slate-500 text-sm">WhatsApp</p><p>{order.customerPhone}</p></div>
                            {order.customerEmail && <div><p className="text-slate-500 text-sm">Email</p><p>{order.customerEmail}</p></div>}
                            <div><p className="text-slate-500 text-sm">Alamat</p><p>{order.shippingAddress}</p></div>
                            {order.shippingMethod && <div><p className="text-slate-500 text-sm">Metode</p><p>{order.shippingMethod}</p></div>}
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
                            {order.variant && <div><p className="text-slate-500 text-sm">Varian</p><p>{order.variant}</p></div>}
                            {order.quantity && <div><p className="text-slate-500 text-sm">Jumlah</p><p>{order.quantity}</p></div>}
                            {order.notes && <div><p className="text-slate-500 text-sm">Catatan</p><p>{order.notes}</p></div>}
                            <div className="grid grid-cols-2 gap-3">
                                <div><p className="text-slate-500 text-sm">Harga Produk</p><p className="font-semibold">Rp {order.productPrice?.toLocaleString('id-ID')}</p></div>
                                {order.shippingCost !== undefined && (
                                    <div><p className="text-slate-500 text-sm">Biaya Ongkir</p><p className="font-semibold text-blue-600">Rp {order.shippingCost?.toLocaleString('id-ID')}</p></div>
                                )}
                                {order.codFee !== undefined && order.codFee > 0 && (
                                    <div><p className="text-slate-500 text-sm">Biaya COD</p><p className="font-semibold text-orange-600">Rp {order.codFee?.toLocaleString('id-ID')}</p></div>
                                )}
                            </div>
                            <div className="pt-3 border-t"><p className="text-slate-500 text-sm">Total</p><p className="text-2xl font-bold text-indigo-600">Rp {order.totalPrice?.toLocaleString('id-ID')}</p></div>
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
        address: editOrder?.shippingAddress || '' 
    });
    const [addressData, setAddressData] = useState<AddressData>({
        province: '',
        city: '',
        district: '',
        postalCode: '',
        detailAddress: '',
        fullAddress: editOrder?.shippingAddress || ''
    });
    const [orderTotal, setOrderTotal] = useState<number>(editOrder?.totalPrice || 0);
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
                address: editOrder.shippingAddress || ''
            });
            // Set address in detailAddress field so it shows up in AddressInput
            setAddressData({
                province: '',
                city: '',
                district: '',
                postalCode: '',
                detailAddress: editOrder.shippingAddress || '', // Put full address in detail field
                fullAddress: editOrder.shippingAddress || ''
            });
            setOrderTotal(editOrder.totalPrice || 0);
            setSelectedCsId(editOrder.assignedCsId || '');
            setNotes(editOrder.notes || '');
            setVariant(editOrder.variant || '');
            setQuantity(editOrder.quantity || 1);
        } else {
            // Reset when creating new order
            setSelectedFormId(forms[0]?.id || '');
            setCustomerData({ name: '', phone: '', address: '' });
            setAddressData({
                province: '',
                city: '',
                district: '',
                postalCode: '',
                detailAddress: '',
                fullAddress: ''
            });
            setOrderTotal(0);
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
            address: addressData.fullAddress
        }));
    }, [addressData]);
    
    const handleSubmit = () => {
        const form = forms.find(f => f.id === selectedFormId);
        if (!form) return;
        
        onSave({
            customer: customerData.name,
            customerPhone: customerData.phone,
            customerEmail: '',
            shippingAddress: customerData.address,
            productName: form.title,
            productPrice: orderTotal,
            totalPrice: orderTotal, // Simplified for manual entry
            status: 'Pending',
            urgency: 'Low',
            followUps: 0,
            date: new Date().toISOString(),
            formId: form.id,
            formTitle: form.title,
            brandId: form.brandId || '',
            assignedCsId: selectedCsId || undefined, // Assign CS
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
                                onChange={e => setCustomerData({...customerData, name: e.target.value})} 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                            <input 
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" 
                                placeholder="WhatsApp (e.g. 0812...)" 
                                value={customerData.phone}
                                onChange={e => setCustomerData({...customerData, phone: e.target.value})} 
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
                                                    setOrderTotal(selectedVariant.sellingPrice * quantity);
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
                                        setOrderTotal(selectedVariant.sellingPrice * newQty);
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Harga</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                                <input 
                                    type="number" 
                                    className="w-full p-3 pl-10 border rounded-lg dark:bg-slate-700 dark:border-slate-600" 
                                    placeholder="0" 
                                    value={orderTotal}
                                    onChange={e => setOrderTotal(parseFloat(e.target.value) || 0)} 
                                />
                            </div>
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
                        <WhatsAppIcon className="w-5 h-5 text-green-600 dark:text-green-400"/>
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
