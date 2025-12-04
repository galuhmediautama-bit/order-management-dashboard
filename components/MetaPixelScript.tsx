
import React, { useEffect } from 'react';
import type { Order } from '../types';

interface MetaPixelScriptProps {
    pixelIds: string[];
    eventName: string;
    order?: Order;
    contentName?: string; // Product Name
}

const MetaPixelScript: React.FC<MetaPixelScriptProps> = ({ pixelIds, eventName, order, contentName }) => {
    
    useEffect(() => {
        if (!pixelIds || pixelIds.length === 0) {
            console.log('[Meta Pixel] Tidak ada pixel ID untuk ditrack');
            return;
        }

        // Fungsi untuk menjalankan pixel dengan aman
        const firePixel = () => {
            // Cek apakah fbq sudah ada di window (dari index.html)
            const fbq = (window as any).fbq;
            
            if (typeof fbq === 'function') {
                console.log('[Meta Pixel] fbq function ditemukan, initializing pixels:', pixelIds);
                
                // 1. Inisialisasi Pixel ID (hanya sekali per ID)
                const initializedPixels = (window as any)._fbq_initialized || new Set();
                pixelIds.forEach(id => {
                    if (!initializedPixels.has(id)) {
                        fbq('init', id);
                        initializedPixels.add(id);
                        console.log(`[Meta Pixel] Pixel ${id} initialized`);
                    }
                });
                (window as any)._fbq_initialized = initializedPixels;

                // 2. Siapkan Data Event
                const params: any = {
                    content_name: contentName || 'Order Form',
                    currency: 'IDR'
                };

                if (order) {
                    params.value = order.totalPrice;
                    params.order_id = order.id;
                    params.content_type = 'product';
                }

                // 3. Track PageView terlebih dahulu (Wajib ada di setiap halaman)
                console.log(`[Meta Pixel] Tracking PageView`);
                fbq('track', 'PageView');

                // 4. Track Event Khusus (ViewContent / Purchase) dengan delay
                const eventTimeoutId = setTimeout(() => {
                    console.log(`[Meta Pixel] Tracking ${eventName}:`, params);
                    fbq('track', eventName, params);
                }, 100);
                
                // Store untuk cleanup
                return eventTimeoutId;
                
            } else {
                console.error("[Meta Pixel] window.fbq tidak ditemukan. Pastikan Meta Pixel code sudah ada di index.html");
                return null;
            }
        };

        // Dengan delay untuk memastikan fbq sudah siap
        const timeoutId = setTimeout(() => {
            const eventTimeoutId = firePixel();
            // Simpan untuk cleanup
            if (eventTimeoutId) {
                (window as any)._current_pixel_timeout = eventTimeoutId;
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            // Cancel event timeout jika masih pending
            if ((window as any)._current_pixel_timeout) {
                clearTimeout((window as any)._current_pixel_timeout);
                console.log('[Meta Pixel] Cleaned up pending event');
            }
        };

    }, [pixelIds, eventName, order, contentName]);

    if (!pixelIds || pixelIds.length === 0) return null;

    // 5. Fallback NoScript (Jika Javascript dimatikan user)
    // Menggunakan URL gambar langsung ke server Facebook
    return (
        <noscript>
            {pixelIds.map(id => {
                const params = new URLSearchParams();
                params.append('id', id);
                params.append('ev', eventName);
                params.append('noscript', '1');
                params.append('cd[currency]', 'IDR');
                if (contentName) params.append('cd[content_name]', contentName);
                if (order) {
                    params.append('cd[value]', String(order.totalPrice || 0));
                    params.append('cd[content_type]', 'product');
                    params.append('cd[order_id]', order.id);
                }

                const pageViewParams = new URLSearchParams();
                pageViewParams.append('id', id);
                pageViewParams.append('ev', 'PageView');
                pageViewParams.append('noscript', '1');

                return (
                    <React.Fragment key={id}>
                        <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?${pageViewParams.toString()}`} alt="" />
                        <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?${params.toString()}`} alt="" />
                    </React.Fragment>
                );
            })}
        </noscript>
    );
};

export default MetaPixelScript;
