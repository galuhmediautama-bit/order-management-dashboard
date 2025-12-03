
// FIX: Import React to resolve the "Cannot find namespace 'React'" error.
import type React from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type Page = 
  | 'Dasbor'
  | 'Profil Saya'
  | 'Pesanan' // Parent Menu
  | 'Daftar Pesanan'
  | 'Pesanan Tertinggal'
  | 'Pelanggan'
  | 'Laporan' // Added
  | 'Laporan Iklan'
  | 'Laporan CS'
  | 'Formulir'
  | 'Pengaturan'
  | 'Pengaturan Website'
  | 'Manajemen Pengguna'
  | 'Manajemen Peran'
  | 'Merek'
  | 'Manajemen CS'
  | 'Pelacakan'
  | 'Template Pesan'
  | 'Permintaan Hapus'
  | 'Penghasilan'
  | 'CuanRank' // Added for new feature
  | 'Pengaturan Akun';

export interface NavItem {
  name: Page;
  icon: React.ComponentType<{ className?: string }>;
  label?: string; // Added to allow dynamic labels (e.g. Penghasilan Tim vs Penghasilan Saya)
  subItems?: Omit<NavItem, 'subItems'>[];
  allowedRoles?: UserRole[]; // Optional: Explicitly define allowed roles for specific items
}

// New types for the redesigned Orders page
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Canceled' | 'Pending Deletion';
export type OrderUrgency = 'Low' | 'Medium' | 'High';

export interface Order {
  id: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  status: OrderStatus;
  urgency: OrderUrgency;
  followUps: number;
  date: string;
  productName: string;
  productPrice: number;
  shippingResi?: string;
  // Fields from public form submission
  formId?: string;
  formTitle?: string;
  brandId?: string; // Added for brand filtering
  shippingMethod?: string;
  paymentMethod?: string;
  totalPrice?: number;
  assignedCsId?: string;
  commissionSnapshot?: number; // Commission value at the time of order creation (DEPRECATED - use csCommission + advCommission)
  csCommission?: number; // Commission for Customer Service
  advCommission?: number; // Commission for Advertiser
}

export type CSOrderStatus = 'Pending' | 'Diproses' | 'Dibatalkan' | 'Dikirim';

export interface CSAgent {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  status: 'Aktif' | 'Cuti' | 'Tidak Aktif';
  ordersHandled: number;
  closingRate: number;
  totalOmzet: number;
}


// Re-added User and Role types for Settings pages
export type UserRole = 'Super Admin' | 'Admin' | 'Keuangan' | 'Customer service' | 'Advertiser' | 'Partner';
export type UserStatus = 'Aktif' | 'Tidak Aktif';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // WhatsApp / kontak
  address?: string; // Alamat lengkap
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  avatar?: string;
  baseSalary?: number; // Gaji Pokok
  assignedBrandIds?: string[]; // Array of Brand IDs assigned to this user
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: string[]; // Added permissions list
  userCount: number;
}

// Types for Domain Settings
export type DomainStatus = 'Terverifikasi' | 'Menunggu Verifikasi';
export interface Domain {
    id: string;
    name: string;
    status: DomainStatus;
    addedDate: string;
}

// Types for Brands Page
export interface Brand {
    id: string;
    name: string;
    logo: string;
    productCount: number;
    description: string;
}

// Types for Customer Service (Ticketing) Page
export type TicketStatus = 'Baru' | 'Dikerjakan' | 'Selesai';
export type TicketPriority = 'Rendah' | 'Normal' | 'Tinggi';
export interface TicketMessage {
    id: number;
    sender: 'Pelanggan' | 'CS';
    message: string;
    date: string;
}
export interface Ticket {
    id: string;
    subject: string;
    customerName: string;
    status: TicketStatus;
    priority: TicketPriority;
    date: string;
    messages: TicketMessage[];
}

// Types for Tracking Page
export interface TrackingEvent {
    date: string;
    status: string;
    location: string;
}
export interface Shipment {
    trackingId: string;
    courier: string;
    status: string;
    events: TrackingEvent[];
}

// Types for the new advanced Forms Page (Order Page Builder)
export interface CustomerFieldSetting {
  visible: boolean;
  required: boolean;
}

