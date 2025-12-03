import React, { useEffect } from 'react';

interface MetaPixelProps {
    pixelIds?: string[];
    eventName?: string;
}

/**
 * MetaPixel Component - untuk tracking umum tanpa data order
 * Biasanya digunakan untuk PageView tracking di halaman yang berbeda
 */
const MetaPixel: React.FC<MetaPixelProps> = ({ pixelIds = [], eventName = 'PageView' }) => {
    
    useEffect(() => {
        const trackPixel = () => {
            const fbq = (window as any).fbq;
            
            if (typeof fbq === 'function') {
                console.log('[Meta Pixel] Tracking:', eventName, { pixelIds });
                
                // Initialize pixels if provided
                if (pixelIds && pixelIds.length > 0) {
                    const initializedPixels = (window as any)._fbq_initialized || new Set();
                    pixelIds.forEach(id => {
                        if (!initializedPixels.has(id)) {
                            fbq('init', id);
                            initializedPixels.add(id);
                        }
                    });
                    (window as any)._fbq_initialized = initializedPixels;
                }
                
                // Track event
                fbq('track', eventName);
            } else {
                console.warn('[Meta Pixel] window.fbq not found. Make sure Meta Pixel code is in index.html');
            }
        };

        const timeoutId = setTimeout(() => {
            trackPixel();
        }, 300);

        return () => clearTimeout(timeoutId);

    }, [pixelIds, eventName]);

    // No visual output needed
    return null;
};

export default MetaPixel;
