
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
  | 'Produk' // Parent Menu (formerly Manajemen Produk)
  | 'Daftar Produk' // Submenu (formerly Produk)
  | 'Daftar Formulir' // Submenu (formerly Formulir)
  | 'Analitik Produk'
  | 'Pengaturan'
  | 'Pengaturan Website'
  | 'Website' // Short name for sidebar
  | 'Manajemen Pengguna'
  | 'Pengguna' // Short name for sidebar
  | 'Manajemen Peran'
  | 'Peran' // Short name for sidebar
  | 'Merek'
  | 'Manajemen CS'
  | 'Customer Service' // Short name for sidebar
  | 'Pelacakan'
  | 'Template Pesan'
  | 'Pengaturan Pengumuman'
  | 'Permintaan Hapus'
  | 'Penghasilan'
  | 'CuanRank' // Added for new feature
  | 'Log Error' // Error logs from all users
  | 'Pengaturan Akun'
  | 'Monitoring'
  | 'Performance Dashboard'
  | 'Performa'; // Short name for sidebar

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
  // Separate address fields for filtering/reporting
  province?: string; // Provinsi
  city?: string; // Kota/Kabupaten
  district?: string; // Kecamatan
  village?: string; // Kelurahan/Desa
  postalCode?: string; // Kode Pos
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
  assignedAdvertiserId?: string; // FK to Users table (assigned advertiser)
  productId?: string; // FK to Products table (product source)
  product_id?: string; // Snake case version for DB
  commissionSnapshot?: number; // Commission value at the time of order creation (DEPRECATED - use csCommission + advCommission)
  csCommission?: number; // Commission for Customer Service
  advCommission?: number; // Commission for Advertiser
  notes?: string; // Order notes/catatan
  variant?: string; // Product variant
  quantity?: number; // Order quantity/jumlah pesanan
  deletedAt?: string; // Soft delete timestamp
  scheduledDeletionDate?: string; // Auto-delete scheduled date (7 days after approval)
  cancellationReason?: string; // Reason for cancellation
  shippingCost?: number; // Shipping cost/biaya ongkir
  codFee?: number; // Cash on Delivery fee/biaya COD
  // Tracking & UTM parameters
  sourceForm?: string; // Source form ID (marks it as from a form)
  utmSource?: string; // UTM source (meta, google, tiktok, etc)
  utmMedium?: string; // UTM medium (cpc, social, organic, etc)
  utmCampaign?: string; // UTM campaign name
  utmContent?: string; // UTM content
  created_at?: string; // Created timestamp
  updated_at?: string; // Updated timestamp
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
export type UserRole = 'Super Admin' | 'Admin' | 'Keuangan' | 'Customer service' | 'Gudang' | 'Advertiser' | 'Partner';
export type UserStatus = 'Aktif' | 'Tidak Aktif';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string; // WhatsApp / kontak
  whatsapp?: string; // WhatsApp number (alternative field name)
  address?: string; // Alamat lengkap
  role: UserRole;
  status: UserStatus;
  lastLogin: string;
  avatar?: string;
  baseSalary?: number; // Gaji Pokok
  assignedBrandIds?: string[]; // Array of Brand IDs assigned to this user
  columnVisibility?: Record<string, boolean>; // Column visibility preferences for orders table
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions?: string[]; // Added permissions list
  userCount: number;
}

// Menu dan Feature items untuk Role Permission Management
export interface MenuAccess {
  id: string;
  name: string;
  category: 'menu' | 'feature';
  description: string;
  icon?: string;
}

// Role Permission Mapping - stored in settings or separate table
export interface RolePermissionMap {
  roleId: string; // Key: role name (e.g., 'Advertiser', 'Admin')
  permissions: {
    menus: string[]; // Array of menu names (e.g., ['Dasbor', 'Produk', 'Laporan'])
    features: string[]; // Array of feature IDs (e.g., ['export_csv', 'edit_form', 'view_reports'])
  };
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

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  isDefault: boolean;
}