export type VariantDisplayStyle = 'dropdown' | 'radio' | 'modern';

export interface ProductOption {
  id: number;
  name: string; // e.g., "Warna"
  values: string[]; // e.g., ["Merah", "Biru"]
  displayStyle?: VariantDisplayStyle;
}

export interface VariantCombination {
  attributes: Record<string, string>; // e.g., { "Warna": "Merah", "Ukuran": "L" }
  sellingPrice: number;
  strikethroughPrice?: number;
  weight?: number; // in grams
  costPrice?: number; // Modal price
  commissionPrice?: number; // Commission specifically for this variant (DEPRECATED - use csCommission + advCommission)
  csCommission?: number; // Commission for Customer Service per sale
  advCommission?: number; // Commission for Advertiser per sale
}

export interface ShippingSetting {
    visible: boolean;
    cost: number;
}

export interface ShippingSettings {
    regular: ShippingSetting;
    free: ShippingSetting;
    flat_jawa: ShippingSetting;
    flat_bali: ShippingSetting;
    flat_sumatra: ShippingSetting;
}

export interface PaymentSetting {
    visible: boolean;
    order?: number;
}

export interface BankAccount {
    id: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface BankTransferSetting extends PaymentSetting {
    accounts: BankAccount[];
}

export interface CODSettings extends PaymentSetting {
    handlingFeePercentage?: number;
    handlingFeeBase?: 'product' | 'product_and_shipping';
}

export interface QRISSettings extends PaymentSetting {
    qrImageUrl?: string;
}

export interface PaymentSettings {
    cod: CODSettings;
    qris: QRISSettings;
    bankTransfer: BankTransferSetting;
}

export type CSAssignmentMode = 'single' | 'round_robin';

export interface CSRoundRobinSetting {
    csAgentId: string;
    percentage: number;
}

export interface CSAssignmentSettings {
    mode: CSAssignmentMode;
    singleAgentId?: string;
    roundRobinAgents?: CSRoundRobinSetting[];
}

export interface ThankYouPageSettings {
  submissionAction: 'show_thank_you_page' | 'redirect_to_url';
  redirectUrl: string;
  title: string;
  message: string;
  showOrderSummary: boolean;
  whatsappConfirmation: {
    active: boolean;
    destination: 'custom' | 'assigned_cs';
    number: string;
    messageTemplate: string;
  };
  csAssignment?: CSAssignmentSettings;
}

export type TrackingEventName =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration';

export interface FormPixelSetting {
    pixelIds: string[]; // IDs selected from the global settings
    eventName: TrackingEventName;
}

export interface FormPageTrackingSettings {
    meta: FormPixelSetting;
    google: FormPixelSetting;
    tiktok: FormPixelSetting;
    snack: FormPixelSetting;
}

export interface Form {
    id: string;
    title: string;
    slug?: string;
    brandId?: string;
    customDomain?: string; // Added for external form links
    mainImage: string;
    productImages?: string[]; // Multiple product images
    description: string;
    descriptionAlign: 'left' | 'center' | 'right';
    productOptions: ProductOption[];
    variantCombinations: VariantCombination[];
    customerFields: {
        name: CustomerFieldSetting;
        whatsapp: CustomerFieldSetting;
        email: CustomerFieldSetting;
        address: CustomerFieldSetting;
    };
    shippingSettings: ShippingSettings;
    paymentSettings: PaymentSettings;
    submissionCount: number;
    createdAt: string;
    showTitle: boolean;
    showDescription: boolean;
    thankYouPage: ThankYouPageSettings;
    trackingSettings?: {
        formPage: FormPageTrackingSettings;
        thankYouPage: FormPageTrackingSettings;
    };
    customScripts?: {
        formPage: string;
        thankYouPage: string;
    };
    customMessageTemplates?: {
        active: boolean;
        templates: Partial<MessageTemplates>;
    };
    countdownSettings?: {
        active: boolean;
        duration: number; // in seconds
    };
    stockCountdownSettings?: {
        active: boolean;
        initialStock: number;
        intervalSeconds: number;
    };
    socialProofSettings?: {
        active: boolean;
        position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
        animation: 'slide-up' | 'slide-down' | 'fade-in';
        initialDelaySeconds: number;
        displayDurationSeconds: number;
        intervalSeconds: number;
        customerNames: string;
        customerCities: string;
    };
    ctaSettings?: {
        mainText: string;
        urgencyText: string;
        initialCount: number;
        increaseIntervalSeconds: number;
    };
    commissionPrice?: number; // Deprecated: Moved to VariantCombination level
    // This is for client-side migration of old data structure
    variants?: { id: number; name: string; price: number }[];
    customerInfoFields?: any[]; // Deprecated, for migration
    shippingMethods?: { id: number; name: string; cost: number }[]; // Deprecated, for migration
    paymentMethods?: { id: number; name: string; type: 'Transfer' | 'COD', details?: string }[]; // Deprecated, for migration
}

// --- Abandoned Cart Types ---
export type AbandonedCartStatus = 'New' | 'Contacted';

export interface AbandonedCart {
  id: string;
  formId: string;
  formTitle: string;
  brandId?: string;
  customerName: string;
  customerPhone: string;
  selectedVariant: string;
  timestamp: any; // Supabase returns ISO string, but we can manage
  status: AbandonedCartStatus;
}


// Types for Ad Reports Page
export type AdPlatform = 'Meta' | 'Google' | 'TikTok' | 'Snack';
export type CampaignObjective = 'Konversi' | 'Lalu Lintas' | 'Brand Awareness' | 'Prospek';
export type CampaignStatus = 'Aktif' | 'Dijeda' | 'Selesai';
export type AdFormat = 'Gambar' | 'Video' | 'Carousel' | 'Lainnya';

export interface AdCampaignReport {
  id: string;
  // General Info
  platform: AdPlatform;
  campaignName: string;
  objective: CampaignObjective;
  startDate: string;
  endDate: string;
  budget: number;
  status: CampaignStatus;
  responsibleUserId?: string;
  responsibleUserName?: string;
  // Audience
  location: string;
  ageRange: string;
  gender: 'Semua' | 'Pria' | 'Wanita';
  interests: string;
  // Creative
  format: AdFormat;
  headline: string;
  adCopy: string;
  cta: string;
  // Performance
  amountSpent: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  roas: number; // Return on Ad Spend
}

// Types for CS Performance Leaderboard
export interface CSPerformanceData {
    id: string;
    name: string;
    avatar: string;
    ordersHandled: number;
    closingRate: number;
    totalOmzet: number;
}

// Types for Customers Page
export interface Customer {
    id: string;
    name: string;
    avatar?: string; // Made optional as requested
    email: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    joinDate: string;
    address: string;
    rejectedOrders: number;
}

// Types for Notifications
export interface Notification {
  id: string;
  type: 'new_order' | 'user_signup' | 'order_shipped';
  message: string;
  timestamp: string; // ISO string
  read: boolean;
}

export interface MessageTemplates {
  followUp1: string;
  followUp2: string;
  followUp3: string;
  followUp4: string;
  followUp5: string;
  processing: string;
  shipped: string;
}

// --- CuanRank Types ---
export type RankLevel = 'E' | 'D' | 'C' | 'B' | 'A' | 'A+' | 'S' | 'S+' | 'SS' | 'SSS';

export interface CSRankRule {
    rank: RankLevel;
    minLeads: number;
    minClosingRate: number; // Percentage
    maxDailyLeads: number; // New: Limit leads per day
}

export interface AdvertiserRankRule {
    rank: RankLevel;
    minLeads: number;
    minRoas: number;
    minSpending: number;
}

export interface CuanRankSettings {
    csRules: CSRankRule[];
    advertiserRules: AdvertiserRankRule[];
}

// Add and export GlobalPixelSettings and related types to resolve import error in FormViewerPage.
export interface GlobalPixel {
    id: string;
    name: string;
}
export interface GlobalPixelSettings {
    meta: { pixels: GlobalPixel[], active: boolean };
    google: { pixels: GlobalPixel[], active: boolean };
    tiktok: { pixels: GlobalPixel[], active: boolean };
    snack: { pixels: GlobalPixel[], active: boolean };
}
