import React, { useEffect } from 'react';

interface PixelConfig {
    platform: 'meta' | 'google' | 'tiktok' | 'snack';
    pixelIds: string[];
    events: string[];
}

interface LandingPagePixelScriptProps {
    pageViewConfigs: PixelConfig[];
    globalPixels: {
        meta?: { pixels: { id: string; name: string }[]; active: boolean };
        google?: { pixels: { id: string; name: string }[]; active: boolean };
        tiktok?: { pixels: { id: string; name: string }[]; active: boolean };
        snack?: { pixels: { id: string; name: string }[]; active: boolean };
    } | null;
    productName?: string;
}

/**
 * Component untuk tracking pixel DI LANDING PAGE (Product Page)
 * - Initialize pixel (sekali)
 * - Track PageView dan event lain berdasarkan pengaturan
 * 
 * Events yang didukung:
 * - Meta: PageView, ViewContent, AddToCart, InitiateCheckout, Lead
 * - Google: page_view, view_item, add_to_cart
 * - TikTok: PageView, ViewContent, ClickButton
 * - Snack: PAGE_VIEW, VIEW_CONTENT
 */
const LandingPagePixelScript: React.FC<LandingPagePixelScriptProps> = ({
    pageViewConfigs,
    globalPixels,
    productName
}) => {

    // Track Meta Pixel
    useEffect(() => {
        const metaConfigs = pageViewConfigs.filter(c => c.platform === 'meta');
        if (metaConfigs.length === 0 || !globalPixels?.meta?.active) return;

        const fireMetaPixel = () => {
            const fbq = (window as any).fbq;

            if (typeof fbq !== 'function') {
                console.log('[Landing Page Pixel] fbq tidak ditemukan, skipping Meta pixel');
                return;
            }

            // Initialize and track for each config
            metaConfigs.forEach(config => {
                config.pixelIds.forEach(pixelId => {
                    // Initialize pixel if not already
                    const initializedPixels = (window as any)._fbq_initialized || new Set();
                    if (!initializedPixels.has(pixelId)) {
                        fbq('init', pixelId);
                        initializedPixels.add(pixelId);
                        console.log(`[Landing Page Pixel] ✅ Meta Pixel ${pixelId} initialized`);
                    }
                    (window as any)._fbq_initialized = initializedPixels;

                    // Track PageView first (required)
                    fbq('track', 'PageView');
                    console.log(`[Landing Page Pixel] 📊 Meta PageView tracked`);

                    // Track custom events
                    config.events?.forEach(event => {
                        if (event && event !== 'PageView') {
                            const params: any = {
                                content_name: productName || 'Product Page',
                                currency: 'IDR',
                                content_type: 'product'
                            };

                            setTimeout(() => {
                                fbq('trackSingle', pixelId, event, params);
                                console.log(`[Landing Page Pixel] 🎯 Meta ${event} tracked for ${pixelId}`);
                            }, 100);
                        }
                    });
                });
            });
        };

        const timeoutId = setTimeout(fireMetaPixel, 300);
        return () => clearTimeout(timeoutId);
    }, [pageViewConfigs, globalPixels, productName]);

    // Track Google Analytics/Ads
    useEffect(() => {
        const googleConfigs = pageViewConfigs.filter(c => c.platform === 'google');
        if (googleConfigs.length === 0 || !globalPixels?.google?.active) return;

        const fireGooglePixel = () => {
            const gtag = (window as any).gtag;

            if (typeof gtag !== 'function') {
                console.log('[Landing Page Pixel] gtag tidak ditemukan, skipping Google pixel');
                return;
            }

            googleConfigs.forEach(config => {
                config.pixelIds.forEach(pixelId => {
                    // Track events
                    config.events?.forEach(event => {
                        const params: any = {
                            send_to: pixelId,
                            items: [{
                                item_name: productName || 'Product',
                                currency: 'IDR'
                            }]
                        };

                        gtag('event', event, params);
                        console.log(`[Landing Page Pixel] 🎯 Google ${event} tracked for ${pixelId}`);
                    });
                });
            });
        };

        const timeoutId = setTimeout(fireGooglePixel, 300);
        return () => clearTimeout(timeoutId);
    }, [pageViewConfigs, globalPixels, productName]);

    // Track TikTok Pixel
    useEffect(() => {
        const tiktokConfigs = pageViewConfigs.filter(c => c.platform === 'tiktok');
        if (tiktokConfigs.length === 0 || !globalPixels?.tiktok?.active) return;

        const fireTikTokPixel = () => {
            const ttq = (window as any).ttq;

            if (typeof ttq !== 'object') {
                console.log('[Landing Page Pixel] ttq tidak ditemukan, skipping TikTok pixel');
                return;
            }

            tiktokConfigs.forEach(config => {
                config.pixelIds.forEach(pixelId => {
                    config.events?.forEach(event => {
                        try {
                            ttq.instance(pixelId).track(event, {
                                content_name: productName || 'Product',
                                currency: 'IDR'
                            });
                            console.log(`[Landing Page Pixel] 🎯 TikTok ${event} tracked for ${pixelId}`);
                        } catch (e) {
                            console.error('[Landing Page Pixel] TikTok error:', e);
                        }
                    });
                });
            });
        };

        const timeoutId = setTimeout(fireTikTokPixel, 300);
        return () => clearTimeout(timeoutId);
    }, [pageViewConfigs, globalPixels, productName]);

    // Track Snack Video Pixel
    useEffect(() => {
        const snackConfigs = pageViewConfigs.filter(c => c.platform === 'snack');
        if (snackConfigs.length === 0 || !globalPixels?.snack?.active) return;

        const fireSnackPixel = () => {
            const snaptr = (window as any).snaptr;

            if (typeof snaptr !== 'function') {
                console.log('[Landing Page Pixel] snaptr tidak ditemukan, skipping Snack pixel');
                return;
            }

            snackConfigs.forEach(config => {
                config.events?.forEach(event => {
                    snaptr('track', event, {
                        content_name: productName || 'Product',
                        currency: 'IDR'
                    });
                    console.log(`[Landing Page Pixel] 🎯 Snack ${event} tracked`);
                });
            });
        };

        const timeoutId = setTimeout(fireSnackPixel, 300);
        return () => clearTimeout(timeoutId);
    }, [pageViewConfigs, globalPixels, productName]);

    // NoScript fallback for Meta Pixel
    const metaPixelIds = pageViewConfigs
        .filter(c => c.platform === 'meta')
        .flatMap(c => c.pixelIds);

    if (metaPixelIds.length === 0) return null;

    return (
        <noscript>
            {metaPixelIds.map(id => {
                const pageViewParams = new URLSearchParams();
                pageViewParams.append('id', id);
                pageViewParams.append('ev', 'PageView');
                pageViewParams.append('noscript', '1');

                const viewContentParams = new URLSearchParams();
                viewContentParams.append('id', id);
                viewContentParams.append('ev', 'ViewContent');
                viewContentParams.append('noscript', '1');
                if (productName) viewContentParams.append('cd[content_name]', productName);

                return (
                    <React.Fragment key={id}>
                        <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?${pageViewParams.toString()}`} alt="" />
                        <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?${viewContentParams.toString()}`} alt="" />
                    </React.Fragment>
                );
            })}
        </noscript>
    );
};

export default LandingPagePixelScript;