export interface QRISData {
  id: string;
  displayName: string;
  qrisCode: string; // QR code image URL or base64
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface BrandSettings {
  brandId: string;
  bankAccounts: BankAccount[];
  qrisPayments: QRISData | null;
  warehouses: Warehouse[];
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
  minCharacters?: number; // Minimum characters for field validation
}

export type VariantDisplayStyle = 'dropdown' | 'radio' | 'modern';

export interface ProductOption {
  id: number;
  name: string; // e.g., "Warna"
  values: string[]; // e.g., ["Merah", "Biru"]
  displayStyle?: VariantDisplayStyle;
  showPrice?: boolean; // Whether to show price for this attribute/option
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
  initialStock?: number; // Initial stock for fake stock countdown per variant
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
  slug: string; // URL slug (auto-generated dari judul, bisa di-edit manual)
  assignedAdvertiserId?: string; // FK ke Users table (assigned advertiser)
  assignedPlatform?: 'meta' | 'tiktok' | 'google' | 'snack'; // Which platform this form is assigned to
  brandId?: string;
  productId?: string; // FK ke Products table (induk produk)
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
    province: CustomerFieldSetting;
    city: CustomerFieldSetting;
    district: CustomerFieldSetting;
    village: CustomerFieldSetting;

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
    initialStock: number; // Global default if variant doesn't have initialStock
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
    active: boolean;
    mainText: string;
    urgencyText: string;
    buttonColor: string; // Hex color or tailwind class
    initialCount: number;
    increaseIntervalSeconds: number;
    incrementPerSecond: number; // How much to increase count per interval
    animationEnabled: boolean;
    animationType?: 'pulse' | 'shine' | 'bounce' | 'scale' | 'glow' | 'rotate'; // Animation style when enabled
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
  totalPrice?: number; // Total value of abandoned cart
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
  campaignId?: string;
  campaignName: string;
  adDate?: string;
  objective: CampaignObjective;
  startDate: string;
  endDate: string;
  budget: number;
  status: CampaignStatus;
  responsibleUserId?: string;
  responsibleUserName?: string;
  brandId?: string;
  brandName?: string;
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
  landingPageUrl?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  // Performance
  amountSpent: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversions: number;
  roas: number; // Return on Ad Spend
  cpl?: number; // Cost Per Lead
  cpc?: number; // Cost Per Click
  ctr?: number; // Click Through Rate
  cpm?: number; // Cost Per Mille
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
export type CustomerCODScore = 'No Data' | 'E' | 'D' | 'C' | 'B' | 'A';

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
  totalCODOrders?: number; // Total pesanan COD
  successfulCODOrders?: number; // COD yang berhasil diterima (Delivered)
}

// Types for Notifications - See line ~774 for the new Notification interface

export interface AnnouncementSettings {
  popup: {
    enabled: boolean;
    frequency: 'always' | 'per_session' | 'cooldown';
    cooldownMinutes?: number;
    maxShowsPerDay?: number;
  };
  lineBar: {
    enabled: boolean;
    dismissBehavior: 'hide_for_session' | 'hide_for_hours';
    hideDurationHours?: number;
  };
}

// --- Announcement Types (actual announcements to display) ---
export type AnnouncementType = 'info' | 'success' | 'warning' | 'error';
export type AnnouncementDisplayMode = 'popup' | 'linebar';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  displayMode: AnnouncementDisplayMode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // User ID who created
  startDate?: string; // When to start showing
  endDate?: string; // When to stop showing
  order?: number; // Display order priority
  imageUrl?: string; // Image URL for announcement
  linkUrl?: string; // Optional link for line bar (or popup)
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

export interface CancellationReasons {
  id: string;
  reasons: string[]; // Array of cancellation reason options
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

// --- Products (Induk Produk) Types ---
export interface ProductStockTracking {
  enabled: boolean;
  current: number;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  category?: string;

  // Stock management
  initialStock?: number;
  stockTracking: ProductStockTracking;

  // Pricing
  basePrice?: number;
  comparePrice?: number;
  costPrice?: number;

  // Commissions
  csCommission?: number;
  advCommission?: number;

  // Weight
  weight?: number;
  stock?: number;

  // Variants
  variants?: Array<{
    name: string;
    sku?: string;
    price: number;
    comparePrice?: number;
    costPrice?: number;
    csCommission?: number;
    advCommission?: number;
    weight?: number;
    initialStock?: number;
  }>;
  variantOptions?: Array<{
    name: string;
    values: string[];
  }>;

  // Status
  status: 'active' | 'inactive' | 'archived';
  isFeatured: boolean;

  // Metadata
  tags: string[];
  attributes: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;

  createdAt: string;
  updatedAt: string;
}

// --- Product Analytics Types ---
export interface TrafficSources {
  organic: number;
  social: number;
  email: number;
  paid: number;
  direct: number;
}

export interface ProductFormAnalytics {
  id: string;
  productId: string;
  formId: string;
  advertiserId: string;

  // Performance metrics
  viewsCount: number;
  clicksCount: number;
  ordersCount: number;
  totalRevenue: number;

  // Engagement
  averageTimeOnPage: number;
  bounceRate: number;

  // Conversion
  conversionRate: number;
  averageOrderValue: number;

  // Source tracking
  trafficSources: TrafficSources;
  topReferrer?: string;

  // Time period
  periodStart: string; // DATE
  periodEnd?: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface ProductPerformanceAggregate {
  productId: string;
  productName: string;
  brandId: string;
  totalForms: number;
  totalAdvertisers: number;
  totalViews: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRatePercent: number;
  avgOrderValue: number;
  lastUpdated: string;
}

export interface AdvertiserProductPerformance {
  advertiserId: string;
  productId: string;
  productName: string;
  formsCount: number;
  viewsCount: number;
  clicksCount: number;
  ordersCount: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  periodStart: string;
  isProfitable: boolean;
}

// ============================================
// NOTIFICATION SYSTEM TYPES
// ============================================

export type NotificationType = 'ORDER_NEW' | 'CART_ABANDON' | 'SYSTEM_ALERT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreatePayload {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export type NotificationFilterType = 'all' | 'unread' | NotificationType;
