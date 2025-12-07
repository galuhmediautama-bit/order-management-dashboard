import React, { useEffect } from 'react';
import type { Order } from '../types';

interface ThankYouPixelEventProps {
    eventName: string;
    order: Order;
    contentName?: string;
}

/**
 * Component to fire pixel event on thank you page WITHOUT re-initializing pixel.
 * Pixel should already be initialized on form page.
 * 
 * EVENT CUSTOM: eventName bisa di-custom dari form.trackingSettings.thankYouPage.meta.eventName
 * Biasanya "Purchase" tapi bisa juga "Lead", "AddPaymentInfo", dll sesuai pilihan admin
 */
const ThankYouPixelEvent: React.FC<ThankYouPixelEventProps> = ({ eventName, order, contentName }) => {
    
    useEffect(() => {
        const fireEvent = () => {
            const fbq = (window as any).fbq;
            
            if (typeof fbq === 'function') {
                // Prepare event data
                const params: any = {
                    content_name: contentName || 'Order Form',
                    currency: 'IDR',
                    value: order.totalPrice,
                    order_id: order.id,
                    content_type: 'product'
                };

                console.log(`[Thank You Pixel] Firing ${eventName} event:`, params);
                
                // Fire event only (pixel already initialized on form page)
                fbq('track', eventName, params);
                
            } else {
                console.error("[Thank You Pixel] window.fbq not found");
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            fireEvent();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [eventName, order, contentName]);

    return null; // No visual output
};

export default ThankYouPixelEvent;
