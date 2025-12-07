import { supabase } from '../firebase';
import { createNotification } from './notificationService';
import type { NotificationCreatePayload } from '../types';

/**
 * Example: Trigger ORDER_NEW notification
 * Call this when a new order is created
 */
export async function triggerOrderNewNotification(orderData: {
  id: string;
  customer: string;
  totalPrice: number;
  assignedCsId?: string;
}) {
  try {
    // If CS is assigned, send notification to CS
    if (orderData.assignedCsId) {
      await createNotification(orderData.assignedCsId, {
        type: 'ORDER_NEW',
        title: `Pesanan Baru dari ${orderData.customer}`,
        message: `Total: Rp ${orderData.totalPrice.toLocaleString('id-ID')}`,
        metadata: {
          orderId: orderData.id,
          customerName: orderData.customer,
          totalPrice: orderData.totalPrice,
        },
      });
    }

    // Also send to admins/owners
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'owner'])
      .eq('status', 'Aktif');

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        await createNotification(admin.id, {
          type: 'ORDER_NEW',
          title: `Pesanan Baru dari ${orderData.customer}`,
          message: `Total: Rp ${orderData.totalPrice.toLocaleString('id-ID')}`,
          metadata: {
            orderId: orderData.id,
            customerName: orderData.customer,
            totalPrice: orderData.totalPrice,
          },
        });
      }
    }

    console.log('✅ Order notifications sent');
  } catch (error) {
    console.error('❌ Error sending order notification:', error);
    // Don't throw - let order creation continue even if notification fails
  }
}

/**
 * Example: Trigger CART_ABANDON notification
 * Call this when customer leaves checkout page
 */
export async function triggerCartAbandonNotification(cartData: {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  totalAmount: number;
  cartId?: string;
}) {
  try {
    // Send to customer
    await createNotification(cartData.customerId, {
      type: 'CART_ABANDON',
      title: 'Selesaikan Pembelian Anda',
      message: `Keranjang Anda berisi ${cartData.items.length} item. Total: Rp ${cartData.totalAmount.toLocaleString('id-ID')}`,
      metadata: {
        cartId: cartData.cartId || 'unknown',
        itemsCount: cartData.items.length,
        totalAmount: cartData.totalAmount,
        customerEmail: cartData.customerEmail,
      },
    });

    // Also send to owner/admin for tracking
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['admin', 'owner'])
      .limit(1);

    if (admins && admins.length > 0) {
      await createNotification(admins[0].id, {
        type: 'CART_ABANDON',
        title: `Keranjang Ditinggalkan: ${cartData.customerName}`,
        message: `${cartData.items.length} item, Total: Rp ${cartData.totalAmount.toLocaleString('id-ID')}`,
        metadata: {
          customerId: cartData.customerId,
          customerName: cartData.customerName,
          customerEmail: cartData.customerEmail,
          itemsCount: cartData.items.length,
          totalAmount: cartData.totalAmount,
        },
      });
    }

    console.log('✅ Cart abandon notification sent');
  } catch (error) {
    console.error('❌ Error sending cart abandon notification:', error);
  }
}

/**
 * Example: Trigger SYSTEM_ALERT notification
 * Call this for important system events
 */
export async function triggerSystemAlertNotification(alertData: {
  title: string;
  message: string;
  severity?: 'low' | 'medium' | 'high'; // For filtering
  recipients?: 'admins' | 'all'; // Who should see it
  metadata?: Record<string, any>;
}) {
  try {
    const recipients = alertData.recipients || 'admins';

    // Determine who gets the notification
    let recipientIds: string[] = [];

    if (recipients === 'admins') {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'owner', 'keuangan'])
        .eq('status', 'Aktif');

      recipientIds = admins?.map((a) => a.id) || [];
    } else {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id')
        .eq('status', 'Aktif');

      recipientIds = allUsers?.map((u) => u.id) || [];
    }

    // Send to all recipients
    for (const userId of recipientIds) {
      await createNotification(userId, {
        type: 'SYSTEM_ALERT',
        title: alertData.title,
        message: alertData.message,
        metadata: {
          severity: alertData.severity || 'medium',
          ...alertData.metadata,
        },
      });
    }

    console.log(`✅ System alert sent to ${recipientIds.length} users`);
  } catch (error) {
    console.error('❌ Error sending system alert:', error);
  }
}

/**
 * Example: Payment Success Notification
 */
export async function triggerPaymentSuccessNotification(paymentData: {
  orderId: string;
  customerName: string;
  amount: number;
  csId: string;
}) {
  return triggerSystemAlertNotification({
    title: `Pembayaran Diterima - ${paymentData.customerName}`,
    message: `Pembayaran sebesar Rp ${paymentData.amount.toLocaleString('id-ID')} untuk pesanan #${paymentData.orderId.slice(0, 8)} telah diterima.`,
    severity: 'high',
    recipients: 'admins',
    metadata: {
      type: 'payment_success',
      orderId: paymentData.orderId,
      amount: paymentData.amount,
    },
  });
}

/**
 * Example: Refund Notification
 */
export async function triggerRefundNotification(refundData: {
  orderId: string;
  customerName: string;
  amount: number;
  reason: string;
}) {
  return triggerSystemAlertNotification({
    title: `Pengembalian Dana - ${refundData.customerName}`,
    message: `Pengembalian dana sebesar Rp ${refundData.amount.toLocaleString('id-ID')} untuk pesanan #${refundData.orderId.slice(0, 8)}. Alasan: ${refundData.reason}`,
    severity: 'high',
    recipients: 'admins',
    metadata: {
      type: 'refund',
      orderId: refundData.orderId,
      amount: refundData.amount,
      reason: refundData.reason,
    },
  });
}

/**
 * Example: Low Stock Alert
 */
export async function triggerLowStockNotification(productData: {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
}) {
  return triggerSystemAlertNotification({
    title: `Stok Rendah - ${productData.productName}`,
    message: `Stok ${productData.productName} tinggal ${productData.currentStock} unit (ambang batas: ${productData.threshold})`,
    severity: 'medium',
    recipients: 'admins',
    metadata: {
      type: 'low_stock',
      productId: productData.productId,
      currentStock: productData.currentStock,
      threshold: productData.threshold,
    },
  });
}

/**
 * Example: Bulk Notification (send to specific users)
 */
export async function sendBulkNotification(
  userIds: string[],
  payload: NotificationCreatePayload
) {
  try {
    const promises = userIds.map((userId) => createNotification(userId, payload));
    await Promise.all(promises);
    console.log(`✅ Bulk notification sent to ${userIds.length} users`);
  } catch (error) {
    console.error('❌ Error sending bulk notification:', error);
  }
}

/**
 * Example: Usage in OrdersPage Component
 */
export function useOrderNotifications() {
  const handleCreateOrder = async (orderData: any) => {
    try {
      // Create order in database
      const { data: order, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      // Trigger notification
      await triggerOrderNewNotification({
        id: order.id,
        customer: order.customer,
        totalPrice: order.totalPrice,
        assignedCsId: order.assignedCsId,
      });

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handleAbandonCart = async (cartData: any) => {
    try {
      // Record abandoned cart
      const { data: cart, error } = await supabase
        .from('abandoned_carts')
        .insert(cartData)
        .select()
        .single();

      if (error) throw error;

      // Send notification after 30 minutes (handled by cron job)
      // But you can also send immediately if needed:
      // await triggerCartAbandonNotification({...});

      return cart;
    } catch (error) {
      console.error('Error recording abandoned cart:', error);
      throw error;
    }
  };

  return { handleCreateOrder, handleAbandonCart };
}
