import React, { useEffect } from 'react';

interface FormPagePixelScriptProps {
    pixelIds: string[];
    eventName: string;
    contentName?: string; // Product Name
}

/**
 * Component untuk tracking pixel DI FORM PAGE SAJA
 * - Initialize pixel (sekali)
 * - Track PageView (sekali)
 * - Track ViewContent/InitiateCheckout (sekali)
 * 
 * PENTING: Component ini HANYA di-render di form page, TIDAK di thank you page
 */
const FormPagePixelScript: React.FC<FormPagePixelScriptProps> = ({ pixelIds, eventName, contentName }) => {
    
    useEffect(() => {
        if (!pixelIds || pixelIds.length === 0) {
            console.log('[Form Page Pixel] Tidak ada pixel ID untuk ditrack');
            return;
        }

        const firePixel = () => {
            const fbq = (window as any).fbq;
            
            if (typeof fbq === 'function') {
                console.log('[Form Page Pixel] fbq ditemukan, initializing pixels:', pixelIds);
                
                // 1. Initialize Pixel ID (hanya sekali per ID)
                const initializedPixels = (window as any)._fbq_initialized || new Set();
                pixelIds.forEach(id => {
                    if (!initializedPixels.has(id)) {
                        fbq('init', id);
                        initializedPixels.add(id);
                        console.log(`[Form Page Pixel] ✅ Pixel ${id} initialized`);
                    }
                });
                (window as any)._fbq_initialized = initializedPixels;

                // 2. Track PageView (wajib di setiap halaman)
                console.log(`[Form Page Pixel] 📊 Tracking PageView`);
                fbq('track', 'PageView');

                // 3. Track ViewContent/InitiateCheckout event
                const params: any = {
                    content_name: contentName || 'Order Form',
                    currency: 'IDR',
                    content_type: 'product'
                };

                const eventTimeoutId = setTimeout(() => {
                    console.log(`[Form Page Pixel] 🎯 Tracking ${eventName}:`, params);
                    fbq('track', eventName, params);
                }, 100);
                
                return eventTimeoutId;
                
            } else {
                console.error("[Form Page Pixel] window.fbq tidak ditemukan. Pastikan Meta Pixel code sudah ada di index.html");
                return null;
            }
        };

        // Delay untuk memastikan fbq sudah siap
        const timeoutId = setTimeout(() => {
            const eventTimeoutId = firePixel();
            if (eventTimeoutId) {
                (window as any)._current_pixel_timeout = eventTimeoutId;
            }
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            if ((window as any)._current_pixel_timeout) {
                clearTimeout((window as any)._current_pixel_timeout);
                console.log('[Form Page Pixel] Cleanup pending event');
            }
        };

    }, [pixelIds, eventName, contentName]);

    if (!pixelIds || pixelIds.length === 0) return null;

    // NoScript fallback untuk user dengan JavaScript disabled
    return (
        <noscript>
            {pixelIds.map(id => {
                const params = new URLSearchParams();
                params.append('id', id);
                params.append('ev', eventName);
                params.append('noscript', '1');
                params.append('cd[currency]', 'IDR');
                if (contentName) params.append('cd[content_name]', contentName);

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

export default FormPagePixelScript;
