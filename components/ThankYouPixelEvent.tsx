import React, { useEffect } from 'react';
import type { Order } from '../types';

interface ThankYouPixelEventProps {
    pixelIds: string[];
    eventName: string;
    order: Order;
    contentName?: string;
}

/**
 * Component to fire pixel event on thank you page.
 * PENTING: Gunakan pixel IDs yang spesifik untuk Thank You Page,
 * BUKAN pixel dari Form Page!
 * 
 * EVENT CUSTOM: eventName bisa di-custom dari form.trackingSettings.thankYouPage.meta.eventName
 * Biasanya "Purchase" tapi bisa juga "Lead", "AddPaymentInfo", dll sesuai pilihan admin
 */
const ThankYouPixelEvent: React.FC<ThankYouPixelEventProps> = ({ pixelIds, eventName, order, contentName }) => {

    useEffect(() => {
        if (!pixelIds || pixelIds.length === 0) {
            console.log('[Thank You Pixel] Tidak ada pixel ID untuk ThankYouPage - skip tracking');
            return;
        }

        const fireEvent = () => {
            const fbq = (window as any).fbq;

            if (typeof fbq === 'function') {
                console.log('[Thank You Pixel] Initializing pixels for ThankYouPage:', pixelIds);

                // Initialize Pixel IDs khusus untuk Thank You Page
                const initializedPixels = (window as any)._fbq_initialized || new Set();
                pixelIds.forEach(id => {
                    if (!initializedPixels.has(id)) {
                        fbq('init', id);
                        initializedPixels.add(id);
                        console.log(`[Thank You Pixel] ✅ Pixel ${id} initialized`);
                    }
                });
                (window as any)._fbq_initialized = initializedPixels;

                // Track PageView
                console.log(`[Thank You Pixel] 📊 Tracking PageView`);
                fbq('track', 'PageView');

                // Prepare event data
                const params: any = {
                    content_name: contentName || 'Order Form',
                    currency: 'IDR',
                    value: order.totalPrice,
                    order_id: order.id,
                    content_type: 'product'
                };

                console.log(`[Thank You Pixel] 🎯 Firing ${eventName} event:`, params);

                // Fire conversion event
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

    }, [pixelIds, eventName, order, contentName]);

    // NoScript fallback untuk user dengan JavaScript disabled
    if (!pixelIds || pixelIds.length === 0) return null;

    return (
        <noscript>
            {pixelIds.map(id => {
                const params = new URLSearchParams();
                params.append('id', id);
                params.append('ev', eventName);
                params.append('noscript', '1');
                params.append('cd[currency]', 'IDR');
                params.append('cd[value]', String(order.totalPrice));
                if (contentName) params.append('cd[content_name]', contentName);

                return (
                    <img
                        key={id}
                        height="1"
                        width="1"
                        style={{ display: 'none' }}
                        src={`https://www.facebook.com/tr?${params.toString()}`}
                        alt=""
                    />
                );
            })}
        </noscript>
    );
};

export default ThankYouPixelEvent;
