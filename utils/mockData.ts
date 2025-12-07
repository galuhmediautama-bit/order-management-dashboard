/**
 * Mock Data for Local Development
 * Used when running locally without server connection
 * Automatically enabled in development mode (npm run dev)
 */

// Mock current user
export const MOCK_CURRENT_USER = {
  id: 'dev-user-1',
  name: 'Developer User',
  email: 'dev@example.com',
  role: 'Admin',
  status: 'Aktif',
  assignedBrandIds: [],
  avatarUrl: null,
};

// Mock orders
export const MOCK_ORDERS = [
  {
    id: 'order-1',
    customer: 'John Doe',
    customerPhone: '081234567890',
    shippingAddress: 'Jl. Sample No. 1, Jakarta',
    totalPrice: 500000,
    status: 'Pending',
    date: new Date().toISOString(),
    assignedCsId: 'dev-user-1',
    brandId: 'brand-1',
    formId: 'form-1',
    variant: 'Standar',
    quantity: 2,
    notes: 'Sample order for development',
    productId: 'product-1',
    csCommission: 50000,
    advCommission: 25000,
    deletedAt: null,
    orderNumber: 'ORD-001',
  },
  {
    id: 'order-2',
    customer: 'Jane Smith',
    customerPhone: '082345678901',
    shippingAddress: 'Jl. Example No. 2, Bandung',
    totalPrice: 750000,
    status: 'Shipped',
    date: new Date(Date.now() - 86400000).toISOString(),
    assignedCsId: 'dev-user-1',
    brandId: 'brand-2',
    formId: 'form-2',
    variant: 'Premium',
    quantity: 1,
    notes: 'Sample shipped order',
    productId: 'product-2',
    csCommission: 75000,
    advCommission: 37500,
    deletedAt: null,
    orderNumber: 'ORD-002',
  },
];

// Mock forms
export const MOCK_FORMS = [
  {
    id: 'form-1',
    title: 'Product Form 1',
    slug: 'form-1',
    brandId: 'brand-1',
    productName: 'Sample Product 1',
    productPrice: 500000,
    description: 'This is a sample form for development',
    visible: true,
  },
  {
    id: 'form-2',
    title: 'Product Form 2',
    slug: 'form-2',
    brandId: 'brand-2',
    productName: 'Sample Product 2',
    productPrice: 750000,
    description: 'Another sample form',
    visible: true,
  },
];

// Mock users
export const MOCK_USERS = [
  MOCK_CURRENT_USER,
  {
    id: 'user-2',
    name: 'CS Agent 1',
    email: 'cs1@example.com',
    role: 'Customer service',
    status: 'Aktif',
    assignedBrandIds: ['brand-1'],
    avatarUrl: null,
  },
  {
    id: 'user-3',
    name: 'Advertiser 1',
    email: 'advertiser@example.com',
    role: 'Advertiser',
    status: 'Aktif',
    assignedBrandIds: ['brand-2'],
    avatarUrl: null,
  },
];

// Mock brands
export const MOCK_BRANDS = [
  {
    id: 'brand-1',
    name: 'Sample Brand 1',
  },
  {
    id: 'brand-2',
    name: 'Sample Brand 2',
  },
];

// Mock abandoned carts
export const MOCK_ABANDONED_CARTS = [
  {
    id: 'cart-1',
    customerName: 'Customer 1',
    customerPhone: '081234567890',
    selectedVariant: 'Standar',
    totalAmount: 250000,
    status: 'New',
    formId: 'form-1',
    formTitle: 'Product Form 1',
    timestamp: new Date().toISOString(),
  },
];

// Mock dashboard stats
export const MOCK_DASHBOARD_STATS = {
  totalOrders: MOCK_ORDERS.length,
  pendingOrders: MOCK_ORDERS.filter(o => o.status === 'Pending').length,
  shippedOrders: MOCK_ORDERS.filter(o => o.status === 'Shipped').length,
  totalRevenue: MOCK_ORDERS.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  totalCommission: MOCK_ORDERS.reduce((sum, o) => sum + ((o.csCommission || 0) + (o.advCommission || 0)), 0),
  abandonedCarts: MOCK_ABANDONED_CARTS.length,
};

export default {
  MOCK_CURRENT_USER,
  MOCK_ORDERS,
  MOCK_FORMS,
  MOCK_USERS,
  MOCK_BRANDS,
  MOCK_ABANDONED_CARTS,
  MOCK_DASHBOARD_STATS,
};
