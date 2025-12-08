
import React, { useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react';
import { supabase } from '../firebase';
import type { Form, Order, ShippingSettings, PaymentSettings, ShippingSetting, PaymentSetting, BankTransferSetting, CSAgent, VariantDisplayStyle, QRISSettings, FormPixelSetting, RankLevel } from '../types';
import CODIcon from '../components/icons/CODIcon';
import QRIcon from '../components/icons/QRIcon';
import BankTransferIcon from '../components/icons/BankTransferIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import { capitalizeWords, normalizeForm } from '../utils';
import { SettingsContext } from '../contexts/SettingsContext';
import CustomScriptInjector from '../components/CustomScriptInjector';
import FormPagePixelScript from '../components/FormPagePixelScript';
import ThankYouPixelEvent from '../components/ThankYouPixelEvent';
import ProvinceInput from '../components/ProvinceInput';
import AddressInput, { type AddressData } from '../components/AddressInput';

const SHIPPING_LABELS: Record<keyof ShippingSettings, string> = {
    regular: 'Regular',
    free: 'Gratis Ongkir',
    flat_jawa: 'Flat Ongkir Pulau Jawa',
    flat_bali: 'Flat Ongkir Pulau Bali',
    flat_sumatra: 'Flat Ongkir Pulau Sumatra',
};

const PAYMENT_CONFIG: Record<keyof PaymentSettings, { label: string; icon: React.FC<{ className?: string }> }> = {
    cod: { label: 'Bayar di Tempat (COD)', icon: CODIcon },
    qris: { label: 'QRIS', icon: QRIcon },
    bankTransfer: { label: 'Transfer Bank', icon: BankTransferIcon },
};

// Helper Component for Staggered Animation
const FadeInBlock = ({ children, delay }: { children?: React.ReactNode; delay: number }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div className={`transition-all duration-700 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {children}
        </div>
    );
};

// Helper function to get animation classes based on type
const getAnimationClasses = (animationType?: string): string => {
    switch (animationType) {
        case 'pulse':
            return 'animate-buttonPulse';
        case 'shine':
            return 'animate-buttonShine';
        case 'bounce':
            return 'animate-buttonBounce';
        case 'scale':
            return 'animate-buttonScale';
        case 'glow':
            return 'animate-buttonGlow';
        case 'rotate':
            return 'animate-buttonRotate';
        default:
            return '';
    }
};

// Skeleton Loader Component
const FormSkeleton: React.FC = () => (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4">
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border dark:border-gray-700 animate-pulse">
            <div className="w-full h-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="space-y-2 mb-6">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            </div>
            <div className="mb-6">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
            <div className="space-y-4 mb-6">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
            <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        </div>
    </div>
);

const SocialProofPopup: React.FC<{
    settings: Form['socialProofSettings'];
    productName: string;
}> = ({ settings, productName }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentProof, setCurrentProof] = useState({ name: '', city: '' });

    useEffect(() => {
        if (!settings || !settings.active || !settings.customerNames || !settings.customerCities) {
            setIsVisible(false);
            return;
        }

        const names = settings.customerNames.split('\n').filter(n => n.trim() !== '');
        const cities = settings.customerCities.split('\n').filter(c => c.trim() !== '');

        if (names.length === 0 || cities.length === 0) {
            return;
        }

        let intervalId: number;

        const showNextProof = () => {
            const randomName = names[Math.floor(Math.random() * names.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            setCurrentProof({ name: randomName, city: randomCity });
            setIsVisible(true);

            setTimeout(() => {
                setIsVisible(false);
            }, settings.displayDurationSeconds * 1000);
        };

        const cycleTime = (settings.intervalSeconds + settings.displayDurationSeconds) * 1000;

        const initialTimeout = setTimeout(() => {
            showNextProof();
            if (cycleTime > 0) {
                intervalId = window.setInterval(showNextProof, cycleTime);
            }
        }, settings.initialDelaySeconds * 1000);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalId) clearInterval(intervalId);
        };
    }, [settings, productName]);

    if (!settings || !settings.active) {
        return null;
    }

    const positionClasses: Record<NonNullable<Form['socialProofSettings']>['position'], string> = {
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
    };

    const animationClasses: Record<NonNullable<Form['socialProofSettings']>['animation'], string> = {
        'slide-up': `transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`,
        'slide-down': `transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`,
        'fade-in': `transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`,
    };

    return (
        <div className={`fixed ${positionClasses[settings.position]} z-50 ${animationClasses[settings.animation]}`}>
            <div className="bg-slate-800/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg max-w-xs text-sm">
                <p><span className="font-bold">{currentProof.name}</span> dari <span className="font-semibold">{currentProof.city}</span></p>
                <p className="text-slate-300">baru saja membeli <strong>{productName}</strong></p>
            </div>
        </div>
    );
};


const ThankYouDisplay: React.FC<{ form: Form; order: Order; }> = ({ form, order }) => {
    const { thankYouPage } = form;
    const [csPhoneNumber, setCsPhoneNumber] = useState<string | null>(null);

    useEffect(() => {
        const originalTitle = document.title;
        document.title = thankYouPage.title || 'Pesanan Diterima!';
        return () => {
            document.title = originalTitle;
        };
    }, [thankYouPage.title]);

    useEffect(() => {
        const fetchCsPhone = async () => {
            if (thankYouPage.whatsappConfirmation.active && thankYouPage.whatsappConfirmation.destination === 'assigned_cs' && order.assignedCsId) {
                try {
                    const { data } = await supabase.from('cs_agents').select('*').eq('id', order.assignedCsId).single();
                    if (data && data.phone) {
                        setCsPhoneNumber(data.phone);
                    }
                } catch (error) {
                    console.error("Error fetching CS agent phone:", error);
                }
            }
        };

        fetchCsPhone();
    }, [thankYouPage, order.assignedCsId]);

    const formatWaNumber = (num: string | null | undefined) => {
        if (!num) return '';
        let cleaned = num.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            return '62' + cleaned.substring(1);
        }
        return cleaned;
    };

    let whatsappLink = '#';
    if (thankYouPage.whatsappConfirmation.active) {
        const productDisplay = order.variant
            ? `${order.productName || 'Produk'} / ${order.variant}`
            : (order.productName || 'Produk');

        const message = thankYouPage.whatsappConfirmation.messageTemplate
            .replace('[PRODUCT_NAME]', productDisplay)
            .replace('[ORDER_ID]', order.id.substring(0, 8))
            .replace('[CUSTOMER_NAME]', capitalizeWords(order.customer))
            .replace('[TOTAL_PRICE]', `Rp ${order.totalPrice?.toLocaleString('id-ID')}`)
            .replace('[PAYMENT_METHOD]', order.paymentMethod || 'Tidak ditentukan');

        let destinationNumber = '';
        if (thankYouPage.whatsappConfirmation.destination === 'assigned_cs') {
            destinationNumber = formatWaNumber(csPhoneNumber);
        } else {
            destinationNumber = formatWaNumber(thankYouPage.whatsappConfirmation.number);
        }

        if (destinationNumber) {
            whatsappLink = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <FadeInBlock delay={0}>
                    <CheckCircleFilledIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{thankYouPage.title}</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">{thankYouPage.message}</p>
                </FadeInBlock>

                {thankYouPage.showOrderSummary && (
                    <FadeInBlock delay={300}>
                        <div className="border-t border-b dark:border-gray-700 py-4 my-6 text-left">
                            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-slate-100">Ringkasan Pesanan</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">ID Pesanan:</span><span className="font-medium text-slate-700 dark:text-slate-300" title={order.id}>#{order.id.substring(0, 6)}...</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Produk:</span><span className="font-medium text-slate-700 dark:text-slate-300">{order.productName}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Total Pembayaran:</span><span className="font-bold text-lg text-slate-800 dark:text-slate-200">Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</span></div>
                            </div>
                        </div>
                    </FadeInBlock>
                )}

                {/* Tampilkan metode pembayaran QRIS jika dipilih */}
                {order.paymentMethod === 'QRIS' && form.paymentSettings.qris.qrImageUrl && (
                    <FadeInBlock delay={450}>
                        <div className="my-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">📱 Pembayaran QRIS</h3>
                            <div className="flex justify-center mb-3">
                                <img src={form.paymentSettings.qris.qrImageUrl} alt="QRIS" className="w-48 h-48 object-contain" />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 text-center">Scan QR code dengan aplikasi perbankan Anda untuk menyelesaikan pembayaran</p>
                        </div>
                    </FadeInBlock>
                )}

                {/* Tampilkan metode pembayaran Transfer Bank jika dipilih */}
                {order.paymentMethod === 'Transfer Bank' && form.paymentSettings.bankTransfer.accounts && form.paymentSettings.bankTransfer.accounts.length > 0 && (
                    <FadeInBlock delay={450}>
                        <div className="my-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">🏦 Detail Transfer Bank</h3>
                            <div className="space-y-3 text-sm">
                                {form.paymentSettings.bankTransfer.accounts.map((account, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                                        <p className="text-slate-700 dark:text-slate-300"><span className="font-medium">Bank:</span> {account.bankName}</p>
                                        <p className="text-slate-700 dark:text-slate-300"><span className="font-medium">Nomor Rekening:</span> {account.accountNumber}</p>
                                        <p className="text-slate-700 dark:text-slate-300"><span className="font-medium">Atas Nama:</span> {account.accountHolder}</p>
                                        <p className="text-slate-700 dark:text-slate-300 mt-2"><span className="font-medium">Jumlah:</span> Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeInBlock>
                )}

                {thankYouPage.whatsappConfirmation.active && (
                    <FadeInBlock delay={600}>
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full mt-4 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2">
                            <WhatsAppIcon className="w-5 h-5" />
                            Konfirmasi via WhatsApp
                        </a>
                    </FadeInBlock>
                )}
            </div>
        </div>
    );
};


const FormViewerPage: React.FC<{ identifier: string }> = ({ identifier }) => {
    const { trackingSettings: globalTrackingSettings, loading: settingsLoading } = useContext(SettingsContext);
    const [form, setForm] = useState<Form | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submission, setSubmission] = useState<{ success: boolean, order?: Order, error?: string }>({ success: false });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [variantStock, setVariantStock] = useState<Record<string, number>>({});
    const [checkoutCount, setCheckoutCount] = useState(0);
    const [productOptionsOverride, setProductOptionsOverride] = useState<Form['productOptions']>([]);

    // Platform Tracking State
    const [activePlatform, setActivePlatform] = useState<'meta' | 'tiktok' | 'google' | 'snack' | null>(null);

    // Pixel State
    const [activePixelIds, setActivePixelIds] = useState<string[]>([]);
    const [eventNames, setEventNames] = useState<{ formPage: string; thankYouPage: string }>({
        formPage: 'ViewContent',
        thankYouPage: 'Purchase'
    });
    const [pixelsByPlatform, setPixelsByPlatform] = useState<Record<string, { ids: string[]; eventName: string }>>({
        meta: { ids: [], eventName: 'ViewContent' },
        google: { ids: [], eventName: 'view_item' },
        tiktok: { ids: [], eventName: 'ViewContent' },
        snack: { ids: [], eventName: 'ViewContent' },
    });

    // Form state
    const [customerData, setCustomerData] = useState({ name: '', whatsapp: '', email: '', address: '', province: '', city: '', district: '' });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [addressData, setAddressData] = useState<AddressData>({
        province: '',
        city: '',
        district: '',
        postalCode: '',
        detailAddress: '',
        fullAddress: ''
    });
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedShippingKey, setSelectedShippingKey] = useState<keyof ShippingSettings | undefined>();
    const [selectedPaymentKey, setSelectedPaymentKey] = useState<keyof PaymentSettings | undefined>();

    const debounceTimer = useRef<number | null>(null);

    // Fetch product variant options (source of truth) untuk hindari gabungan di UI
    useEffect(() => {
        // Parse platform parameter dari URL (?platform=meta|tiktok|google|snack)
        const params = new URLSearchParams(window.location.search);
        const platformParam = params.get('platform') as 'meta' | 'tiktok' | 'google' | 'snack' | null;

        if (platformParam && ['meta', 'tiktok', 'google', 'snack'].includes(platformParam)) {
            setActivePlatform(platformParam);
            console.log(`[FormViewer] Platform parameter detected: ${platformParam}`);
        } else if (form?.assignedPlatform) {
            setActivePlatform(form.assignedPlatform);
            console.log(`[FormViewer] Using form assigned platform: ${form.assignedPlatform}`);
        } else {
            setActivePlatform(null);
            console.log('[FormViewer] No platform specified - will load all platforms');
        }
    }, [form?.assignedPlatform]);

    // Fetch product variant options (source of truth) untuk hindari gabungan di UI
    useEffect(() => {
        const loadProductOptions = async () => {
            if (!form?.productId) {
                setProductOptionsOverride([]);
                return;
            }

            try {
                const { data } = await supabase
                    .from('products')
                    .select('attributes')
                    .eq('id', form.productId)
                    .single();

                const variantOptions = (data?.attributes?.variantOptions || []) as Array<{ name: string; values: string[] }>;
                if (Array.isArray(variantOptions) && variantOptions.length > 0) {
                    const mapped = variantOptions.map((opt, idx) => ({
                        id: idx + 1,
                        name: opt.name || `Opsi ${idx + 1}`,
                        values: Array.isArray(opt.values) ? opt.values : [],
                        displayStyle: 'radio' as VariantDisplayStyle,
                    }));
                    setProductOptionsOverride(mapped);
                } else {
                    setProductOptionsOverride([]);
                }
            } catch (error) {
                console.error('Error loading product variant options:', error);
                setProductOptionsOverride([]);
            }
        };

        loadProductOptions();
    }, [form?.productId]);

    // Derive options langsung dari variantCombinations untuk fallback
    const derivedOptions = useMemo(() => {
        if (!form || !form.variantCombinations || form.variantCombinations.length === 0) return [] as Form['productOptions'];

        const firstCombo = form.variantCombinations[0];
        const optionNames = Object.keys(firstCombo.attributes || {});

        return optionNames.map((name, idx) => {
            const values = Array.from(new Set(form.variantCombinations.map(vc => vc.attributes[name]).filter(Boolean)));
            return {
                id: idx + 1,
                name,
                values,
                displayStyle: 'radio' as VariantDisplayStyle,
            };
        });
    }, [form]);

    // Jika hanya ada satu atribut dan nilainya mengandung pemisah "-", pecah menjadi dua kelompok (Atribut 1 & Atribut 2)
    const compositeFallback = useMemo(() => {
        if (derivedOptions.length !== 1) return null;
        const [singleOption] = derivedOptions;
        const separator = ' - ';

        const splitValues = singleOption.values
            .map(v => v.split('-').map(part => part.trim()))
            .filter(parts => parts.length === 2 && parts[0] && parts[1]);

        if (splitValues.length !== singleOption.values.length) return null; // Ada nilai yang tidak bisa di-split, jangan paksa

        const attr1Values = Array.from(new Set(splitValues.map(parts => parts[0])));
        const attr2Values = Array.from(new Set(splitValues.map(parts => parts[1])));

        const compositeOptions: Form['productOptions'] = [
            { id: 1, name: 'Atribut 1', values: attr1Values, displayStyle: 'radio' },
            { id: 2, name: 'Atribut 2', values: attr2Values, displayStyle: 'radio' },
        ];

        const buildCombinedValue = (selection: Record<string, string>) => {
            const first = selection['Atribut 1'];
            const second = selection['Atribut 2'];
            if (!first || !second) return null;
            return `${first} - ${second}`;
        };

        return {
            options: compositeOptions,
            separator,
            originalAttributeKey: singleOption.name,
            buildCombinedValue,
        };
    }, [derivedOptions]);

    // Pilih sumber opsi: gunakan productOptions jika lengkap, tapi fallback ke derivedOptions atau compositeFallback untuk hindari gabungan ("Hitam - A4")
    const displayOptions = useMemo(() => {
        if (!form) return [] as Form['productOptions'];

        // Utamakan variantOptions dari produk
        if (productOptionsOverride.length > 0) {
            return productOptionsOverride;
        }

        if (compositeFallback) return compositeFallback.options;

        const hasProductOptions = Array.isArray(form.productOptions) && form.productOptions.length > 0;

        if (hasProductOptions) {
            // Jika productOptions hanya satu atribut tetapi derivedOptions punya lebih dari satu, pakai derived agar tidak jadi satu gabungan
            if (derivedOptions.length > 1 && form.productOptions.length === 1) {
                return derivedOptions;
            }

            // Jika derivedOptions lebih lengkap (jumlah atribut lebih banyak), gunakan derived
            if (derivedOptions.length > form.productOptions.length) {
                return derivedOptions;
            }

            return form.productOptions;
        }

        return derivedOptions;
    }, [form, derivedOptions, productOptionsOverride]);

    // --- TRACKING CALCULATOR ---
    useEffect(() => {
        if (!form) {
            console.log('[FormViewer] Form not loaded yet');
            return;
        }

        const isThankYouPage = submission.success && !!submission.order;
        const pageType = isThankYouPage ? 'thankYouPage' : 'formPage';

        console.log('[FormViewer] Calculating pixels for page:', pageType);
        console.log('[FormViewer] Form tracking settings:', form.trackingSettings);

        const trackingSettings = form.trackingSettings?.[pageType];

        // Build pixel data for each platform
        const newPixelsByPlatform: Record<string, { ids: string[]; eventName: string }> = {
            meta: { ids: [], eventName: 'ViewContent' },
            google: { ids: [], eventName: 'view_item' },
            tiktok: { ids: [], eventName: 'ViewContent' },
            snack: { ids: [], eventName: 'ViewContent' },
        };

        // Extract from form tracking settings
        if (trackingSettings) {
            Object.entries(trackingSettings).forEach(([platform, settings]) => {
                // Smart filtering: only load pixel if platform matches OR no specific platform assigned
                const shouldLoadPlatform = !activePlatform || activePlatform === platform;

                if (shouldLoadPlatform && settings?.pixelIds && settings.pixelIds.length > 0) {
                    newPixelsByPlatform[platform] = {
                        ids: settings.pixelIds,
                        eventName: settings.eventName || newPixelsByPlatform[platform].eventName
                    };
                    console.log(`[FormViewer] ${platform} - IDs: ${settings.pixelIds.join(', ')}, Event: ${settings.eventName}`);
                } else if (activePlatform && activePlatform !== platform) {
                    console.log(`[FormViewer] Skipping ${platform} pixel (active platform: ${activePlatform})`);
                }
            });
        }

        // Fallback to global if no form-specific settings
        const hasCoverageFromForm = Object.values(newPixelsByPlatform).some(p => p.ids.length > 0);
        if (!hasCoverageFromForm && !settingsLoading && globalTrackingSettings) {
            console.log('[FormViewer] Falling back to global tracking settings');
            Object.entries(globalTrackingSettings).forEach(([platform, settings]) => {
                if (settings?.active && settings.pixels) {
                    newPixelsByPlatform[platform].ids = settings.pixels.map(p => p.id);
                    console.log(`[FormViewer] ${platform} (global) - IDs: ${newPixelsByPlatform[platform].ids.join(', ')}`);
                }
            });
        }

        setPixelsByPlatform(newPixelsByPlatform);

        // For backward compatibility - Meta pixel IDs
        const metaIds = newPixelsByPlatform.meta.ids;
        console.log(`[FormViewer] Final Meta IDs: ${metaIds.length > 0 ? metaIds.join(', ') : 'NONE'}`);
        setActivePixelIds(metaIds);

        // Update event names - use Meta platform event as primary
        let metaEventName = newPixelsByPlatform.meta.eventName;
        // Guard: jangan pernah fire InitiateCheckout di Thank You page; pakai AddToCart
        if (isThankYouPage && metaEventName === 'InitiateCheckout') {
            metaEventName = 'AddToCart';
        }
        console.log(`[FormViewer] Setting ${pageType} event to: ${metaEventName}`);
        setEventNames(prev => ({
            ...prev,
            [pageType]: metaEventName
        }));

    }, [form, globalTrackingSettings, submission, settingsLoading, activePlatform]);


    // --- Rest of your component logic ---
    // ✅ Track submission completion to prevent abandoned cart creation after successful order
    const hasSubmittedRef = useRef(false);

    const saveAbandonedCart = async () => {
        // Skip jika form belum load
        if (!form) {
            return;
        }

        // Skip jika customer belum isi minimal nama ATAU whatsapp
        if (!customerData.name && !customerData.whatsapp) {
            return;
        }

        // ✅ PENTING: Jangan simpan ke abandoned_carts jika user sudah submit order
        if (submission?.success || hasSubmittedRef.current) {
            return;
        }

        const cartData = {
            formId: form.id,
            formTitle: form.title,
            brandId: form.brandId || '',
            customerName: customerData.name,
            customerPhone: customerData.whatsapp,
            selectedVariant: Object.values(selectedOptions).join(' / ') || 'Produk Tunggal',
            timestamp: new Date().toISOString(),
            status: 'New' as const,
        };

        try {
            const cartId = sessionStorage.getItem(`abandonedCart_${form.id}`);
            if (cartId) {
                // Update existing
                await supabase.from('abandoned_carts').update(cartData).eq('id', cartId);
            } else {
                // Create new
                const { data } = await supabase.from('abandoned_carts').insert(cartData).select().single();
                if (data) {
                    sessionStorage.setItem(`abandonedCart_${form.id}`, data.id);
                }
            }
        } catch (error) {
            console.error("Error saving abandoned cart:", error);
        }
    };

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = window.setTimeout(() => {
            saveAbandonedCart();
        }, 5000);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [customerData, selectedOptions, form]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            saveAbandonedCart();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    }, [customerData, selectedOptions, form]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Resolve variant combinations once (handles product-level variantOptions splitting)
    const resolvedVariantCombinations = useMemo(() => {
        const base = form?.variantCombinations || [];
        if (!base.length) return [];

        // Jika produk punya variantOptions > 1, pecah nama gabungan menjadi atribut per option
        if (productOptionsOverride.length > 1) {
            return base.map(combo => {
                const attrs = { ...(combo.attributes || {}) } as Record<string, string>;

                // Jika sudah punya semua kunci sesuai produk, biarkan apa adanya
                const alreadyComplete = productOptionsOverride.every(opt => attrs.hasOwnProperty(opt.name));
                if (alreadyComplete) return combo;

                // Jika hanya ada satu kunci gabungan, pecah berdasarkan '-'
                const firstKey = Object.keys(attrs)[0];
                const combined = firstKey ? attrs[firstKey] || '' : '';
                const parts = (combined || '').split('-').map(p => p.trim());
                const rebuilt: Record<string, string> = {};
                productOptionsOverride.forEach((opt, idx) => {
                    rebuilt[opt.name] = parts[idx] || opt.values[0] || '';
                });

                return { ...combo, attributes: rebuilt };
            });
        }

        // Jika tidak ada productOptionsOverride, kembalikan base apa adanya
        return base;
    }, [form?.variantCombinations, productOptionsOverride]);

    useEffect(() => {
        if (form?.stockCountdownSettings?.active) {
            const getRandomStock = (seed: number) => {
                // More aggressive pseudo-random with larger range
                let x = Math.abs(seed);
                x = (x * 2654435761) >>> 0; // Knuth's multiplicative hash
                x = x ^ (x >>> 15);
                x = (x * 2246822519) >>> 0;
                x = x ^ (x >>> 13);
                return x >>> 0;
            };

            const initialStocks: Record<string, number> = {};
            const maxStock = form.stockCountdownSettings.initialStock; // This is now the MAX, not base

            // Build stock map for each resolved variant combination with random values below max
            resolvedVariantCombinations.forEach((combo, index) => {
                const variantKey = Object.values(combo.attributes).join(' / ') || 'Produk Tunggal';

                // Create unique seed with more aggressive mixing
                let seed = index * 73856093; // Large prime
                for (let i = 0; i < variantKey.length; i++) {
                    seed = seed ^ ((variantKey.charCodeAt(i) << (i % 16)) >>> 0);
                }
                seed = (seed * 19349663) >>> 0; // Additional mixing

                const hashValue = getRandomStock(seed);

                if (combo.initialStock) {
                    // If variant has custom initialStock, use it as max and get random below it
                    const maxForVariant = combo.initialStock;
                    const randomPercent = (hashValue % 60) + 20; // 20-79% of max (wider range)
                    initialStocks[variantKey] = Math.max(2, Math.floor(maxForVariant * randomPercent / 100));
                } else {
                    // Use global max with random variation per variant (20-79% of max)
                    const randomPercent = (hashValue % 60) + 20; // 20-79% of max (wider range)
                    initialStocks[variantKey] = Math.max(2, Math.floor(maxStock * randomPercent / 100));
                }
            });

            setVariantStock(initialStocks);

            const interval = setInterval(() => {
                setVariantStock(prevStocks => {
                    const newStocks = { ...prevStocks };
                    for (const key in newStocks) {
                        if (newStocks[key] > 2) {
                            newStocks[key]--;
                        }
                    }
                    return newStocks;
                });
            }, (form.stockCountdownSettings.intervalSeconds || 5) * 1000);

            return () => clearInterval(interval);
        }
    }, [form?.stockCountdownSettings, resolvedVariantCombinations]);

    useEffect(() => {
        if (form?.ctaSettings) {
            setCheckoutCount(form.ctaSettings.initialCount);
            const interval = setInterval(() => {
                setCheckoutCount(prev => prev + (form.ctaSettings?.incrementPerSecond || 1));
            }, (form.ctaSettings.increaseIntervalSeconds || 3) * 1000);
            return () => clearInterval(interval);
        }
    }, [form?.ctaSettings]);

    // Sync addressData to customerData
    useEffect(() => {
        setCustomerData(prev => ({
            ...prev,
            province: addressData.province,
            city: addressData.city,
            district: addressData.district
        }));
    }, [addressData]);

    useEffect(() => {
        const fetchForm = async () => {
            if (!identifier) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            setLoading(true);
            setNotFound(false);
            let foundForm: Form | null = null;

            const rawIdentifier = decodeURIComponent(identifier).trim();
            const normalizedIdentifier = rawIdentifier.replace(/^\//, '');
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(normalizedIdentifier);

            try {
                // Cari form berdasarkan slug (case-insensitive). Jika identifier valid UUID, sertakan pencarian id.
                const orFilters = isUuid
                    ? `slug.eq.${normalizedIdentifier},slug.ilike.${normalizedIdentifier},id.eq.${normalizedIdentifier}`
                    : `slug.eq.${normalizedIdentifier},slug.ilike.${normalizedIdentifier}`;

                const { data, error } = await supabase
                    .from('forms')
                    .select('*')
                    .or(orFilters)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching form:', error);
                }

                if (data) {
                    foundForm = data as Form;
                }
            } catch (error) {
                console.error("Error fetching form:", error);
            }

            if (foundForm) {
                const normalizedForm = normalizeForm(foundForm);
                console.log('Normalized form customerFields:', normalizedForm.customerFields);

                // Remove productImages array untuk menghindari galeri foto
                const cleanForm = { ...normalizedForm, productImages: [] };
                setForm(cleanForm);

                if (normalizedForm.countdownSettings?.active) {
                    setTimeLeft(normalizedForm.countdownSettings.duration);
                }

                const visibleShipping = (Object.keys(normalizedForm.shippingSettings) as Array<keyof ShippingSettings>).filter(
                    key => normalizedForm!.shippingSettings[key]?.visible
                );
                setSelectedShippingKey(visibleShipping[0]);

                const sortedVisiblePayment = (Object.keys(normalizedForm.paymentSettings) as Array<keyof PaymentSettings>)
                    .filter(key => normalizedForm!.paymentSettings[key].visible)
                    .sort((a, b) => (normalizedForm!.paymentSettings[a].order || 99) - (normalizedForm!.paymentSettings[b].order || 99));
                setSelectedPaymentKey(sortedVisiblePayment[0]);
            } else {
                setNotFound(true);
            }
            setLoading(false);
        };
        fetchForm();
    }, [identifier]);

    useEffect(() => {
        const originalTitle = document.title;
        if (form) {
            document.title = form.title || 'Formulir Pemesanan';
        }
        return () => {
            document.title = originalTitle;
        };
    }, [form]);

    // Seed selectedOptions when displayOptions change (ensures grouping UI even tanpa productOptions)
    useEffect(() => {
        if (!displayOptions || displayOptions.length === 0) return;
        setSelectedOptions(prev => {
            const next = { ...prev } as Record<string, string>;
            let changed = false;
            displayOptions.forEach(opt => {
                if (!next[opt.name] && opt.values.length > 0) {
                    next[opt.name] = opt.values[0];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [displayOptions]);

    const currentCombination = useMemo(() => {
        if (!form) return null;
        if (resolvedVariantCombinations.length === 0) return null;
        if (!displayOptions || displayOptions.length === 0) return resolvedVariantCombinations[0] || null;

        // Jika mode composite aktif, cari kombinasi berdasarkan gabungan nilai Atribut 1 & Atribut 2
        if (compositeFallback) {
            const targetCombined = compositeFallback.buildCombinedValue(selectedOptions);
            if (targetCombined) {
                const match = resolvedVariantCombinations.find(combo => {
                    const keys = Object.keys(combo.attributes || {});
                    const key = keys[0];
                    return key && combo.attributes[key] === targetCombined;
                });
                return match || resolvedVariantCombinations[0];
            }
        }

        return resolvedVariantCombinations.find(combo => {
            return Object.entries(selectedOptions).every(([key, value]) => combo.attributes[key] === value);
        }) || resolvedVariantCombinations[0];
    }, [selectedOptions, form, displayOptions, compositeFallback, resolvedVariantCombinations]);

    // Get current variant stock based on selected options
    const currentVariantStock = useMemo(() => {
        if (!currentCombination) return undefined;
        const variantKey = Object.values(currentCombination.attributes).join(' / ') || 'Produk Tunggal';
        return variantStock[variantKey];
    }, [currentCombination, variantStock]);

    const subtotal = currentCombination?.sellingPrice ?? 0;

    const shippingCost = useMemo(() => {
        if (!form || !selectedShippingKey) return 0;

        const setting = form.shippingSettings[selectedShippingKey];
        if (!setting || !setting.visible) return 0;

        if (selectedShippingKey.startsWith('flat_')) {
            const costPerKg = setting.cost || 0;
            const weightInGrams = currentCombination?.weight || 0;

            if (weightInGrams > 0) {
                const weightInKg = weightInGrams / 1000;
                return Math.ceil(weightInKg) * costPerKg;
            } else {
                return costPerKg; // Default to 1kg cost if weight is not set
            }
        } else {
            return setting.cost || 0;
        }
    }, [form, selectedShippingKey, currentCombination]);

    const codFee = useMemo(() => {
        if (form && selectedPaymentKey === 'cod' && form.paymentSettings.cod.handlingFeePercentage) {
            const feePercent = form.paymentSettings.cod.handlingFeePercentage / 100;
            const base = form.paymentSettings.cod.handlingFeeBase === 'product_and_shipping' ? subtotal + shippingCost : subtotal;
            return base * feePercent;
        }
        return 0;
    }, [selectedPaymentKey, form, subtotal, shippingCost]);
    const total = subtotal + shippingCost + codFee;

    const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const validateWhatsappNumber = (value: string) => {
        const trimmed = (value || '').trim();
        const withoutSpacing = trimmed.replace(/[	\s-]/g, '');
        const digitsOnly = trimmed.replace(/\D/g, '');
        const isNumeric = withoutSpacing !== '' && /^\d+$/.test(withoutSpacing);
        const hasMinLength = digitsOnly.length >= 9;
        const hasMaxLength = digitsOnly.length <= 15;

        return {
            isValid: isNumeric && hasMinLength && hasMaxLength,
            normalized: digitsOnly
        };
    };

    const isValidEmail = (value: string) => {
        if (!value) return true;
        const trimmed = value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed);
    };

    const validateAddress = () => {
        const manualAddress = (customerData.address || '').trim();
        const addressFromPicker = (addressData.detailAddress || addressData.fullAddress || '').trim();
        const combined = manualAddress || addressFromPicker;

        if (!combined) {
            return { isValid: !(form?.customerFields.address.required), normalized: '' };
        }

        const hasMinLength = combined.length >= 15;
        const requiresLocationDetail = Boolean(form?.customerFields.city?.visible || form?.customerFields.district?.visible);
        const hasLocationDetail = !requiresLocationDetail || Boolean((addressData.city || '').trim() || (addressData.district || '').trim());

        return {
            isValid: hasMinLength && hasLocationDetail,
            normalized: combined
        };
    };

    const validateCustomerFields = useCallback(() => {
        const next: Record<string, string> = {};

        const nameTrimmed = customerData.name.trim();
        if (form?.customerFields.name.required && !nameTrimmed) {
            next.name = 'Nama wajib diisi.';
        } else if (nameTrimmed && nameTrimmed.length < 5) {
            next.name = 'Nama minimal 5 huruf.';
        }

        const whatsappTrimmed = customerData.whatsapp.trim();
        const whatsappCheck = validateWhatsappNumber(whatsappTrimmed);
        if (form?.customerFields.whatsapp.required && !whatsappTrimmed) {
            next.whatsapp = 'No. WhatsApp wajib diisi.';
        } else if (whatsappTrimmed && !whatsappCheck.isValid) {
            next.whatsapp = 'Format WhatsApp harus 9-15 digit angka.';
        }

        const emailTrimmed = customerData.email.trim();
        if (form?.customerFields.email.required && !emailTrimmed) {
            next.email = 'Email wajib diisi.';
        } else if (emailTrimmed && !isValidEmail(emailTrimmed)) {
            next.email = 'Format email tidak valid.';
        }

        if (form?.customerFields.province?.required && !customerData.province.trim()) {
            next.province = 'Provinsi wajib diisi.';
        }
        if (form?.customerFields.city?.required && !customerData.city.trim()) {
            next.city = 'Kota/Kabupaten wajib diisi.';
        }
        if (form?.customerFields.district?.required && !customerData.district.trim()) {
            next.district = 'Kecamatan wajib diisi.';
        }

        const addressCheck = validateAddress();
        if (form?.customerFields.address.required && !addressCheck.normalized) {
            next.address = 'Alamat wajib diisi.';
        } else if (addressCheck.normalized && addressCheck.normalized.length < 2) {
            next.address = 'Alamat minimal 2 karakter.';
        } else if (!addressCheck.isValid) {
            next.address = 'Alamat kurang lengkap (min. 15 karakter + kecamatan/kota).';
        }

        return next;
    }, [customerData, form, validateAddress]);

    const assignCs = async (): Promise<string | undefined> => {
        try {
            if (!form?.thankYouPage.csAssignment) return undefined;

            const { mode, singleAgentId, roundRobinAgents } = form.thankYouPage.csAssignment;

            if (mode === 'single' && singleAgentId) {
                return singleAgentId;
            }

            if (mode === 'round_robin' && roundRobinAgents && roundRobinAgents.length > 0) {
                // 1. Fetch Candidates Info
                const agentIds = roundRobinAgents.map(a => a.csAgentId);
                const { data: agentsData } = await supabase.from('cs_agents').select('*').in('id', agentIds);
                if (!agentsData) return undefined;

                // 2. Fetch Rank Rules & Today's Orders Count
                const { data: rankSettingsDoc } = await supabase.from('settings').select('*').eq('id', 'cuanRank').single();

                // Get start of today (UTC)
                const today = new Date();
                today.setUTCHours(0, 0, 0, 0);
                const { data: todayOrders } = await supabase
                    .from('orders')
                    .select('assignedCsId')
                    .gte('date', today.toISOString())
                    .in('assignedCsId', agentIds);

                const rankOrder: RankLevel[] = ['SSS', 'SS', 'S+', 'S', 'A+', 'A', 'B', 'C', 'D', 'E'];

                // 3. Filter Eligible Agents based on Limit
                let eligibleAgents = roundRobinAgents.filter(rrAgent => {
                    const agent = agentsData.find(a => a.id === rrAgent.csAgentId);
                    if (!agent || agent.status !== 'Aktif') return false;

                    // Determine Rank roughly based on closing rate snapshot
                    let rank: RankLevel = 'E'; // Default
                    if (rankSettingsDoc && rankSettingsDoc.csRules) {
                        const validRule = rankOrder.find(r => {
                            const rule = rankSettingsDoc.csRules.find((rule: any) => rule.rank === r);
                            if (!rule) return false;
                            return agent.closingRate >= rule.minClosingRate;
                        });
                        if (validRule) rank = validRule;
                    }

                    // Get Limit for this Rank
                    const rule = rankSettingsDoc?.csRules?.find((r: any) => r.rank === rank);

                    // If no rule or limit is undefined/null/0, treat as unlimited or check specific implementation
                    // Here we assume explicit limit.
                    if (!rule || rule.maxDailyLeads === undefined || rule.maxDailyLeads === null) return true;

                    // Count Today's Orders
                    const agentTodayCount = todayOrders?.filter(o => o.assignedCsId === agent.id).length || 0;

                    return agentTodayCount < rule.maxDailyLeads;
                });

                // --- OVERFLOW LOGIC ---
                // If ALL agents are full (eligibleAgents is empty), ignore limits and distribute to ALL active agents.
                // This prevents losing leads when traffic > capacity.
                if (eligibleAgents.length === 0) {
                    console.log("All agents reached daily limit. Activating Overflow Mode.");
                    eligibleAgents = roundRobinAgents.filter(rrAgent => {
                        const agent = agentsData.find(a => a.id === rrAgent.csAgentId);
                        return agent && agent.status === 'Aktif';
                    });
                }

                if (eligibleAgents.length === 0) return undefined; // Should only happen if NO agents are active at all

                // Weighted Random Selection
                let cumulativePercentage = 0;
                const ranges = eligibleAgents.map(agent => {
                    const range = { ...agent, start: cumulativePercentage };
                    cumulativePercentage += agent.percentage;
                    return range;
                });

                // Normalize random if total percentage < 100 due to filtering
                const rand = Math.random() * cumulativePercentage;
                const assigned = ranges.find(range => rand >= range.start && rand < (range.start + range.percentage));

                return assigned?.csAgentId;
            }
        } catch (error) {
            console.warn("Failed to assign CS (likely permission issue), continuing without CS:", error);
            return undefined;
        }

        return undefined;
    };


    useEffect(() => {
        setFieldErrors(validateCustomerFields());
    }, [customerData, addressData, validateCustomerFields]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form || !currentCombination) return;
        setIsSubmitting(true);
        setSubmission({ success: false });

        // ✅ Set submission flag ASAP to prevent abandoned cart timer from firing
        hasSubmittedRef.current = true;

        // ✅ Clear debounce timer to prevent abandoned cart save after submission
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        const latestErrors = validateCustomerFields();
        setFieldErrors(latestErrors);
        if (Object.keys(latestErrors).length > 0) {
            alert('Periksa kembali data yang ditandai.');
            setIsSubmitting(false);
            return;
        }

        const { normalized: normalizedWhatsapp } = validateWhatsappNumber(customerData.whatsapp);

        const { normalized: normalizedAddress } = validateAddress();

        try {
            const assignedCsId = await assignCs();

            // Capture UTM parameters from URL for tracking
            const params = new URLSearchParams(window.location.search);
            const utmSource = params.get('utm_source') || undefined;
            const utmMedium = params.get('utm_medium') || undefined;
            const utmCampaign = params.get('utm_campaign') || undefined;
            const utmContent = params.get('utm_content') || undefined;

            // Get both commission values
            const csCommissionValue = currentCombination.csCommission || 0;
            const advCommissionValue = currentCombination.advCommission || 0;
            // Legacy support: if old commissionPrice exists but new ones don't, use it as CS commission
            const legacyCommission = currentCombination.commissionPrice || 0;
            const finalCsCommission = csCommissionValue || legacyCommission;
            const finalAdvCommission = advCommissionValue;

            const shippingMethodLabel = selectedShippingKey ? SHIPPING_LABELS[selectedShippingKey] : 'N/A';

            const normalizedEmail = (customerData.email || '').trim();

            const newOrderData: any = {
                customer: capitalizeWords(customerData.name),
                customerPhone: normalizedWhatsapp || customerData.whatsapp,
                customerEmail: normalizedEmail,
                shippingAddress: normalizedAddress || '',
                productName: `${form.title} ${Object.values(selectedOptions).join(' / ')}`.trim(),
                productPrice: subtotal,
                shippingMethod: shippingMethodLabel,
                paymentMethod: selectedPaymentKey ? PAYMENT_CONFIG[selectedPaymentKey].label : 'N/A',
                totalPrice: total,
                status: 'Pending',
                urgency: 'Low',
                followUps: 0,
                date: new Date().toISOString(),
                quantity: 1,
                formId: form.id || null,
                formTitle: form.title,
                assignedCsId: assignedCsId || null,
                // Use snake_case column for Supabase insert
                product_id: form.productId || null,
                commissionSnapshot: finalCsCommission, // Legacy field for backwards compatibility
                brandId: form.brandId || null,
            };

            // Add commission fields only if they exist in database schema
            // This prevents errors if columns are not yet added
            try {
                // Try to include new commission fields
                newOrderData.csCommission = finalCsCommission;
                newOrderData.advCommission = finalAdvCommission;
            } catch (e) {
                console.warn("Commission columns may not exist yet:", e);
            }

            // Insert order ke database
            const { data, error } = await supabase.from('orders').insert(newOrderData).select().single();
            if (error) {
                console.error("Error inserting order:", error.message);
                throw error;
            }

            await supabase.from('forms').update({
                submissionCount: (form.submissionCount || 0) + 1
            }).eq('id', form.id);

            // ✅ CREATE NOTIFICATION for order (manual insert - fallback if trigger doesn't fire)
            try {
                const notificationTitle = `Pesanan Baru dari ${data.customer}`;
                const notificationMessage = `Pesanan dari ${data.customer} (${data.customerPhone}) - ${data.productName} - Rp ${(data.totalPrice || 0).toLocaleString('id-ID')}`;

                // Get users to notify
                const { data: usersToNotify } = await supabase
                    .from('users')
                    .select('id, role')
                    .in('role', ['Super Admin', 'Admin'])
                    .eq('status', 'Aktif');

                if (usersToNotify && usersToNotify.length > 0) {
                    const notificationsToInsert = usersToNotify.map(user => ({
                        user_id: user.id,
                        type: 'ORDER_NEW',
                        title: notificationTitle,
                        message: notificationMessage,
                        metadata: {
                            orderId: data.id,
                            customerName: data.customer,
                            customerPhone: data.customerPhone,
                            totalPrice: data.totalPrice,
                            productName: data.productName
                        }
                    }));

                    await supabase.from('notifications').insert(notificationsToInsert);
                    console.log('[FormViewer] Notifications created for', usersToNotify.length, 'users');
                }
            } catch (err) {
                console.warn('Failed to create notification:', err);
            }

            // ✅ DELETE abandoned cart record saat order berhasil dibuat
            // (jangan masukkan order yang sudah completed ke abandoned carts)
            const cartId = sessionStorage.getItem(`abandonedCart_${form.id}`);
            if (cartId) {
                try {
                    await supabase.from('abandoned_carts').delete().eq('id', cartId);
                } catch (err) {
                    console.warn("Failed to delete abandoned cart record:", err);
                }
            }

            const newOrder = {
                ...(data as Order),
                productId: (data as any)?.product_id ?? (data as any)?.productId ?? null,
            } as Order;

            sessionStorage.removeItem(`abandonedCart_${form.id}`);

            if (form.thankYouPage.submissionAction === 'redirect_to_url' && form.thankYouPage.redirectUrl) {
                let finalUrl = form.thankYouPage.redirectUrl;

                finalUrl = finalUrl.replace(/\[ORDER_ID\]/g, newOrder.id);
                finalUrl = finalUrl.replace(/\[TOTAL_PRICE\]/g, String(newOrder.totalPrice || 0));
                finalUrl = finalUrl.replace(/\[CUSTOMER_NAME\]/g, encodeURIComponent(newOrder.customer));
                finalUrl = finalUrl.replace(/\[CUSTOMER_EMAIL\]/g, encodeURIComponent(newOrder.customerEmail));
                finalUrl = finalUrl.replace(/\[CUSTOMER_PHONE\]/g, encodeURIComponent(newOrder.customerPhone));

                window.location.replace(finalUrl);
            } else {
                setSubmission({ success: true, order: newOrder });
            }
        } catch (error) {
            console.error("Error creating order:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));

            // More detailed error message
            let errorMessage = 'Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.';
            if (error instanceof Error) {
                errorMessage = `Error: ${error.message}`;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                errorMessage = `Error: ${(error as any).message}`;
            }

            setSubmission({ success: false, error: errorMessage });
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... rest of the existing rendering logic ...

    if (loading) {
        return <FormSkeleton />;
    }
    if (notFound) {
        return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400"><h1>404 | Formulir tidak ditemukan.</h1></div>;
    }
    if (!form) {
        return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-red-500">Terjadi kesalahan saat memuat formulir.</div>;
    }

    if (submission.success && submission.order) {
        // ✅ THANK YOU PAGE - HANYA fire event, JANGAN initialize pixel lagi
        return (
            <>
                <ThankYouPixelEvent
                    eventName={eventNames.thankYouPage}
                    order={submission.order}
                    contentName={form.title}
                />
                <CustomScriptInjector scriptContent={form.customScripts?.thankYouPage || ''} />
                <ThankYouDisplay form={form} order={submission.order} />
            </>
        );
    }

    // ✅ FORM PAGE - Initialize pixel + track event
    // Pastikan di sini SAJA kita initialize dan track page-level events
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    const descriptionClasses = `text-gray-600 dark:text-gray-300 mb-4 text-sm whitespace-pre-wrap text-${form.descriptionAlign}`;

    const shippingKeys = Object.keys(form.shippingSettings) as Array<keyof ShippingSettings>;
    const hasVisibleShipping = shippingKeys.some(key => form.shippingSettings[key]?.visible);

    const sortedPaymentKeys = (Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>)
        .filter(key => form.paymentSettings[key].visible)
        .sort((a, b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99));

    const hasVisiblePayment = sortedPaymentKeys.length > 0;

    // Add inline styles for animations
    const animationStyles = `
        .animate-buttonShine {
            background: linear-gradient(
                90deg,
                #4f46e5 0%,
                #6366f1 25%,
                #818cf8 50%,
                #6366f1 75%,
                #4f46e5 100%
            );
            background-size: 200% 100%;
            animation: buttonShine 3s linear infinite;
        }
    `;

    return (
        <>
            <style>{animationStyles}</style>
            <FormPagePixelScript
                key="formPage-pixel"
                pixelIds={activePixelIds}
                eventName={eventNames.formPage}
                contentName={form.title}
            />
            <CustomScriptInjector scriptContent={form.customScripts?.formPage || ''} />

            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4">
                <div className="w-full max-w-lg mx-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border dark:border-gray-700 text-slate-900 dark:text-slate-100">
                            {/* ... (Existing Form UI JSX remains exactly the same) ... */}
                            <FadeInBlock delay={0}>
                                <div className="mb-4">
                                    {form.mainImage && (
                                        <img
                                            src={form.mainImage}
                                            alt={form.title}
                                            className={`w-full aspect-square object-cover rounded-lg transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                            onLoad={() => setImageLoaded(true)}
                                            loading="eager"
                                            fetchPriority="high"
                                        />
                                    )}
                                    {!form.mainImage && <div className="h-8"></div>}
                                </div>
                            </FadeInBlock>

                            <FadeInBlock delay={150}>
                                {(form.showTitle ?? true) && <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{form.title}</h1>}
                                {(form.showDescription ?? true) && <p className={descriptionClasses}>{form.description}</p>}

                                {form.countdownSettings?.active && (
                                    <div className="my-4 text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg shadow-sm font-medium">
                                        ⏳ Pesanan Anda akan di-hold selama <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>.
                                    </div>
                                )}
                            </FadeInBlock>

                            <FadeInBlock delay={300}>
                                {displayOptions.length > 0 && (
                                    <div className="mb-4 space-y-6">
                                        {displayOptions.map((option, index) => {
                                            const displayStyle = option.displayStyle || 'radio';

                                            // Helper: Get price/details for a specific value of this attribute
                                            const getVariantDetails = (attributeValue: string) => {
                                                if (!resolvedVariantCombinations || resolvedVariantCombinations.length === 0) return null;

                                                // Build current selection with this value
                                                const testSelection = { ...selectedOptions, [option.name]: attributeValue };

                                                // Composite mode: gabungkan Atribut 1 & Atribut 2 ke nilai tunggal
                                                if (compositeFallback) {
                                                    const combined = compositeFallback.buildCombinedValue(testSelection);
                                                    if (!combined) return null;
                                                    return resolvedVariantCombinations.find(combo => {
                                                        const keys = Object.keys(combo.attributes || {});
                                                        const key = keys[0];
                                                        return key && combo.attributes[key] === combined;
                                                    }) || null;
                                                }

                                                // Find matching combination (normal mode)
                                                const match = resolvedVariantCombinations.find(combo => {
                                                    return Object.entries(testSelection).every(([key, val]) =>
                                                        combo.attributes[key] === val
                                                    );
                                                });

                                                return match;
                                            };

                                            return (
                                                <div key={option.id} className="space-y-3">
                                                    {/* Header Variasi */}
                                                    <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                                                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                                            {option.name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            Pilih salah satu opsi di bawah
                                                        </p>
                                                    </div>

                                                    {displayStyle === 'dropdown' && (
                                                        <select
                                                            onChange={(e) => setSelectedOptions(prev => ({ ...prev, [option.name]: e.target.value }))}
                                                            value={selectedOptions[option.name] || ''}
                                                            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 font-medium"
                                                        >
                                                            {option.values.map(val => {
                                                                const details = getVariantDetails(val);
                                                                const label = details?.sellingPrice
                                                                    ? `${val} - Rp ${details.sellingPrice.toLocaleString('id-ID')}`
                                                                    : val;
                                                                return <option key={val} value={val}>{label}</option>;
                                                            })}
                                                        </select>
                                                    )}
                                                    {displayStyle === 'radio' && (
                                                        <div className="space-y-2">
                                                            {option.values.map(val => {
                                                                const details = getVariantDetails(val);
                                                                const isSelected = selectedOptions[option.name] === val;

                                                                return (
                                                                    <label
                                                                        key={val}
                                                                        className={`flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                                                                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-[1.01]'
                                                                            : 'border-gray-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-white' : 'border-gray-400'
                                                                                }`}>
                                                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                                            </div>
                                                                            <input
                                                                                type="radio"
                                                                                name={option.name}
                                                                                value={val}
                                                                                checked={isSelected}
                                                                                onChange={(e) => setSelectedOptions(prev => ({ ...prev, [option.name]: e.target.value }))}
                                                                                className="hidden"
                                                                            />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium">{val}</span>
                                                                                {details?.sellingPrice && (
                                                                                    <span className={`text-sm ${isSelected ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                                        Rp {details.sellingPrice.toLocaleString('id-ID')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {form.stockCountdownSettings?.active && details && (
                                                                            <span className={`text-sm font-medium animate-pulse ${isSelected ? 'text-red-200' : 'text-red-600 dark:text-red-400'
                                                                                }`}>
                                                                                Stok: {variantStock[Object.values(details.attributes).join(' / ')] || 0} pcs
                                                                            </span>
                                                                        )}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    {displayStyle === 'modern' && (
                                                        <div className="flex flex-col gap-2">
                                                            {option.values.map(val => (
                                                                <button type="button" key={val} onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))} className={`w-full flex justify-between items-center px-3 py-2.5 border rounded-lg text-sm transition-colors font-medium ${selectedOptions[option.name] === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}`}>
                                                                    <span>{val}</span>
                                                                    {form.stockCountdownSettings?.active && currentVariantStock !== undefined && (
                                                                        <span className="text-xs font-medium opacity-80 animate-pulse">
                                                                            Stok: {currentVariantStock}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </FadeInBlock>

                            <FadeInBlock delay={450}>
                                <div className="mb-4 space-y-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Informasi Pelanggan:</h3>
                                    {form.customerFields.name.visible && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama {form.customerFields.name.required && <span className="text-red-500">*</span>}</label>
                                            <input type="text" name="name" value={customerData.name} onChange={handleCustomerDataChange} placeholder="Nama Lengkap" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required={form.customerFields.name.required} />
                                            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                                        </div>
                                    )}
                                    {form.customerFields.whatsapp.visible && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">No. WhatsApp {form.customerFields.whatsapp.required && <span className="text-red-500">*</span>}</label>
                                            <input type="tel" name="whatsapp" value={customerData.whatsapp} onChange={handleCustomerDataChange} placeholder="08xxxxxxxxxx" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required={form.customerFields.whatsapp.required} />
                                            {fieldErrors.whatsapp && <p className="text-xs text-red-500 mt-1">{fieldErrors.whatsapp}</p>}
                                        </div>
                                    )}
                                    {form.customerFields.email.visible && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email {form.customerFields.email.required && <span className="text-red-500">*</span>}</label>
                                            <input type="email" name="email" value={customerData.email} onChange={handleCustomerDataChange} placeholder="email@example.com" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required={form.customerFields.email.required} />
                                            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                                        </div>
                                    )}
                                    {(form.customerFields.province?.visible || form.customerFields.city?.visible || form.customerFields.district?.visible) && (
                                        <div>
                                            <AddressInput
                                                value={addressData}
                                                onChange={setAddressData}
                                                showProvince={form.customerFields.province?.visible || false}
                                                showCity={form.customerFields.city?.visible || false}
                                                showDistrict={form.customerFields.district?.visible || false}
                                                requiredProvince={form.customerFields.province?.required || false}
                                                requiredCity={form.customerFields.city?.required || false}
                                                requiredDistrict={form.customerFields.district?.required || false}
                                            />
                                            {(fieldErrors.province || fieldErrors.city || fieldErrors.district) && (
                                                <p className="text-xs text-red-500 mt-1">{[fieldErrors.province, fieldErrors.city, fieldErrors.district].filter(Boolean).join(' • ')}</p>
                                            )}
                                        </div>
                                    )}
                                    {form.customerFields.address.visible && (
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Alamat Lengkap {form.customerFields.address.required && <span className="text-red-500">*</span>}</label>
                                            <textarea name="address" value={customerData.address} onChange={handleCustomerDataChange} placeholder="Jl. Sudirman No. 123, RT 01/RW 05, Kecamatan, Kota" rows={3} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" required={form.customerFields.address.required} />
                                            {fieldErrors.address && <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>}
                                        </div>
                                    )}
                                </div>
                            </FadeInBlock>

                            <FadeInBlock delay={600}>
                                {hasVisibleShipping && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Metode Pengiriman:</h3>
                                        <div className="space-y-2">
                                            {shippingKeys.map(key => {
                                                const setting = form.shippingSettings[key] as ShippingSetting;
                                                if (!setting || !setting.visible) return null;

                                                const isFlatRate = key.startsWith('flat_');
                                                const costLabel = setting.cost > 0
                                                    ? `${setting.cost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}${isFlatRate ? ' / kg' : ''}`
                                                    : 'Gratis';

                                                return (
                                                    <div key={key}>
                                                        <label htmlFor={`shipping-${key}`} className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer ${selectedShippingKey === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <input type="radio" id={`shipping-${key}`} name="shippingMethod" value={key} checked={selectedShippingKey === key} onChange={() => setSelectedShippingKey(key)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                                                                <span>{SHIPPING_LABELS[key as keyof typeof SHIPPING_LABELS]}</span>
                                                            </div>
                                                            <span className="font-semibold">{costLabel}</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {hasVisiblePayment && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Metode Pembayaran:</h3>
                                        <div className="space-y-2">
                                            {sortedPaymentKeys.map(key => {
                                                const setting = form.paymentSettings[key];
                                                const config = PAYMENT_CONFIG[key];
                                                const Icon = config.icon;

                                                const accounts = (setting as BankTransferSetting).accounts;
                                                const qrImageUrl = (setting as QRISSettings).qrImageUrl;

                                                return (
                                                    <div key={key}>
                                                        <label htmlFor={`payment-${key}`} className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer ${selectedPaymentKey === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                            <input type="radio" id={`payment-${key}`} name="paymentMethod" value={key} checked={selectedPaymentKey === key} onChange={() => setSelectedPaymentKey(key)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                                                            <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                                                            <span className="font-medium">{config.label}</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </FadeInBlock>

                            <FadeInBlock delay={750}>
                                <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-2">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Ringkasan Pesanan</h3>
                                    <div className="flex justify-between items-baseline text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                        <div className="flex items-baseline gap-2">
                                            {currentCombination?.strikethroughPrice && currentCombination.strikethroughPrice > subtotal && <span className="text-gray-400 line-through">{currentCombination.strikethroughPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>}
                                            <span className="font-medium">{subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Pengiriman</span><span className="font-medium">{shippingCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
                                    {codFee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Biaya Penanganan COD</span><span className="font-medium">{codFee.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>}
                                    <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-slate-100"><span>Total</span><span>{total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!currentCombination || isSubmitting}
                                    className={`w-full mt-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex flex-col items-center justify-center p-2 min-h-[4rem] transition-all shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/40 ${form.ctaSettings?.animationEnabled ? getAnimationClasses(form.ctaSettings?.animationType) : ''}`}
                                >
                                    {isSubmitting ? (
                                        <SpinnerIcon className="w-6 h-6 animate-spin" />
                                    ) : currentCombination ? (
                                        <>
                                            <span className="text-lg leading-tight">{form.ctaSettings?.mainText || 'Kirim Pesanan'}</span>
                                            {form.ctaSettings && (
                                                <span className="text-xs font-normal opacity-80 leading-tight">
                                                    {form.ctaSettings.urgencyText.replace('{count}', String(checkoutCount))}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        'Varian tidak tersedia'
                                    )}
                                </button>
                            </FadeInBlock>
                        </div>
                    </form>
                </div>
            </div>
            {form.socialProofSettings && <SocialProofPopup settings={form.socialProofSettings} productName={form.title} />}
        </>
    );
};

export default FormViewerPage;
