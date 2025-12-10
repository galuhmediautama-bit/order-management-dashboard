import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Form, Product, ProductOption, VariantCombination, ShippingSettings, PaymentSettings, CustomerFieldSetting, ShippingSetting, BankTransferSetting, PaymentSetting, BankAccount, CODSettings, QRISSettings, ThankYouPageSettings, TrackingEventName, FormPageTrackingSettings, FormPixelSetting, CSAgent, CSAssignmentMode, CSAssignmentSettings, Brand, MessageTemplates, User } from '../types';
import PencilIcon from '../components/icons/PencilIcon';
import TrashIcon from '../components/icons/TrashIcon';
import EyeIcon from '../components/icons/EyeIcon';
import LinkIcon from '../components/icons/LinkIcon';
import ImageIcon from '../components/icons/ImageIcon';
import PhotoIcon from '../components/icons/PhotoIcon';
import BankTransferIcon from '../components/icons/BankTransferIcon';
import CODIcon from '../components/icons/CODIcon';
import QRIcon from '../components/icons/QRIcon';
import AlignLeftIcon from '../components/icons/AlignLeftIcon';
import AlignCenterIcon from '../components/icons/AlignCenterIcon';
import AlignRightIcon from '../components/icons/AlignRightIcon';
import ChevronUpIcon from '../components/icons/ChevronUpIcon';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import CheckCircleFilledIcon from '../components/icons/CheckCircleFilledIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import TrackingIcon from '../components/icons/TrackingIcon';
import MetaIcon from '../components/icons/MetaIcon';
import GoogleIcon from '../components/icons/GoogleIcon';
import TikTokIcon from '../components/icons/TikTokIcon';
import SnackVideoIcon from '../components/icons/SnackVideoIcon';
import UserGroupIcon from '../components/icons/UserGroupIcon';
import { supabase } from '../firebase';
import ToggleSwitch from '../components/ToggleSwitch';
import { uploadFileAndGetURL } from '../fileUploader';
import { normalizeForm, createDefaultTrackingSettings } from '../utils';
import { productService } from '../services/productService';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import PencilAltIcon from '../components/icons/PencilAltIcon';
import ShipIcon from '../components/icons/ShipIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ChatBubbleIcon from '../components/icons/ChatBubbleIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ArchiveIcon from '../components/icons/ArchiveIcon';
import CursorClickIcon from '../components/icons/CursorClickIcon';
import CodeIcon from '../components/icons/CodeIcon';
import CubeIcon from '../components/icons/CubeIcon';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import AddressInput, { AddressData } from '../components/AddressInput';


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

const PLATFORM_CONFIG: Record<keyof FormPageTrackingSettings, { name: string; icon: React.FC<{ className?: string }> }> = {
    meta: { name: 'Meta Pixel', icon: MetaIcon },
    google: { name: 'Google Analytics', icon: GoogleIcon },
    tiktok: { name: 'TikTok Pixel', icon: TikTokIcon },
    snack: { name: 'Snack Video Pixel', icon: SnackVideoIcon },
};

const TRACKING_EVENTS: TrackingEventName[] = [
    'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead', 'CompleteRegistration'
];

interface GlobalPixel {
    id: string;
    name: string;
}
interface GlobalPixelSettings {
    meta: GlobalPixel[];
    google: GlobalPixel[];
    tiktok: GlobalPixel[];
    snack: GlobalPixel[];
}

const EditorCard: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
    badgeColor?: 'green' | 'red' | 'amber' | 'indigo';
}> = ({ icon: Icon, title, children, badge, badgeColor = 'indigo' }) => {
    const badgeColors = {
        green: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
        red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
                {badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[badgeColor]}`}>
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-4 space-y-4">
                {children}
            </div>
        </div>
    );
};

const TagInput: React.FC<{ values: string[]; onChange: (values: string[]) => void }> = ({ values, onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const addTags = (tagsString: string) => {
        const newTags = tagsString.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && !values.includes(tag));

        if (newTags.length > 0) {
            onChange([...values, ...newTags]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTags(inputValue);
        }
    };

    const handleBlur = () => {
        addTags(inputValue);
    };

    const removeTag = (tagToRemove: string) => {
        onChange(values.filter(tag => tag !== tagToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {values.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 text-sm font-medium px-2 py-1 rounded-full">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(tag)} className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder="Tambah nilai lalu tekan Enter..."
                className="w-full text-sm p-2 border rounded bg-white dark:bg-slate-700 dark:border-slate-500"
            />
        </div>
    );
};

// FadeInBlock component - sama dengan FormViewerPage
const FadeInBlock: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);
    return (
        <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {children}
        </div>
    );
};

const SocialProofPopupPreview: React.FC<{
    settings: Form['socialProofSettings'];
    productName: string;
}> = ({ settings, productName }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentProof, setCurrentProof] = useState({ name: '', city: '' });

    useEffect(() => {
        if (!settings || !settings.active) {
            setIsVisible(false);
            return;
        }

        const names = (settings.customerNames || '')
            .split('\n')
            .map(n => n.trim())
            .filter(n => n.length > 0);
        const cities = (settings.customerCities || '')
            .split('\n')
            .map(c => c.trim())
            .filter(c => c.length > 0);

        if (names.length === 0 || cities.length === 0) {
            setIsVisible(false);
            return;
        }

        const displayMs = Math.max(1000, (settings.displayDurationSeconds || 5) * 1000);
        const intervalMs = Math.max(1000, (settings.intervalSeconds || 10) * 1000);
        const initialDelayMs = Math.max(0, (settings.initialDelaySeconds || 0) * 1000);

        let hideTimeoutId: number | undefined;
        let intervalId: number | undefined;
        let initialTimeoutId: number | undefined;

        const showNextProof = () => {
            const randomName = names[Math.floor(Math.random() * names.length)];
            const randomCity = cities[Math.floor(Math.random() * cities.length)];
            setCurrentProof({ name: randomName, city: randomCity });
            setIsVisible(true);
            if (hideTimeoutId) window.clearTimeout(hideTimeoutId);
            hideTimeoutId = window.setTimeout(() => setIsVisible(false), displayMs);
        };

        const cycleTime = intervalMs + displayMs;

        const startCycle = () => {
            showNextProof();
            if (intervalId) window.clearInterval(intervalId);
            intervalId = window.setInterval(showNextProof, cycleTime);
        };

        if (initialDelayMs > 0) {
            initialTimeoutId = window.setTimeout(startCycle, initialDelayMs);
        } else {
            startCycle();
        }

        return () => {
            if (hideTimeoutId) window.clearTimeout(hideTimeoutId);
            if (initialTimeoutId) window.clearTimeout(initialTimeoutId);
            if (intervalId) window.clearInterval(intervalId);
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
        'slide-up': `transition-all duration-500 will-change-transform will-change-opacity ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`,
        'slide-down': `transition-all duration-500 will-change-transform will-change-opacity ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`,
        'fade-in': `transition-opacity duration-500 will-change-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`,
    };

    return (
        <div className={`absolute ${positionClasses[settings.position]} z-20 ${animationClasses[settings.animation]}`}>
            <div className="bg-slate-800/90 backdrop-blur-sm text-white p-3 rounded-lg shadow-lg max-w-xs text-sm">
                <p><span className="font-bold">{currentProof.name}</span> dari <span className="font-semibold">{currentProof.city}</span></p>
                <p className="text-slate-300">baru saja membeli <strong>{productName}</strong></p>
            </div>
        </div>
    );
};

const FormPreviewComponent: React.FC<{ form: Form }> = ({ form }) => {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [addressData, setAddressData] = useState<AddressData>({
        province: '',
        city: '',
        district: '',
        village: '',
        postalCode: '',
        detailAddress: '',
        fullAddress: ''
    });

    // Sync selectedOptions when form.productOptions changes in the editor
    useEffect(() => {
        setSelectedOptions(prev => {
            const next = { ...prev };
            let hasChanges = false;

            // 1. Remove selections for options that no longer exist
            const currentOptionNames = form.productOptions.map(o => o.name);
            Object.keys(next).forEach(key => {
                if (!currentOptionNames.includes(key)) {
                    delete next[key];
                    hasChanges = true;
                }
            });

            // 2. Select default values for new options or fix invalid selections
            form.productOptions.forEach(opt => {
                const currentVal = next[opt.name];
                // If no selection OR current selection is not in allowed values
                if (!currentVal || !opt.values.includes(currentVal)) {
                    if (opt.values.length > 0) {
                        next[opt.name] = opt.values[0];
                        hasChanges = true;
                    } else if (currentVal) {
                        // Option exists but has no valid values (e.g. user deleted all tags), clear selection
                        delete next[opt.name];
                        hasChanges = true;
                    }
                }
            });

            return hasChanges ? next : prev;
        });
    }, [form.productOptions]);

    const [selectedShippingKey, setSelectedShippingKey] = useState<keyof ShippingSettings | undefined>();
    const [selectedPaymentKey, setSelectedPaymentKey] = useState<keyof PaymentSettings | undefined>();

    const [timeLeft, setTimeLeft] = useState(0);
    const [currentGalleryImage, setCurrentGalleryImage] = useState<string>(form.mainImage);
    const [variantStock, setVariantStock] = useState<Record<string, number>>({});
    const [checkoutCount, setCheckoutCount] = useState(form.ctaSettings?.initialCount || 124);

    useEffect(() => {
        if (form.ctaSettings) {
            setCheckoutCount(form.ctaSettings.initialCount);
            const interval = setInterval(() => {
                setCheckoutCount(prev => prev + 1);
            }, (form.ctaSettings.increaseIntervalSeconds || 8) * 1000);
            return () => clearInterval(interval);
        }
    }, [form.ctaSettings]);

    // Effect for regular countdown timer
    useEffect(() => {
        if (form.countdownSettings?.active) {
            setTimeLeft(form.countdownSettings.duration);
        } else {
            setTimeLeft(0);
        }
    }, [form.countdownSettings]);

    useEffect(() => {
        if (!form.countdownSettings?.active) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 0) return 0;
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [form.countdownSettings?.active]);

    // Effect for stock countdown timer
    useEffect(() => {
        if (form.stockCountdownSettings?.active) {
            const simpleHash = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(i);
                    hash |= 0;
                }
                return Math.abs(hash) % 5;
            };

            const initialStocks: Record<string, number> = {};
            const baseStock = form.stockCountdownSettings.initialStock;
            form.productOptions.forEach(option => {
                option.values.forEach(val => {
                    initialStocks[val] = Math.max(5, baseStock - simpleHash(val));
                });
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
    }, [form.stockCountdownSettings, form.productOptions]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };


    useEffect(() => {
        const visibleMethods = (Object.keys(form.shippingSettings) as Array<keyof ShippingSettings>).filter(
            key => form.shippingSettings[key]?.visible
        );

        if (!selectedShippingKey || !visibleMethods.includes(selectedShippingKey)) {
            setSelectedShippingKey(visibleMethods[0]);
        }
    }, [form.shippingSettings]);

    useEffect(() => {
        const sortedVisibleMethods = (Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>)
            .filter(key => form.paymentSettings[key].visible)
            .sort((a, b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99));

        if (!selectedPaymentKey || !sortedVisibleMethods.includes(selectedPaymentKey)) {
            setSelectedPaymentKey(sortedVisibleMethods[0]);
        }
    }, [form.paymentSettings]);


    const currentCombination = useMemo(() => {
        if (form.productOptions.length === 0) return form.variantCombinations.length > 0 ? form.variantCombinations[0] : null;
        return form.variantCombinations.find(combo => {
            return Object.entries(selectedOptions).every(([key, value]) => combo.attributes[key] === value);
        });
    }, [selectedOptions, form.variantCombinations, form.productOptions]);

    const subtotal = currentCombination?.sellingPrice ?? 0;

    const shippingCost = useMemo(() => {
        if (!selectedShippingKey || !form.shippingSettings[selectedShippingKey]) return 0;
        const setting = form.shippingSettings[selectedShippingKey];
        if (!setting || !setting.visible) return 0;

        if (selectedShippingKey.startsWith('flat_')) {
            const costPerKg = setting.cost || 0;
            const weightInGrams = currentCombination?.weight || 0;
            if (weightInGrams > 0) {
                const weightInKg = weightInGrams / 1000;
                return Math.ceil(weightInKg) * costPerKg;
            }
            return costPerKg; // Default to 1kg cost
        }
        return setting.cost || 0;
    }, [form.shippingSettings, selectedShippingKey, currentCombination]);

    const codFee = useMemo(() => {
        if (selectedPaymentKey === 'cod' && form.paymentSettings.cod.handlingFeePercentage) {
            const feePercent = form.paymentSettings.cod.handlingFeePercentage / 100;
            const base = form.paymentSettings.cod.handlingFeeBase === 'product_and_shipping' ? subtotal + shippingCost : subtotal;
            return base * feePercent;
        }
        return 0;
    }, [selectedPaymentKey, form.paymentSettings.cod, subtotal, shippingCost]);

    const total = subtotal + shippingCost + codFee;

    const descriptionClasses = `text-gray-600 dark:text-gray-300 mb-4 text-sm whitespace-pre-wrap text-${form.descriptionAlign}`;

    // Update current gallery image when mainImage changes
    useEffect(() => {
        setCurrentGalleryImage(form.mainImage);
    }, [form.mainImage]);

    const handleGalleryImageClick = (imageUrl: string) => {
        setCurrentGalleryImage(imageUrl);
    };

    // Get variant details function for radio/dropdown display
    const getVariantDetails = (option: ProductOption, attributeValue: string) => {
        if (!form.variantCombinations || form.variantCombinations.length === 0) return null;

        // Build current selection with this value
        const testSelection = { ...selectedOptions, [option.name]: attributeValue };

        // Find matching combination
        const match = form.variantCombinations.find(combo => {
            return Object.entries(testSelection).every(([key, val]) =>
                combo.attributes[key] === val
            );
        });

        return match;
    };

    const currentVariantStock = useMemo(() => {
        const variantKey = Object.values(selectedOptions).join(' / ');
        return variantStock[variantKey];
    }, [selectedOptions, variantStock]);

    const hasVisibleShipping = (Object.keys(form.shippingSettings) as Array<keyof ShippingSettings>).some(key => form.shippingSettings[key]?.visible);

    const sortedPaymentKeys = (Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>)
        .filter(key => form.paymentSettings[key].visible)
        .sort((a, b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99));

    const hasVisiblePayment = sortedPaymentKeys.length > 0;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8 px-4 relative">
            <div className="w-full max-w-lg mx-auto">
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border dark:border-gray-700 text-slate-900 dark:text-slate-100">
                    <FadeInBlock delay={0}>
                        {/* Main Gallery */}
                        <div className="mb-4">
                            {currentGalleryImage && <img src={currentGalleryImage} alt={form.title} className="w-full aspect-square object-cover rounded-lg transition-opacity duration-300" />}
                            {!currentGalleryImage && <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-lg text-slate-500">Gambar Utama</div>}
                        </div>

                        {form.productImages && form.productImages.length > 0 && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                <div
                                    onClick={() => handleGalleryImageClick(form.mainImage)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 cursor-pointer transition-all ${currentGalleryImage === form.mainImage
                                        ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                                        }`}
                                >
                                    <img src={form.mainImage} alt="Main" className="w-full h-full object-cover rounded-lg" />
                                </div>
                                {form.productImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleGalleryImageClick(img)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 cursor-pointer transition-all ${currentGalleryImage === img
                                            ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                                            }`}
                                    >
                                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </FadeInBlock>

                    <FadeInBlock delay={150}>
                        {(form.showTitle ?? true) && <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{form.title || 'Judul Produk'}</h1>}
                        {(form.showDescription ?? true) && <p className={descriptionClasses}>{form.description || 'Deskripsi produk akan muncul di sini.'}</p>}

                        {form.countdownSettings?.active && (
                            <div className="my-4 text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg shadow-sm font-medium">
                                ⏳ Pesanan Anda akan di-hold selama <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>.
                            </div>
                        )}
                    </FadeInBlock>

                    <FadeInBlock delay={300}>
                        {form.productOptions.length > 0 && (
                            <div className="mb-4 space-y-6">
                                {form.productOptions.map((option, index) => {
                                    const displayStyle = option.displayStyle || 'radio';

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
                                                        const details = getVariantDetails(option, val);
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
                                                        const details = getVariantDetails(option, val);
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
                                                        <button
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: val }))}
                                                            className={`w-full flex justify-between items-center px-3 py-2.5 border rounded-lg text-sm transition-colors font-medium ${selectedOptions[option.name] === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}`}
                                                        >
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
                                    <input type="text" placeholder="Nama Lengkap" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                            {form.customerFields.whatsapp.visible && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">No. WhatsApp {form.customerFields.whatsapp.required && <span className="text-red-500">*</span>}</label>
                                    <input type="tel" placeholder="08xxxxxxxxxx" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                            {form.customerFields.email.visible && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email {form.customerFields.email.required && <span className="text-red-500">*</span>}</label>
                                    <input type="email" placeholder="email@example.com" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                            {(form.customerFields.province?.visible || form.customerFields.city?.visible || form.customerFields.district?.visible || form.customerFields.village?.visible || form.customerFields.address?.visible) && (
                                <AddressInput
                                    value={addressData}
                                    onChange={setAddressData}
                                    showProvince={form.customerFields.province?.visible || false}
                                    showCity={form.customerFields.city?.visible || false}
                                    showDistrict={form.customerFields.district?.visible || false}
                                    showVillage={form.customerFields.village?.visible || false}
                                    showPostalCode={form.customerFields.postalCode?.visible || false}
                                    showDetailAddress={form.customerFields.address?.visible || false}
                                    requiredProvince={form.customerFields.province?.required || false}
                                    requiredCity={form.customerFields.city?.required || false}
                                    requiredDistrict={form.customerFields.district?.required || false}
                                    requiredVillage={form.customerFields.village?.required || false}
                                    requiredPostalCode={form.customerFields.postalCode?.required || false}
                                    requiredDetailAddress={form.customerFields.address?.required || false}
                                />
                            )}
                        </div>
                    </FadeInBlock>

                    <FadeInBlock delay={600}>
                        {hasVisibleShipping && (
                            <div className="mb-4">
                                <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Metode Pengiriman:</h3>
                                <div className="space-y-2">
                                    {(Object.keys(form.shippingSettings) as Array<keyof ShippingSettings>).map(key => {
                                        const setting = form.shippingSettings[key];
                                        if (!setting?.visible) return null;

                                        const isFlatRate = key.startsWith('flat_');
                                        const costLabel = setting.cost > 0
                                            ? `${setting.cost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}${isFlatRate ? ' / kg' : ''}`
                                            : 'Gratis';

                                        return (
                                            <div key={key}>
                                                <label htmlFor={`shipping-preview-${key}`} className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer ${selectedShippingKey === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            id={`shipping-preview-${key}`}
                                                            name="shippingMethod"
                                                            value={key}
                                                            checked={selectedShippingKey === key}
                                                            onChange={() => setSelectedShippingKey(key)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                        />
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

                                        return (
                                            <div key={key}>
                                                <label htmlFor={`payment-preview-${key}`} className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer ${selectedPaymentKey === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                                    <input
                                                        type="radio"
                                                        id={`payment-preview-${key}`}
                                                        name="paymentMethod"
                                                        value={key}
                                                        checked={selectedPaymentKey === key}
                                                        onChange={() => setSelectedPaymentKey(key)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                                    />
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
                                    {currentCombination && currentCombination.strikethroughPrice && currentCombination.strikethroughPrice > subtotal && (
                                        <span className="text-gray-400 line-through">
                                            {currentCombination.strikethroughPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                        </span>
                                    )}
                                    <span className="font-medium">
                                        {subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Pengiriman</span><span className="font-medium">{shippingCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
                            {codFee > 0 && (
                                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Biaya Penanganan COD</span><span className="font-medium">{codFee.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
                            )}
                            <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-slate-100"><span>Total</span><span>{total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
                        </div>

                        <button
                            disabled={!currentCombination}
                            className="w-full mt-6 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex flex-col items-center justify-center p-2 min-h-[4rem] transition-all shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/40"
                        >
                            {currentCombination ? (
                                <>
                                    <span className="text-lg leading-tight">{form.ctaSettings?.mainText || 'Kirim Pesanan'}</span>
                                    {form.ctaSettings && (
                                        <span className="text-xs font-normal opacity-80 leading-tight">
                                            {form.ctaSettings.urgencyText.replace('{count}', String(checkoutCount))}
                                        </span>
                                    )}
                                </>
                            ) : 'Varian tidak tersedia'}
                        </button>
                    </FadeInBlock>
                </div>
            </div>
            {form.socialProofSettings && <SocialProofPopupPreview settings={form.socialProofSettings} productName={form.title} />}
        </div>
    );
};

const FormPreview = React.memo(FormPreviewComponent);
FormPreview.displayName = 'FormPreview';

// ... (cartesian, PixelMultiSelectDropdown, ThankYouPagePreview remain unchanged)
const cartesian = (...a: string[][]): string[][] => {
    return a.reduce((acc: string[][], val: string[]) => {
        if (acc.length === 0) return val.map(v => [v]);
        return acc.flatMap(d => val.map(e => [...d, e]));
    }, []);
};

const PixelMultiSelectDropdown: React.FC<{
    options: GlobalPixel[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}> = ({ options, selectedIds, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCheckboxChange = (id: string, isChecked: boolean) => {
        const newIds = isChecked ? [...selectedIds, id] : selectedIds.filter(selectedId => selectedId !== id);
        onChange(newIds);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm flex justify-between items-center"
            >
                <span className="text-slate-700 dark:text-slate-200">
                    {selectedIds.length > 0 ? `${selectedIds.length} piksel dipilih` : 'Pilih piksel...'}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full z-10 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map(p => (
                            <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={e => handleCheckboxChange(p.id, e.target.checked)}
                                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-500 bg-white dark:bg-slate-800"
                                />
                                <span className="truncate text-slate-700 dark:text-slate-200" title={`${p.name} (${p.id})`}>{p.name} ({p.id})</span>
                            </label>
                        ))
                    ) : (
                        <span className="block p-2 text-sm text-slate-400 italic">Tidak ada piksel global.</span>
                    )}
                </div>
            )}
        </div>
    );
};

const ThankYouPagePreview: React.FC<{ thankYouPage: ThankYouPageSettings; formTitle: string }> = ({ thankYouPage, formTitle }) => {
    // Dummy order for preview purposes
    const dummyOrder = {
        id: 'ABC123XYZ',
        productName: `${formTitle || 'Produk'} - Varian Contoh`,
        totalPrice: 149000,
        customer: 'Nama Pelanggan',
    };

    if (thankYouPage.submissionAction === 'redirect_to_url') {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 text-center">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Aksi Setelah Submit: Redirect</h3>
                <p className="mt-2 text-sm text-slate-500">Pelanggan akan dialihkan ke URL berikut:</p>
                <p className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-700 p-2 rounded break-all">{thankYouPage.redirectUrl || "URL belum diatur."}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border dark:border-gray-700 text-center">
            <CheckCircleFilledIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{thankYouPage.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm whitespace-pre-wrap">{thankYouPage.message}</p>

            {thankYouPage.showOrderSummary && (
                <div className="border-t border-b dark:border-gray-700 py-4 my-6 text-left">
                    <h3 className="font-bold text-base mb-2 text-slate-900 dark:text-slate-100">Ringkasan Pesanan</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">ID Pesanan:</span><span className="font-medium text-slate-700 dark:text-slate-300">#{dummyOrder.id.substring(0, 6)}...</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Produk:</span><span className="font-medium text-slate-700 dark:text-slate-300">{dummyOrder.productName}</span></div>
                        <div className="flex justify-between items-baseline"><span className="text-gray-500 dark:text-gray-400">Total:</span><span className="font-bold text-base text-slate-800 dark:text-slate-200">Rp {dummyOrder.totalPrice.toLocaleString('id-ID')}</span></div>
                    </div>
                </div>
            )}

            {thankYouPage.whatsappConfirmation.active && (
                <a href="#" onClick={e => e.preventDefault()} className="w-full mt-4 bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 cursor-not-allowed opacity-70">
                    <WhatsAppIcon className="w-5 h-5" />
                    Konfirmasi via WhatsApp
                </a>
            )}
        </div>
    );
};


const FormEditorPage: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Data for Form Editor
    const [brands, setBrands] = useState<Brand[]>([]);
    const [csAgents, setCsAgents] = useState<CSAgent[]>([]);
    const [globalPixels, setGlobalPixels] = useState<GlobalPixelSettings>({ meta: [], google: [], tiktok: [], snack: [] });
    const [products, setProducts] = useState<Product[]>([]);
    const [advertisers, setAdvertisers] = useState<User[]>([]); // Advertisers list

    const [form, setForm] = useState<Form | null>(null);
    const [draggedOptionId, setDraggedOptionId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingProductDetails, setLoadingProductDetails] = useState(false);
    const [syncingPrices, setSyncingPrices] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [mainImagePreview, setMainImagePreview] = useState('');
    const [mainImageUploading, setMainImageUploading] = useState(false);
    const [productImagesUploading, setProductImagesUploading] = useState(false);
    const [qrisImageFile, setQrisImageFile] = useState<File | null>(null);
    const [qrisImagePreview, setQrisImagePreview] = useState('');

    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugChecking, setSlugChecking] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [activePreviewTab, setActivePreviewTab] = useState<'form' | 'thankyou'>('form');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Validation function for each step
    const validateStep = (step: 1 | 2 | 3): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (step === 1) {
            // Step 1: Produk - Required fields
            if (!form?.assignedAdvertiserId) errors.push('Advertiser wajib dipilih');
            if (!form?.brandId) errors.push('Brand wajib dipilih');
            if (!form?.title?.trim()) errors.push('Judul formulir wajib diisi');
        }

        if (step === 2) {
            // Step 2: Pengaturan - Check shipping & payment
            const hasShipping = form?.shippingSettings && Object.values(form.shippingSettings).some(s => s.visible);
            const hasPayment = form?.paymentSettings && Object.values(form.paymentSettings).some(s => s.visible);

            if (!hasShipping) errors.push('Minimal 1 metode pengiriman harus aktif');
            if (!hasPayment) errors.push('Minimal 1 metode pembayaran harus aktif');

            // Check CS Assignment
            if (form?.thankYouPage?.csAssignment?.mode === 'single' && !form.thankYouPage.csAssignment.singleAgentId) {
                errors.push('CS Agent wajib dipilih untuk mode Single');
            }
            if (form?.thankYouPage?.csAssignment?.mode === 'round_robin') {
                const agents = form.thankYouPage.csAssignment.roundRobinAgents || [];
                if (agents.length === 0) {
                    errors.push('Minimal 1 CS Agent untuk mode Round Robin');
                }
            }
        }

        return { valid: errors.length === 0, errors };
    };

    // Helper to change wizard step with validation
    const goToStep = (step: 1 | 2 | 3, skipValidation = false) => {
        // Only validate when going forward
        if (!skipValidation && step > wizardStep) {
            const validation = validateStep(wizardStep);
            if (!validation.valid) {
                setValidationErrors(validation.errors);
                // Auto-hide after 5 seconds
                setTimeout(() => setValidationErrors([]), 5000);
                return;
            }
        }
        setValidationErrors([]);
        setWizardStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchData = async () => {
            const fetchWithTimeout = (promise: Promise<any>, timeout = 30000) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timeout after ' + timeout + 'ms')), timeout)
                    )
                ]);
            };

            try {
                // STEP 1: Initialize form IMMEDIATELY (untuk tampilkan judul dulu)
                if (formId) {
                    try {
                        const { data: docSnap } = await fetchWithTimeout(
                            supabase.from("forms").select('*').eq('id', formId).single(),
                            20000
                        );

                        if (docSnap) {
                            console.log('Loaded form from DB:', {
                                id: docSnap.id,
                                variantCombinations: docSnap.variantCombinations
                            });
                            const formToEdit = { ...docSnap } as Form;
                            const normalized = normalizeForm(formToEdit);
                            console.log('After normalize:', {
                                variantCombinations: normalized.variantCombinations
                            });
                            setForm(normalized);
                            setMainImagePreview(normalized.mainImage);
                            setQrisImagePreview(normalized.paymentSettings.qris.qrImageUrl || '');
                            setLoading(false); // ✅ Form loaded, tampilkan UI
                        } else {
                            console.error("Form not found!");
                            navigate('/formulir');
                            return;
                        }
                    } catch (formErr) {
                        console.error("Form fetch timeout/error:", formErr);
                        showToast(`Gagal memuat formulir: ${formErr}`, 'error');
                        navigate('/formulir');
                        return;
                    }
                } else {
                    // Buat form baru - langsung set dan tampilkan
                    const newForm = normalizeForm({
                        id: '', title: '', mainImage: '', description: '', descriptionAlign: 'left', productOptions: [],
                        variantCombinations: [], customerFields: { name: { visible: true, required: true }, whatsapp: { visible: true, required: true }, email: { visible: false, required: false }, province: { visible: false, required: false }, city: { visible: false, required: false }, district: { visible: false, required: false }, village: { visible: false, required: false }, address: { visible: true, required: true } },
                        shippingSettings: { regular: { visible: true, cost: 10000 }, free: { visible: false, cost: 0 }, flat_jawa: { visible: false, cost: 15000 }, flat_bali: { visible: false, cost: 25000 }, flat_sumatra: { visible: false, cost: 35000 } },
                        paymentSettings: { cod: { visible: true, order: 1, handlingFeePercentage: 4, handlingFeeBase: 'product' }, qris: { visible: true, order: 2, qrImageUrl: '' }, bankTransfer: { visible: true, order: 3, accounts: [] }, },
                        countdownSettings: { active: true, duration: 300 },
                        stockCountdownSettings: { active: true, initialStock: 160, intervalSeconds: 5 },
                        socialProofSettings: { active: true, position: 'top-left', animation: 'slide-up', initialDelaySeconds: 2, displayDurationSeconds: 5, intervalSeconds: 8, customerNames: 'Rina Setyawati\nAndi Prasetyo\nSiti Marlina\nBudi Hartanto\nDella Anggraini\nFajar Nugraha\nNovi Rahmawati\nArdiansyah Putra\nLela Mardiani\nRivaldi Saputra\nMelani Oktaviani\nKevin Aditya\nAyu Pramesti\nRendy Kurniawan\nSiska Amelia\nRama Wijaya\nClara Widyaningrum\nGilang Ramdhan\nIrma Kusumawati\nAldi Pranata', customerCities: 'Jakarta\nBandung\nSubaraya\nYogyakarta\nSemarang\nBekasi\nDepok\nTangerang\nMedan\nPalembang\nMakassar\nDenpasar\nMalang\nPontianak\nPekanbaru\nBatam\nSolo\nCirebon\nManado\nBanjarmasin' },
                        ctaSettings: { active: true, mainText: 'Pesan Sekarang', urgencyText: '{count} sudah beli hari ini', buttonColor: '#6366f1', initialCount: 265, increaseIntervalSeconds: 1, incrementPerSecond: 2, animationEnabled: true, animationType: 'pulse' },
                        submissionCount: 0, createdAt: new Date().toISOString().split('T')[0], showTitle: true, showDescription: true,
                        thankYouPage: { submissionAction: 'show_thank_you_page', redirectUrl: '', title: 'Terima Kasih!', message: 'Pesanan Anda telah kami terima dan akan segera diproses. Berikut adalah rincian pesanan Anda:', showOrderSummary: true, whatsappConfirmation: { active: true, destination: 'assigned_cs', number: '', messageTemplate: 'Hallo, saya ingin melakukan konfirmasi terkait pesanan yang telah saya buat. Berikut detail lengkapnya 👇\n\n📦 Produk: [PRODUCT_NAME]\n🧾 ID Pesanan: [ORDER_ID]\n👤 Nama Pemesan: [CUSTOMER_NAME]\n💰 Total Pembayaran: [TOTAL_PRICE]\n💳 Metode Pembayaran: [PAYMENT_METHOD]\n\nMohon dibantu untuk pengecekan dan proses pemesanan saya. Apabila diperlukan informasi tambahan, saya siap untuk memberikan data yang dibutuhkan.\n\nTerima kasih atas bantuannya 🙏' } },
                        trackingSettings: createDefaultTrackingSettings(), customMessageTemplates: { active: false, templates: {} }
                    });
                    setForm(newForm);
                    setLoading(false); // ✅ Form baru ready, tampilkan UI
                }

                // STEP 2: Check user role for permissions dan fetch current user data (di background)
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
                    if (userDoc) {
                        setCurrentUser(userDoc as User);
                        setCurrentUserRole((userDoc as User).role);

                        // Jika form baru dan user adalah advertiser, auto-select mereka
                        if (!formId && (userDoc as User).role === 'Advertiser') {
                            setForm(prev => prev ? { ...prev, assignedAdvertiserId: user.id } : prev);
                        }
                    }
                }

                // STEP 3: Fetch Brands with LocalStorage Fallback (di background)
                let brandsList: Brand[] = [];
                const localBrandsRaw = localStorage.getItem('brands_local_data');
                if (localBrandsRaw) {
                    try {
                        brandsList = JSON.parse(localBrandsRaw);
                    } catch (e) {
                        console.error("Failed to parse local brands", e);
                    }
                }

                try {
                    const { data: brandsData, error: brandsError } = await fetchWithTimeout(
                        supabase.from('brands').select('*')
                    );

                    if (brandsError) {
                        console.warn("DB Error fetching brands (using local fallback only):", brandsError.message);
                    } else {
                        if (brandsData && brandsData.length > 0) {
                            brandsList = brandsData.map(doc => ({ ...doc } as Brand));
                        }
                    }
                } catch (brandErr) {
                    console.warn("Brands fetch timeout/error, using local:", brandErr);
                }
                setBrands(brandsList);

                // STEP 4: Fetch Advertisers (di background)
                try {
                    const { data: advertisersData } = await fetchWithTimeout(
                        supabase.from('users').select('*').eq('role', 'Advertiser').eq('status', 'Aktif'),
                        15000
                    );
                    const filteredAdvertisers = (advertisersData || [])
                        .filter(doc => doc.name && doc.name.trim() && !doc.name.includes('Pilih')) // Exclude empty or placeholder names
                        .map(doc => ({ ...doc } as User));
                    setAdvertisers(filteredAdvertisers);
                    console.log('✅ Loaded', filteredAdvertisers.length, 'advertisers:', filteredAdvertisers.map(a => a.name));
                } catch (advErr) {
                    console.warn("Advertisers fetch timeout/error:", advErr);
                    setAdvertisers([]);
                }

                // STEP 5: Fetch CS Agents (di background)
                try {
                    const { data: csAgentsData } = await fetchWithTimeout(
                        supabase.from('cs_agents').select('*'),
                        15000
                    );
                    setCsAgents((csAgentsData || []).map(doc => ({ ...doc } as CSAgent)));
                } catch (csErr) {
                    console.warn("CS Agents fetch timeout/error:", csErr);
                    setCsAgents([]);
                }

                // STEP 6: JANGAN LOAD PRODUCTS DI SINI! Load hanya saat brand dipilih untuk performa lebih cepat
                // Products akan di-fetch secara on-demand saat user memilih brand
                console.log('ℹ️ Products will be loaded on-demand when brand is selected');

                // STEP 7: Fetch tracking pixels (di background)
                try {
                    const { data: pixelsDoc } = await fetchWithTimeout(
                        supabase.from('settings').select('*').eq('id', 'trackingPixels').single(),
                        15000
                    );

                    if (pixelsDoc) {
                        const data = pixelsDoc;
                        const pixels: GlobalPixelSettings = { meta: [], google: [], tiktok: [], snack: [] };

                        const pixelKeys: (keyof GlobalPixelSettings)[] = ['meta', 'google', 'tiktok', 'snack'];

                        pixelKeys.forEach(key => {
                            const platformData = data[key];
                            if (platformData && typeof platformData === 'object' && platformData?.active && Array.isArray(platformData?.pixels)) {
                                pixels[key] = platformData.pixels.map((p: any) => ({ id: p.id, name: p.name }));
                            }
                        });

                        setGlobalPixels(pixels);
                    }
                } catch (pixelErr) {
                    console.warn("Pixels fetch timeout/error:", pixelErr);
                    setGlobalPixels({ meta: [], google: [], tiktok: [], snack: [] });
                }

                // Form sudah di-load di STEP 1, skip duplikasi
            } catch (error: any) {
                console.error("Error in background data fetch:", error);
                // Form sudah di-load di STEP 1, error ini hanya untuk dependencies
                // Tidak perlu navigate atau create form di sini
            }
        };

        fetchData();
    }, [formId, navigate]);

    // ... (rest of useEffects and handlers remain largely same but alerts replaced)

    useEffect(() => {
        return () => {
            if (mainImagePreview && mainImagePreview.startsWith('blob:')) URL.revokeObjectURL(mainImagePreview);
            if (qrisImagePreview && qrisImagePreview.startsWith('blob:')) URL.revokeObjectURL(qrisImagePreview);
        }
    }, [mainImagePreview, qrisImagePreview]);


    // Load products ONLY when brand is selected (on-demand loading)
    useEffect(() => {
        if (!form?.brandId) {
            setProducts([]);
            return;
        }

        const loadProductsByBrand = async () => {
            setLoadingProductDetails(true);
            try {
                console.log('🔄 Loading products for brand:', form.brandId);
                const result = await productService.getAllProducts();
                const filtered = (result || []).filter(p => p.brandId === form.brandId);
                setProducts(filtered);
                console.log('✅ Loaded', filtered.length, 'products for brand:', form.brandId);
            } catch (error) {
                console.error('❌ Error loading products:', error);
                setProducts([]);
            } finally {
                setLoadingProductDetails(false);
            }
        };

        loadProductsByBrand();
    }, [form?.brandId]);

    // Fungsi untuk sinkronisasi harga dari produk ke form
    const syncPricesFromProduct = useCallback(async () => {
        if (!form?.productId || syncingPrices) return;

        setSyncingPrices(true);
        try {
            const product = await productService.getProduct(form.productId);

            if (!product || !product.variants || product.variants.length === 0) {
                showToast('Tidak ada data harga dari produk', 'info');
                return;
            }

            // Map harga dari produk ke variantCombinations
            const updatedCombinations = form.variantCombinations.map(combo => {
                // Cari variant produk yang cocok
                const matchingVariant = product.variants.find(v => {
                    const variantName = v.name || '';
                    // Bandingkan dengan nama varian di attributes
                    const comboName = Object.values(combo.attributes).join(' - ');
                    return variantName === comboName ||
                        variantName === combo.attributes['Varian'] ||
                        Object.values(combo.attributes).some(val => variantName.includes(val));
                });

                if (matchingVariant) {
                    return {
                        ...combo,
                        sellingPrice: matchingVariant.price || combo.sellingPrice,
                        strikethroughPrice: matchingVariant.comparePrice || combo.strikethroughPrice,
                        costPrice: matchingVariant.costPrice || combo.costPrice,
                        csCommission: matchingVariant.csCommission ?? combo.csCommission,
                        advCommission: matchingVariant.advCommission ?? combo.advCommission,
                        weight: matchingVariant.weight || combo.weight,
                    };
                }
                return combo;
            });

            setForm(prev => prev ? { ...prev, variantCombinations: updatedCombinations, productVariants: product.variants } : prev);
            showToast(`Harga berhasil disinkronkan dari produk`, 'success');
        } catch (error) {
            console.error('Error syncing prices:', error);
            showToast('Gagal sinkronisasi harga', 'error');
        } finally {
            setSyncingPrices(false);
        }
    }, [form?.productId, form?.variantCombinations, syncingPrices, showToast]);

    // Auto-load product data untuk form edit yang sudah punya productId
    useEffect(() => {
        // Skip jika bukan form edit atau tidak punya productId
        if (!formId || !form?.productId) return;

        // Skip jika sudah punya varian DAN gambar sudah sesuai
        // (ini artinya sudah di-load sebelumnya dalam session ini)
        const alreadyLoaded = form.variantCombinations &&
            form.variantCombinations.length > 0 &&
            form.mainImage; // Ada varian DAN ada gambar

        if (alreadyLoaded) {
            console.log('ℹ️ Form sudah memiliki varian dan gambar, skip auto-load');
            return;
        }

        // Auto-load data produk untuk form edit lama
        const autoLoadProductData = async () => {
            try {
                console.log('🔄 Auto-loading product data untuk form edit:', form.productId);
                const product = await productService.getProduct(form.productId);

                if (product) {
                    console.log('📦 Product data loaded:', product);

                    // SELALU update gambar dari produk (force update untuk form lama)
                    if (product.imageUrl) {
                        setForm(prev => prev ? { ...prev, mainImage: product.imageUrl } : prev);
                        setMainImagePreview(product.imageUrl);
                        console.log('🖼️ Gambar updated dari produk:', product.imageUrl);
                    }

                    // Load dan konversi varian + variantOptions (produk adalah sumber kebenaran)
                    if (product.variants && product.variants.length > 0) {
                        console.log('📊 Converting variants untuk form edit (mengikuti variantOptions produk)');

                        const hasVariantOptions = Array.isArray(product.variantOptions) && product.variantOptions.length > 0;

                        // Bangun productOptions dari variantOptions bila ada, fallback ke satu atribut "Varian"
                        const productOptions: ProductOption[] = hasVariantOptions
                            ? product.variantOptions!.map((opt, idx) => ({
                                id: idx + 1,
                                name: opt.name || `Opsi ${idx + 1}`,
                                values: opt.values || [],
                                displayStyle: 'radio',
                            }))
                            : [{
                                id: 1,
                                name: 'Varian',
                                values: product.variants.map(v => v.name || 'Varian'),
                                displayStyle: 'radio'
                            }];

                        // Helper: map nama varian (e.g., "Amber - Umar") ke attributes per option
                        const mapAttributes = (variantName: string) => {
                            const attributes: Record<string, string> = {};

                            if (hasVariantOptions) {
                                const parts = (variantName || '')
                                    .split('-')
                                    .map(p => p.trim())
                                    .filter(Boolean);

                                product.variantOptions!.forEach((opt, idx) => {
                                    const key = opt.name || `Opsi ${idx + 1}`;
                                    const value = parts[idx] || opt.values?.[0] || '';
                                    attributes[key] = value;
                                });
                            } else {
                                attributes['Varian'] = variantName || 'Varian';
                            }

                            return attributes;
                        };

                        const variantCombinations: VariantCombination[] = product.variants.map((variant, idx) => ({
                            attributes: mapAttributes(variant.name || `Varian ${idx + 1}`),
                            sellingPrice: variant.price || 0,
                            strikethroughPrice: variant.comparePrice || 0,
                            costPrice: variant.costPrice || 0,
                            csCommission: variant.csCommission || 0,
                            advCommission: variant.advCommission || 0,
                            sku: variant.sku || '',
                            weight: variant.weight || 0,
                            initialStock: variant.initialStock || 0
                        }));

                        setForm(prev => prev ? {
                            ...prev,
                            productOptions,
                            variantCombinations,
                            productVariants: product.variants
                        } : prev);

                        console.log('✅ Varian berhasil di-load untuk form edit');
                        showToast(`Form diupdate: ${product.variants.length} varian dimuat`, 'success');
                    }
                }
            } catch (error) {
                console.error('❌ Error auto-loading product data:', error);
            }
        };

        autoLoadProductData();
    }, [formId, form?.productId]); // Trigger saat form.productId tersedia

    useEffect(() => {
        if (!form) return;
        if (form.productOptions.length === 0) {
            const baseVariant = form.variantCombinations[0] || { attributes: {}, sellingPrice: 0 };
            const singleVariantArray = [{ ...baseVariant, attributes: {} }];
            if (JSON.stringify(form.variantCombinations) !== JSON.stringify(singleVariantArray)) {
                setForm(prev => prev ? { ...prev, variantCombinations: singleVariantArray } : null);
            }
            return;
        }
        const sortAndStringify = (obj: Record<string, string>) => {
            const sortedKeys = Object.keys(obj).sort();
            const sortedObj: Record<string, string> = {};
            for (const key of sortedKeys) {
                sortedObj[key] = obj[key];
            }
            return JSON.stringify(sortedObj);
        };
        const optionValues = form.productOptions.map(opt => opt.values);
        if (optionValues.some(v => v.length === 0)) {
            if (form.variantCombinations.length > 0) {
                setForm(prev => prev ? { ...prev, variantCombinations: [] } : null);
            }
            return;
        }
        const combinations = cartesian(...optionValues);
        const existingCombinationsMap = new Map<string, VariantCombination>();
        form.variantCombinations.forEach(combo => {
            existingCombinationsMap.set(sortAndStringify(combo.attributes), combo);
        });
        const newCombinations: VariantCombination[] = combinations.map(combo => {
            const attributes: Record<string, string> = {};
            form.productOptions.forEach((opt, i) => {
                attributes[opt.name] = combo[i];
            });
            const key = sortAndStringify(attributes);
            const existing = existingCombinationsMap.get(key);
            return {
                attributes,
                sellingPrice: existing?.sellingPrice ?? 0,
                strikethroughPrice: existing?.strikethroughPrice,
                weight: existing?.weight,
                costPrice: existing?.costPrice,
                commissionPrice: existing?.commissionPrice,
                csCommission: existing?.csCommission,
                advCommission: existing?.advCommission,
            };
        });
        if (JSON.stringify(form.variantCombinations) !== JSON.stringify(newCombinations)) {
            setForm(prev => prev ? ({ ...prev, variantCombinations: newCombinations }) : null);
        }
    }, [form?.productOptions]);

    const checkSlugAvailability = useCallback(async (slug: string) => {
        if (!slug) { setSlugAvailable(null); return; }
        setSlugChecking(true);
        const { data } = await supabase.from("forms").select('id').eq("slug", slug).maybeSingle();
        const isTaken = !!data && (formId !== data.id);
        setSlugAvailable(!isTaken);
        setSlugChecking(false);
    }, [formId]);

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setForm(prev => prev ? ({ ...prev, slug: newSlug }) : null);
        setSlugAvailable(null);
        const timer = setTimeout(() => { checkSlugAvailability(newSlug); }, 500);
        return () => clearTimeout(timer);
    };

    const handleDragStart = (optIndex: number) => {
        setDraggedOptionId(optIndex);
    };

    const handleDropOption = (targetIndex: number) => {
        if (draggedOptionId === null || draggedOptionId === targetIndex || !form) return;

        setForm(prev => {
            if (!prev) return prev;
            const updated = [...prev.productOptions];
            const [draggedItem] = updated.splice(draggedOptionId, 1);
            updated.splice(targetIndex, 0, draggedItem);
            return { ...prev, productOptions: updated };
        });
        setDraggedOptionId(null);
    };

    const handleDragEnd = () => {
        setDraggedOptionId(null);
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'product' | 'qris') => {
        if (e.target.files && e.target.files.length > 0) {
            if (type === 'main') {
                const file = e.target.files[0];
                if (mainImagePreview && mainImagePreview.startsWith('blob:')) URL.revokeObjectURL(mainImagePreview);
                setMainImageFile(file);
                setMainImageUploading(true);
                setMainImagePreview('');
                uploadFileAndGetURL(file)
                    .then(url => {
                        setMainImagePreview(url);
                        setForm(prev => prev ? ({ ...prev, mainImage: url }) : null);
                        showToast('Gambar utama berhasil diupload!', 'success');
                    })
                    .catch(() => {
                        showToast('Gagal upload gambar utama.', 'error');
                    })
                    .finally(() => {
                        setMainImageUploading(false);
                    });
            } else if (type === 'product') {
                const files = Array.from(e.target.files) as File[];
                setProductImagesUploading(true);
                try {
                    const uploadPromises = files.map(file => uploadFileAndGetURL(file));
                    const urls = await Promise.all(uploadPromises);
                    setForm(prev => {
                        if (!prev) return null;
                        const existingImages = prev.productImages || [];
                        return { ...prev, productImages: [...existingImages, ...urls] };
                    });
                    showToast(`${urls.length} gambar produk berhasil diupload!`, 'success');
                } catch (error) {
                    showToast('Gagal upload gambar produk.', 'error');
                } finally {
                    setProductImagesUploading(false);
                }
            } else {
                const file = e.target.files[0];
                if (qrisImagePreview && qrisImagePreview.startsWith('blob:')) URL.revokeObjectURL(qrisImagePreview);
                setQrisImageFile(file);
                setQrisImagePreview(URL.createObjectURL(file));
                setForm(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        paymentSettings: {
                            ...prev.paymentSettings,
                            qris: {
                                ...prev.paymentSettings.qris,
                                qrImageUrl: URL.createObjectURL(file)
                            }
                        }
                    };
                });
            }
        }
    };

    const handleRemoveProductImage = (index: number) => {
        setForm(prev => {
            if (!prev || !prev.productImages) return prev;
            const newImages = [...prev.productImages];
            newImages.splice(index, 1);
            return { ...prev, productImages: newImages };
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent, type: 'main' | 'product') => {
        e.preventDefault();
        e.stopPropagation();

        const allFiles = Array.from(e.dataTransfer.files) as File[];
        const files = allFiles.filter(file => file.type.startsWith('image/'));
        if (files.length === 0) return;

        if (type === 'main') {
            const file = files[0];
            if (mainImagePreview && mainImagePreview.startsWith('blob:')) URL.revokeObjectURL(mainImagePreview);
            setMainImageFile(file);
            setMainImageUploading(true);
            setMainImagePreview('');
            uploadFileAndGetURL(file)
                .then(url => {
                    setMainImagePreview(url);
                    setForm(prev => prev ? ({ ...prev, mainImage: url }) : null);
                    showToast('Gambar utama berhasil diupload!', 'success');
                })
                .catch(() => {
                    showToast('Gagal upload gambar utama.', 'error');
                })
                .finally(() => {
                    setMainImageUploading(false);
                });
        } else if (type === 'product') {
            setProductImagesUploading(true);
            try {
                const uploadPromises = files.map(file => uploadFileAndGetURL(file));
                const urls = await Promise.all(uploadPromises);
                setForm(prev => {
                    if (!prev) return null;
                    const existingImages = prev.productImages || [];
                    return { ...prev, productImages: [...existingImages, ...urls] };
                });
                showToast(`${urls.length} gambar produk berhasil diupload!`, 'success');
            } catch (error) {
                showToast('Gagal upload gambar produk.', 'error');
            } finally {
                setProductImagesUploading(false);
            }
        }
    };

    const handleSave = useCallback(async () => {
        if (!form || isSaving) return;
        if (!form.assignedAdvertiserId) {
            showToast("Advertiser harus dipilih.", 'error');
            return;
        }
        if (!form.title || form.title.trim() === '') {
            showToast("Judul formulir tidak boleh kosong.", 'error');
            return;
        }
        if (!form.brandId) {
            showToast("Merek harus dipilih.", 'error');
            return;
        }
        if (!form.productId) {
            showToast("Induk produk harus dipilih.", 'error');
            return;
        }
        if (slugAvailable === false) {
            showToast("Slug URL sudah digunakan. Silakan gunakan yang lain.", 'error');
            return;
        }

        // Validate shipping settings - minimal 1 must be visible
        const visibleShippings = Object.values(form.shippingSettings).filter(s => s.visible);
        if (visibleShippings.length === 0) {
            showToast("Minimal 1 metode pengiriman harus ditampilkan.", 'error');
            return;
        }

        // Validate payment settings - minimal 1 must be visible
        const visiblePayments = Object.values(form.paymentSettings).filter(s => s.visible);
        if (visiblePayments.length === 0) {
            showToast("Minimal 1 metode pembayaran harus ditampilkan.", 'error');
            return;
        }

        // Validate CS Assignment
        if (!form.thankYouPage.csAssignment) {
            showToast("Distribusi CS harus diatur.", 'error');
            return;
        }
        if (form.thankYouPage.csAssignment.mode === 'single') {
            if (!form.thankYouPage.csAssignment.singleAgentId) {
                showToast("CS harus dipilih untuk mode Satu CS.", 'error');
                return;
            }
        } else if (form.thankYouPage.csAssignment.mode === 'round_robin') {
            if (!form.thankYouPage.csAssignment.roundRobinAgents || form.thankYouPage.csAssignment.roundRobinAgents.length === 0) {
                showToast("Minimal 1 CS harus ditambahkan untuk mode Round Robin.", 'error');
                return;
            }
        }

        // Validate thank you page settings
        if (!form.thankYouPage.title || form.thankYouPage.title.trim() === '') {
            showToast("Judul halaman terima kasih tidak boleh kosong.", 'error');
            return;
        }

        // Validate tracking settings - minimal 1 pixel harus dipilih untuk halaman formulir
        if (form.trackingSettings?.formPage) {
            const formPageHasPixel = Object.values(form.trackingSettings.formPage).some(
                (setting: FormPixelSetting) => setting.pixelIds && setting.pixelIds.length > 0
            );
            if (!formPageHasPixel) {
                showToast("Minimal 1 pixel harus dipilih untuk Halaman Formulir.", 'error');
                return;
            }
        }

        // Validate tracking settings - minimal 1 pixel harus dipilih untuk halaman terima kasih
        if (form.trackingSettings?.thankYouPage) {
            const thankYouPageHasPixel = Object.values(form.trackingSettings.thankYouPage).some(
                (setting: FormPixelSetting) => setting.pixelIds && setting.pixelIds.length > 0
            );
            if (!thankYouPageHasPixel) {
                showToast("Minimal 1 pixel harus dipilih untuk Halaman Terima Kasih.", 'error');
                return;
            }
        }

        setIsSaving(true);
        try {
            // Check form state before save
            console.log('Form state before save:', {
                variantCombinations: form.variantCombinations,
                firstVariant: form.variantCombinations[0]
            });

            let formToSave: any;
            try {
                formToSave = JSON.parse(JSON.stringify(form));
            } catch (jsonError) {
                console.error("Critical Error: Failed to stringify form object.", jsonError);
                showToast("Terjadi kesalahan sistem (Circular Structure). Silakan refresh halaman dan coba lagi.", 'error');
                setIsSaving(false);
                return;
            }

            // Check formToSave after clone
            console.log('formToSave after JSON clone:', {
                variantCombinations: formToSave.variantCombinations,
                firstVariant: formToSave.variantCombinations[0]
            });
            if (mainImageFile) {
                try {
                    formToSave.mainImage = await uploadFileAndGetURL(mainImageFile);
                } catch (imgError) {
                    console.warn("Main image upload failed", imgError);
                }
            }
            if (qrisImageFile) {
                try {
                    formToSave.paymentSettings.qris.qrImageUrl = await uploadFileAndGetURL(qrisImageFile);
                } catch (qrisError) {
                    console.warn("QRIS image upload failed", qrisError);
                }
            }

            delete formToSave.variants;
            delete formToSave.paymentMethods;
            delete formToSave.shippingMethods;
            delete formToSave.customerInfoFields;
            delete formToSave.createdAt;

            if (!formToSave.id) {
                delete formToSave.id;
            }

            if (formToSave.brandId === "") {
                formToSave.brandId = null;
            }

            // Include productId if selected
            if (form?.productId) {
                formToSave.product_id = form.productId;
            }

            // Debug: Log data yang akan disimpan
            console.log('Saving form data:', {
                id: formToSave.id,
                title: formToSave.title,
                customerFields: formToSave.customerFields,
                variantCombinationsCount: formToSave.variantCombinations?.length,
                variantCombinations: formToSave.variantCombinations,
                firstVariantDetails: formToSave.variantCombinations?.[0] ? {
                    attributes: formToSave.variantCombinations[0].attributes,
                    sellingPrice: formToSave.variantCombinations[0].sellingPrice,
                    csCommission: formToSave.variantCombinations[0].csCommission,
                    advCommission: formToSave.variantCombinations[0].advCommission,
                } : null,
                productImages: formToSave.productImages,
                mainImage: formToSave.mainImage
            });

            let error;
            if (form.id) {
                const result = await supabase.from("forms").update(formToSave).eq('id', form.id);
                error = result.error;
            } else {
                const result = await supabase.from("forms").insert(formToSave);
                error = result.error;
            }

            if (error) {
                console.error("Supabase DB Error Details:", JSON.stringify(error, null, 2));
                throw error;
            }

            // Create analytics record if product is linked
            if (form?.productId && form?.id) {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await productService.createOrGetAnalytics(
                            form.productId,
                            form.id,
                            user.id
                        );
                    }
                } catch (analyticsErr) {
                    console.warn("Failed to create analytics record:", analyticsErr);
                    // Don't fail form save if analytics creation fails
                }
            }

            showToast("Formulir berhasil disimpan!", 'success');
            navigate('/formulir');
        } catch (error: any) {
            console.error("Error saving form:", error);

            let errMsg = "Terjadi kesalahan yang tidak diketahui.";
            if (error) {
                if (error.message) errMsg = error.message;
                else if (error.error_description) errMsg = error.error_description;
                else if (error.details) errMsg = error.details;
                else if (typeof error === 'object') errMsg = JSON.stringify(error);
                else errMsg = String(error);
            }

            showToast(`Gagal menyimpan formulir: ${errMsg}`, 'error');
        } finally {
            setIsSaving(false);
        }
    }, [form, isSaving, slugAvailable, showToast, navigate]);

    const handleDelete = () => {
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = async () => {
        if (!formId || isSaving) return;
        setIsSaving(true);
        try {
            await supabase.from("forms").delete().eq('id', formId);
            showToast("Formulir berhasil dihapus.", 'success');
            navigate('/formulir');
        } catch (error) {
            console.error("Error deleting form:", error);
            showToast("Gagal menghapus formulir.", 'error');
            setIsSaving(false);
        } finally {
            setShowDeleteConfirmation(false);
        }
    };

    // ... (rest of helper functions: handleClose, handleAddOption, handleOptionChange, handleRemoveOption, handleCombinationChange, handleFieldChange, handleSubFieldChange, handleSubNestedFieldChange, handleBankTransferAccountChange, addBankAccount, removeBankAccount, handleTrackingChange remain identical)

    const handleClose = () => navigate('/formulir');

    const handleFieldChange = <T extends keyof Form>(field: T, value: Form[T]) => {
        // Auto-generate slug dari judul jika field yang berubah adalah title
        if (field === 'title') {
            const autoSlug = (value as string)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setForm(prev => prev ? ({ ...prev, [field]: value, slug: autoSlug || prev.slug }) : null);
            // Check slug availability
            if (autoSlug) {
                setSlugAvailable(null);
                const timer = setTimeout(() => { checkSlugAvailability(autoSlug); }, 500);
                return () => clearTimeout(timer);
            }
        } else {
            setForm(prev => prev ? ({ ...prev, [field]: value }) : null);
        }
    };

    const handleSubFieldChange = (mainField: keyof Form, subField: any, value: any) => {
        setForm(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [mainField]: {
                    ...(prev as any)[mainField],
                    [subField]: value
                }
            }
        });
    }

    const handleSubNestedFieldChange = (mainField: any, subField: any, prop: any, val: any) => {
        setForm(prev => {
            if (!prev) return null;
            const mainFieldValue = (prev as any)[mainField] || {};

            if (mainField === 'customerFields' && subField === 'province') {
                if (prop === 'visible') {
                    // If unchecking visible, also uncheck required
                    const newRequired = val ? prev.customerFields.province.required : false;
                    return {
                        ...prev,
                        customerFields: {
                            ...prev.customerFields,
                            province: { ...prev.customerFields.province, visible: val, required: newRequired },
                            city: { ...prev.customerFields.city, visible: val, required: val ? prev.customerFields.city.required : false },
                            district: { ...prev.customerFields.district, visible: val, required: val ? prev.customerFields.district.required : false },
                            village: { ...(prev.customerFields.village || { visible: false, required: false }), visible: val, required: val ? (prev.customerFields.village?.required || false) : false }
                        }
                    };
                } else if (prop === 'required') {
                    return {
                        ...prev,
                        customerFields: {
                            ...prev.customerFields,
                            province: { ...prev.customerFields.province, required: val },
                            city: { ...prev.customerFields.city, required: val },
                            district: { ...prev.customerFields.district, required: val },
                            village: { ...(prev.customerFields.village || { visible: false, required: false }), required: val }
                        }
                    };
                }
            }

            // Auto-off required when any field's visible is unchecked
            if (mainField === 'customerFields' && prop === 'visible' && !val) {
                return {
                    ...prev,
                    customerFields: {
                        ...prev.customerFields,
                        [subField]: { ...prev.customerFields[subField as keyof typeof prev.customerFields], visible: val, required: false }
                    }
                };
            }

            if (mainField === 'thankYouPage' && subField === 'showOrderSummary') {
                return {
                    ...prev,
                    thankYouPage: {
                        ...prev.thankYouPage,
                        showOrderSummary: val
                    }
                }
            }

            // If subField is null, update mainField directly
            if (subField === null) {
                return {
                    ...prev,
                    [mainField]: {
                        ...mainFieldValue,
                        [prop]: val
                    }
                };
            }

            const subFieldValue = mainFieldValue[subField] || {};
            return {
                ...prev,
                [mainField]: {
                    ...mainFieldValue,
                    [subField]: {
                        ...subFieldValue,
                        [prop]: val
                    }
                }
            };
        });
    };

    const handleBankTransferAccountChange = (index: number, prop: keyof BankAccount, value: string) => {
        if (!form) return;
        const newAccounts = [...form.paymentSettings.bankTransfer.accounts];
        newAccounts[index] = { ...newAccounts[index], [prop]: value };
        handleSubNestedFieldChange('paymentSettings', 'bankTransfer', 'accounts', newAccounts);
    };

    const addBankAccount = () => {
        if (!form) return;
        const newAccount: BankAccount = { id: String(Date.now()), bankName: '', accountNumber: '', accountHolder: 'Pemilik', isDefault: false };
        const newAccounts = [...form.paymentSettings.bankTransfer.accounts, newAccount];
        handleSubNestedFieldChange('paymentSettings', 'bankTransfer', 'accounts', newAccounts);
    };

    const removeBankAccount = (index: number) => {
        if (!form) return;
        const newAccounts = form.paymentSettings.bankTransfer.accounts.filter((_, i) => i !== index);
        handleSubNestedFieldChange('paymentSettings', 'bankTransfer', 'accounts', newAccounts);
    };

    const handleTrackingChange = (page: 'formPage' | 'thankYouPage', platform: keyof FormPageTrackingSettings, field: keyof FormPixelSetting, value: any) => {
        setForm(prev => {
            if (!prev) return null;
            return {
                ...prev,
                trackingSettings: {
                    ...prev.trackingSettings!,
                    [page]: {
                        ...prev.trackingSettings![page],
                        [platform]: {
                            ...prev.trackingSettings![page][platform],
                            [field]: value
                        }
                    }
                }
            };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <SpinnerIcon className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-slate-600 dark:text-slate-400">Memuat formulir...</p>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">Formulir tidak ditemukan</p>
                    <button onClick={() => navigate('/formulir')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            <div className="lg:col-span-6 space-y-5">
                {/* Compact Sticky Header - Only essential buttons */}
                <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
                    <div className="flex items-center gap-3">
                        {/* Icon & Title */}
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <PencilIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold text-slate-800 dark:text-white truncate">
                                {formId ? 'Edit Formulir' : 'Buat Formulir'}
                            </h1>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {formId && (
                                <a
                                    href={`${window.location.origin}/#/f/${form.slug || form.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                    title="Preview"
                                >
                                    <EyeIcon className="w-5 h-5" />
                                </a>
                            )}
                            {formId && (
                                <button
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                    title="Hapus"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowCancelConfirmation(true)}
                                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                                Batal
                            </button>
                            {/* Show Next button on step 1 & 2, Save button on step 3 */}
                            {wizardStep < 3 ? (
                                <button
                                    onClick={() => goToStep((wizardStep + 1) as 2 | 3)}
                                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                                >
                                    Selanjutnya <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || mainImageUploading}
                                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 flex items-center gap-1.5 transition-all"
                                >
                                    {(isSaving || mainImageUploading) && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                    {isSaving ? 'Simpan...' : '✓ Simpan'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Wizard Step Tabs */}
                    <div className="flex gap-1 mt-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        <button
                            type="button"
                            onClick={() => goToStep(1, true)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${wizardStep === 1 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            1. Produk
                        </button>
                        <button
                            type="button"
                            onClick={() => goToStep(2, wizardStep > 2)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${wizardStep === 2 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            2. Pengaturan
                        </button>
                        <button
                            type="button"
                            onClick={() => goToStep(3)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${wizardStep === 3 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                            3. Lanjutan
                        </button>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <XIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Mohon lengkapi data berikut:</p>
                                    <ul className="mt-1 text-sm text-red-600 dark:text-red-300 list-disc list-inside">
                                        {validationErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 1: Produk & Varian */}
                {wizardStep === 1 && (
                    <div className="space-y-4">
                        <EditorCard icon={PencilAltIcon} title="Informasi Umum" badge={!form.title || !form.brandId || !form.assignedAdvertiserId ? 'Belum Lengkap' : undefined} badgeColor="red">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Assign Advertiser</label>
                                    <span className="text-xs text-red-500 font-medium">Wajib</span>
                                </div>
                                <select
                                    value={form.assignedAdvertiserId || ''}
                                    onChange={(e) => handleFieldChange('assignedAdvertiserId', e.target.value)}
                                    disabled={!!formId && !!form.assignedAdvertiserId}
                                    className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 ${!form.assignedAdvertiserId
                                        ? 'border-red-500'
                                        : !!formId && !!form.assignedAdvertiserId
                                            ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                                            : 'dark:border-slate-600'
                                        }`}
                                >
                                    <option value="">-- Pilih Advertiser --</option>
                                    {advertisers
                                        .filter(advertiser => advertiser.name && advertiser.name.trim() && !advertiser.name.includes('Pilih'))
                                        .map(advertiser => (
                                            <option key={advertiser.id} value={advertiser.id}>
                                                {advertiser.name} {currentUser?.id === advertiser.id ? '(Anda)' : ''}
                                            </option>
                                        ))}
                                </select>
                                {!form.assignedAdvertiserId && <p className="text-xs text-red-500 mt-1">Advertiser harus dipilih</p>}
                                {!!formId && !!form.assignedAdvertiserId ? (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Advertiser terkunci setelah disimpan dan tidak dapat diubah
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-500 mt-1">Pilih advertiser yang akan mengelola formulir ini.</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Judul Formulir</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-500 font-medium">Wajib</span>
                                        <span className="text-xs text-slate-500">Tampilkan di formulir</span>
                                        <ToggleSwitch checked={form.showTitle} onChange={v => handleFieldChange('showTitle', v)} />
                                    </div>
                                </div>
                                <input type="text" value={form.title} onChange={e => handleFieldChange('title', e.target.value)} className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 ${!form.title ? 'border-red-500' : 'dark:border-slate-600'}`} />
                                {!form.title && <p className="text-xs text-red-500 mt-1">Judul formulir harus diisi</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Deskripsi</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Tampilkan di formulir</span>
                                        <ToggleSwitch checked={form.showDescription} onChange={v => handleFieldChange('showDescription', v)} />
                                    </div>
                                </div>
                                <textarea value={form.description} onChange={e => handleFieldChange('description', e.target.value)} rows={4} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"></textarea>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm">Perataan:</span>
                                    <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'left')} className={`p-1 rounded ${form.descriptionAlign === 'left' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignLeftIcon className="w-5 h-5" /></button>
                                    <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'center')} className={`p-1 rounded ${form.descriptionAlign === 'center' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignCenterIcon className="w-5 h-5" /></button>
                                    <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'right')} className={`p-1 rounded ${form.descriptionAlign === 'right' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignRightIcon className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Merek</label>
                                    <span className="text-xs text-red-500 font-medium">Wajib</span>
                                </div>
                                <select
                                    value={form.brandId || ''}
                                    onChange={(e) => {
                                        const newBrandId = e.target.value;
                                        handleFieldChange('brandId', newBrandId);
                                        // Reset product karena brand berubah - products akan di-load saat useEffect trigger
                                        if (form.productId) {
                                            handleFieldChange('productId', '');
                                            setForm(prev => prev ? { ...prev, productVariants: [] } : prev);
                                            showToast('Produk di-reset karena merek berubah. Tunggu produk dimuat...', 'info');
                                        }
                                    }}
                                    className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 ${!form.brandId ? 'border-red-500' : 'dark:border-slate-600'}`}
                                >
                                    <option value="">-- Pilih Merek --</option>
                                    {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                                </select>
                                {!form.brandId && <p className="text-xs text-red-500 mt-1">Merek harus dipilih</p>}
                                <p className="text-xs text-slate-500 mt-1">Pilih merek terlebih dahulu sebelum memilih produk.</p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium">Induk Produk</label>
                                    <span className="text-xs text-red-500 font-medium">Wajib</span>
                                </div>
                                <select
                                    value={form.productId || ''}
                                    onChange={async (e) => {
                                        const productId = e.target.value;
                                        handleFieldChange('productId', productId);

                                        // Auto-load variants dan gambar dari produk yang dipilih
                                        if (productId) {
                                            try {
                                                const product = await productService.getProduct(productId);
                                                if (product) {
                                                    console.log('📦 Produk dimuat:', product);

                                                    // 1. SELALU update gambar dari produk (tidak peduli form baru/edit)
                                                    if (product.imageUrl) {
                                                        handleFieldChange('mainImage', product.imageUrl);
                                                        setMainImagePreview(product.imageUrl);
                                                        console.log('🖼️ Gambar produk dimuat:', product.imageUrl);
                                                    }

                                                    // 2. Load variants dan konversi ke format form
                                                    if (product.variants && product.variants.length > 0) {
                                                        console.log('📊 Variants dari produk:', product.variants);
                                                        console.log('📊 VariantOptions dari produk:', product.variantOptions);

                                                        // Simpan productVariants untuk referensi
                                                        setForm(prev => prev ? { ...prev, productVariants: product.variants } : prev);

                                                        // Check apakah produk punya variantOptions (multi-atribut)
                                                        const hasVariantOptions = product.variantOptions &&
                                                            Array.isArray(product.variantOptions) &&
                                                            product.variantOptions.length > 0;

                                                        // Bangun productOptions dari variantOptions bila ada, fallback ke satu atribut "Varian"
                                                        const newProductOptions: ProductOption[] = hasVariantOptions
                                                            ? product.variantOptions!.map((opt, idx) => ({
                                                                id: idx + 1,
                                                                name: opt.name || `Opsi ${idx + 1}`,
                                                                values: opt.values || [],
                                                                displayStyle: 'radio' as const
                                                            }))
                                                            : [{
                                                                id: Date.now(),
                                                                name: 'Varian',
                                                                values: product.variants.map(v => v.name || 'Varian'),
                                                                displayStyle: 'radio' as const
                                                            }];

                                                        // Helper: map nama varian (e.g., "HITAM - A4") ke attributes per option
                                                        const mapAttributes = (variantName: string) => {
                                                            const attributes: Record<string, string> = {};

                                                            if (hasVariantOptions) {
                                                                const parts = (variantName || '')
                                                                    .split('-')
                                                                    .map(p => p.trim())
                                                                    .filter(Boolean);

                                                                product.variantOptions!.forEach((opt, idx) => {
                                                                    const key = opt.name || `Opsi ${idx + 1}`;
                                                                    const value = parts[idx] || opt.values?.[0] || '';
                                                                    attributes[key] = value;
                                                                });
                                                            } else {
                                                                attributes['Varian'] = variantName || 'Varian';
                                                            }

                                                            return attributes;
                                                        };

                                                        const newVariantCombinations: VariantCombination[] = product.variants.map((variant, idx) => ({
                                                            attributes: mapAttributes(variant.name || `Varian ${idx + 1}`),
                                                            sellingPrice: variant.price || 0,
                                                            strikethroughPrice: variant.comparePrice || 0,
                                                            costPrice: variant.costPrice || 0,
                                                            csCommission: variant.csCommission || 0,
                                                            advCommission: variant.advCommission || 0,
                                                            sku: variant.sku || '',
                                                            weight: variant.weight || 0,
                                                            initialStock: variant.initialStock || 0
                                                        }));

                                                        console.log('✅ ProductOptions:', newProductOptions);
                                                        console.log('✅ VariantCombinations:', newVariantCombinations);

                                                        // Update form dengan varian yang sudah dikonversi
                                                        setForm(prev => prev ? {
                                                            ...prev,
                                                            productOptions: newProductOptions,
                                                            variantCombinations: newVariantCombinations,
                                                            productVariants: product.variants
                                                        } : prev);

                                                        showToast(`${product.variants.length} varian dimuat dari produk`, 'success');
                                                    } else {
                                                        // Tidak ada varian - reset
                                                        setForm(prev => prev ? {
                                                            ...prev,
                                                            productVariants: [],
                                                            productOptions: [],
                                                            variantCombinations: []
                                                        } : prev);
                                                        showToast('Produk tidak memiliki varian', 'info');
                                                    }
                                                }
                                            } catch (error) {
                                                console.error('Error loading product:', error);
                                                showToast('Gagal memuat data produk', 'error');
                                            }
                                        } else {
                                            // Product ID kosong - reset semua
                                            setForm(prev => prev ? {
                                                ...prev,
                                                productVariants: [],
                                                productOptions: [],
                                                variantCombinations: [],
                                                mainImage: ''
                                            } : prev);
                                            setMainImagePreview('');
                                        }
                                    }}
                                    disabled={!form.brandId || loadingProductDetails}
                                    className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 ${!form.productId ? 'border-red-500' : 'dark:border-slate-600'
                                        } ${loadingProductDetails ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    <option value="">{loadingProductDetails ? '⏳ Memuat produk...' : '-- Pilih Produk --'}</option>
                                    {products
                                        .filter(product => !form.brandId || product.brandId === form.brandId)
                                        .map(product => {
                                            let displayText = product.name;
                                            if (product.sku) displayText += ` (${product.sku})`;
                                            if (product.category) displayText += ` - ${product.category}`;
                                            if (product.basePrice) displayText += ` • Rp ${product.basePrice.toLocaleString('id-ID')}`;
                                            return (
                                                <option key={product.id} value={product.id}>
                                                    {displayText}
                                                </option>
                                            );
                                        })
                                    }
                                </select>
                                {!form.productId && form.brandId && <p className="text-xs text-red-500 mt-1">Produk harus dipilih</p>}
                                {!form.brandId && <p className="text-xs text-orange-500 mt-1">⚠️ Silakan pilih merek terlebih dahulu untuk melihat daftar produk</p>}
                                {loadingProductDetails && <p className="text-xs text-blue-500 mt-1">⏳ Memuat data produk...</p>}
                                {!loadingProductDetails && form.brandId && products.length > 0 && products.filter(p => p.brandId === form.brandId).length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1">⚠️ Tidak ada produk untuk merek yang dipilih. Buat produk terlebih dahulu di menu Produk Induk.</p>
                                )}
                                {!loadingProductDetails && form.brandId && products.length === 0 && (
                                    <p className="text-xs text-slate-500 mt-1">✓ Tidak ada produk untuk merek ini</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Pilih produk dari menu Produk Induk. Formulir akan otomatis menggunakan varian dari produk yang dipilih.</p>

                                {/* Display loaded variants info */}
                                {form.productId && form.productVariants && form.productVariants.length > 0 && (
                                    <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                                            ✓ {form.productVariants.length} Varian Produk Dimuat:
                                        </p>
                                        <div className="space-y-1">
                                            {form.productVariants.slice(0, 3).map((variant: any, index: number) => (
                                                <p key={index} className="text-xs text-indigo-700 dark:text-indigo-300">
                                                    • {variant.name || `Varian ${index + 1}`} - Rp {(variant.price || 0).toLocaleString('id-ID')}
                                                </p>
                                            ))}
                                            {form.productVariants.length > 3 && (
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                                                    ... dan {form.productVariants.length - 3} varian lainnya
                                                </p>
                                            )}
                                        </div>

                                        {/* Tombol Sinkronisasi Harga */}
                                        <button
                                            type="button"
                                            onClick={syncPricesFromProduct}
                                            disabled={syncingPrices}
                                            className="mt-3 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            {syncingPrices ? (
                                                <>
                                                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                                                    Menyinkronkan...
                                                </>
                                            ) : (
                                                <>
                                                    🔄 Sinkronkan Harga dari Produk
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1.5 text-center">
                                            Klik untuk memperbarui harga formulir sesuai dengan harga terbaru di Produk Induk
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">URL Slug</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={handleSlugChange}
                                        className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 pr-24 ${slugAvailable === false ? 'border-red-500' : 'dark:border-slate-600'}`}
                                        placeholder="e.g., promo-spesial-lebaran"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center text-xs">
                                        {slugChecking ? <SpinnerIcon className="w-4 h-4 animate-spin" /> :
                                            slugAvailable === true ? <span className="text-green-500 flex items-center gap-1"><CheckIcon className="w-4 h-4" /> Tersedia</span> :
                                                slugAvailable === false ? <span className="text-red-500 flex items-center gap-1"><XIcon className="w-4 h-4" /> Diambil</span> : null}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">URL: https://form.cuanmax.digital/#/f/<strong>{form.slug || 'id-formulir'}</strong></p>
                            </div>
                        </EditorCard>

                        {/* Atur Opsi Varian */}
                        <EditorCard icon={CubeIcon} title="Atur Opsi Varian" badge={form.variantCombinations?.length ? `${form.variantCombinations.length} Varian` : undefined} badgeColor="indigo">
                            <p className="text-xs text-slate-500 mb-3">Kelola atribut produk (Warna, Ukuran, dll) dan nilai-nilainya</p>

                            {form.productOptions && form.productOptions.length > 0 ? (
                                <div className="space-y-4">
                                    {form.productOptions.map((option, optIndex) => (
                                        <div
                                            key={option.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(optIndex)}
                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                            onDrop={() => handleDropOption(optIndex)}
                                            onDragEnd={handleDragEnd}
                                            className={`p-4 border rounded-lg dark:border-slate-600 transition-all cursor-move ${draggedOptionId === optIndex
                                                    ? 'opacity-50 bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500'
                                                    : 'bg-slate-50 dark:bg-slate-900/30 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                }`}
                                        >
                                            {/* Header Opsi */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="flex items-center gap-2 text-slate-400 cursor-grab active:cursor-grabbing" title="Geser untuk mengubah urutan">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" /></svg>
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm4-8h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2z" /></svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={option.name}
                                                    onChange={(e) => {
                                                        const newName = e.target.value.toUpperCase();
                                                        setForm(prev => {
                                                            if (!prev) return prev;
                                                            const updated = [...prev.productOptions];
                                                            const oldName = updated[optIndex].name;
                                                            updated[optIndex] = { ...updated[optIndex], name: newName };

                                                            // Update atribut di semua combinations
                                                            const updatedCombos = prev.variantCombinations.map(combo => {
                                                                const attrs = { ...combo.attributes };
                                                                if (attrs[oldName] !== undefined) {
                                                                    attrs[newName] = attrs[oldName];
                                                                    delete attrs[oldName];
                                                                }
                                                                return { ...combo, attributes: attrs };
                                                            });

                                                            return { ...prev, productOptions: updated, variantCombinations: updatedCombos };
                                                        });
                                                    }}
                                                    placeholder="Nama atribut (e.g., WARNA)"
                                                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 font-bold text-indigo-600"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (confirm(`Hapus atribut "${option.name}"?`)) {
                                                            setForm(prev => {
                                                                if (!prev) return prev;
                                                                const filtered = prev.productOptions.filter((_, i) => i !== optIndex);
                                                                return { ...prev, productOptions: filtered };
                                                            });
                                                        }
                                                    }}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Nilai-nilai */}
                                            <div className="space-y-2">
                                                {option.values.map((value, valIndex) => (
                                                    <div key={valIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={value}
                                                            onChange={(e) => {
                                                                const newValue = e.target.value;
                                                                setForm(prev => {
                                                                    if (!prev) return prev;
                                                                    const updated = [...prev.productOptions];
                                                                    const oldValue = updated[optIndex].values[valIndex];
                                                                    updated[optIndex].values[valIndex] = newValue;

                                                                    // Update combinations yang menggunakan value ini
                                                                    const updatedCombos = prev.variantCombinations.map(combo => {
                                                                        if (combo.attributes[option.name] === oldValue) {
                                                                            return {
                                                                                ...combo,
                                                                                attributes: { ...combo.attributes, [option.name]: newValue }
                                                                            };
                                                                        }
                                                                        return combo;
                                                                    });

                                                                    return { ...prev, productOptions: updated, variantCombinations: updatedCombos };
                                                                });
                                                            }}
                                                            placeholder={`Nilai ${valIndex + 1}`}
                                                            className="flex-1 px-3 py-1.5 border rounded bg-white dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setForm(prev => {
                                                                    if (!prev) return prev;
                                                                    const updated = [...prev.productOptions];
                                                                    updated[optIndex].values.splice(valIndex, 1);
                                                                    return { ...prev, productOptions: updated };
                                                                });
                                                            }}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setForm(prev => {
                                                            if (!prev) return prev;
                                                            const updated = [...prev.productOptions];
                                                            updated[optIndex].values.push(`Nilai ${updated[optIndex].values.length + 1}`);
                                                            return { ...prev, productOptions: updated };
                                                        });
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                                                >
                                                    + Tambah Nilai
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm(prev => {
                                                if (!prev) return prev;
                                                const newOption: ProductOption = {
                                                    id: Date.now(),
                                                    name: `OPSI ${prev.productOptions.length + 1}`,
                                                    values: ['Nilai 1'],
                                                    displayStyle: 'radio'
                                                };
                                                return { ...prev, productOptions: [...prev.productOptions, newOption] };
                                            });
                                        }}
                                        className="w-full py-2.5 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium text-sm"
                                    >
                                        + Tambah Opsi
                                    </button>

                                    {/* Generate Combinations Button */}
                                    {form.productOptions.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm(prev => {
                                                    if (!prev || !prev.productOptions || prev.productOptions.length === 0) return prev;

                                                    // Generate all combinations dari productOptions
                                                    const optionValues = prev.productOptions.map(opt => opt.values);
                                                    const combinations: VariantCombination[] = [];

                                                    function generateCombos(index: number, current: Record<string, string>) {
                                                        if (index === prev.productOptions.length) {
                                                            combinations.push({
                                                                attributes: { ...current },
                                                                sellingPrice: 0,
                                                                costPrice: 0,
                                                                csCommission: 0,
                                                                advCommission: 0,
                                                                weight: 0,
                                                                initialStock: 10
                                                            });
                                                            return;
                                                        }

                                                        const opt = prev.productOptions[index];
                                                        for (const value of opt.values) {
                                                            generateCombos(index + 1, { ...current, [opt.name]: value });
                                                        }
                                                    }

                                                    generateCombos(0, {});

                                                    showToast(`${combinations.length} kombinasi varian dibuat`, 'success');
                                                    return { ...prev, variantCombinations: combinations };
                                                });
                                            }}
                                            className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-lg"
                                        >
                                            🔄 Generate {form.productOptions.reduce((acc, opt) => acc * opt.values.length, 1)} Kombinasi Varian
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-500 mb-3">Belum ada opsi varian</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForm(prev => {
                                                if (!prev) return prev;
                                                const newOption: ProductOption = {
                                                    id: Date.now(),
                                                    name: 'WARNA',
                                                    values: ['HITAM', 'MERAH', 'BIRU'],
                                                    displayStyle: 'radio'
                                                };
                                                return { ...prev, productOptions: [newOption] };
                                            });
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                                    >
                                        Buat Opsi Pertama
                                    </button>
                                </div>
                            )}
                        </EditorCard>

                        {/* Next Step Button */}
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => goToStep(2)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
                            >
                                Selanjutnya <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Pengaturan */}
                {wizardStep === 2 && (
                    <div className="space-y-4">
                        <EditorCard icon={UserGroupIcon} title="Informasi Pelanggan">
                            <p className="text-xs text-slate-500 mb-3">Default: Nama Lengkap, WhatsApp, dan Alamat Lengkap (wajib)</p>
                            {(['name', 'whatsapp', 'email', 'province', 'address'] as const).map(key => {
                                const isProvince = key === 'province';
                                const isAddress = key === 'address';
                                const isName = key === 'name';
                                const displayLabel = isAddress ? 'Alamat Lengkap' : isName ? 'Nama Lengkap' : key;

                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <span className="capitalize text-sm">{displayLabel}</span>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={(form.customerFields as any)[key].visible} onChange={e => handleSubNestedFieldChange('customerFields', key, 'visible', e.target.checked)} className="rounded" /> Tampilkan</label>
                                                <label className="flex items-center gap-1 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={(form.customerFields as any)[key].required && (form.customerFields as any)[key].visible}
                                                        onChange={e => handleSubNestedFieldChange('customerFields', key, 'required', e.target.checked)}
                                                        disabled={!(form.customerFields as any)[key].visible}
                                                        className="rounded disabled:opacity-50"
                                                    />
                                                    Wajib
                                                </label>
                                            </div>
                                        </div>

                                        {/* Minimum Characters Input for Name and Address */}
                                        {(isName || isAddress) && (form.customerFields as any)[key].visible && (
                                            <div className="ml-6 mt-1 flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                                                <label className="text-xs text-slate-600 dark:text-slate-400">Min Karakter:</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="500"
                                                    value={(form.customerFields as any)[key].minCharacters || 0}
                                                    onChange={e => handleSubNestedFieldChange('customerFields', key, 'minCharacters', Math.max(0, parseInt(e.target.value) || 0))}
                                                    className="w-16 p-1.5 border rounded text-xs bg-white dark:bg-slate-700 dark:border-slate-600"
                                                />
                                            </div>
                                        )}

                                        {/* Show City, District, and Village as children of Province */}
                                        {isProvince && form.customerFields.province.visible && (
                                            <div className="ml-6 mt-1 space-y-1">
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border-l-2 border-indigo-300 dark:border-indigo-600">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">↳ City (Kota/Kabupaten)</span>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.city.visible} disabled className="rounded opacity-50" /> Tampilkan</label>
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.city.required} disabled className="rounded opacity-50" /> Wajib</label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border-l-2 border-indigo-300 dark:border-indigo-600">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">↳ District (Kecamatan)</span>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.district.visible} disabled className="rounded opacity-50" /> Tampilkan</label>
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.district.required} disabled className="rounded opacity-50" /> Wajib</label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border-l-2 border-indigo-300 dark:border-indigo-600">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">↳ Village (Kelurahan/Desa)</span>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.village?.visible || false} disabled className="rounded opacity-50" /> Tampilkan</label>
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.village?.required || false} disabled className="rounded opacity-50" /> Wajib</label>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border-l-2 border-indigo-300 dark:border-indigo-600">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">↳ Postal Code (Kode Pos)</span>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.postalCode?.visible || false} disabled className="rounded opacity-50" /> Tampilkan</label>
                                                        <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={form.customerFields.postalCode?.required || false} disabled className="rounded opacity-50" /> Wajib</label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </EditorCard>

                        <EditorCard icon={ShipIcon} title="Pengaturan Pengiriman" defaultOpen={false}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-slate-500">Minimal 1 metode pengiriman harus ditampilkan</p>
                                <span className="text-xs text-red-500 font-medium">Wajib</span>
                            </div>
                            {(Object.keys(SHIPPING_LABELS) as Array<keyof ShippingSettings>).map(key => (
                                <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <label htmlFor={`shipping-toggle-${key}`} className="flex-grow flex items-center gap-2 cursor-pointer">
                                        <ToggleSwitch checked={form.shippingSettings[key].visible} onChange={v => handleSubNestedFieldChange('shippingSettings', key, 'visible', v)} />
                                        <span className="text-sm">{SHIPPING_LABELS[key]}</span>
                                    </label>
                                    {key !== 'free' && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm">Biaya per kg</label>
                                            <input
                                                type="number"
                                                value={form.shippingSettings[key].cost}
                                                onChange={e => handleSubNestedFieldChange('shippingSettings', key, 'cost', parseFloat(e.target.value))}
                                                className="w-28 p-1.5 border rounded text-sm bg-white dark:bg-slate-700 dark:border-slate-600"
                                                disabled={!form.shippingSettings[key].visible}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </EditorCard>

                        <EditorCard icon={CreditCardIcon} title="Pengaturan Pembayaran" defaultOpen={false}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-slate-500">Minimal 1 metode pembayaran harus ditampilkan</p>
                                <span className="text-xs text-red-500 font-medium">Wajib</span>
                            </div>
                            {(Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>).sort((a, b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99)).map(key => {
                                const setting = form.paymentSettings[key];
                                const config = PAYMENT_CONFIG[key];
                                if (!config) return null;
                                const Icon = config.icon;

                                return (
                                    <div key={key} className="p-3 border rounded-lg dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <ToggleSwitch checked={setting.visible} onChange={v => handleSubNestedFieldChange('paymentSettings', key, 'visible', v)} />
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium text-sm">{config.label}</span>
                                            </label>
                                        </div>
                                        {setting.visible && (
                                            <div className="pl-8 space-y-2">
                                                {key === 'cod' && (
                                                    <>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span>Biaya Penanganan:</span>
                                                            <input type="number" value={(setting as CODSettings).handlingFeePercentage || 0} onChange={e => handleSubNestedFieldChange('paymentSettings', 'cod', 'handlingFeePercentage', parseFloat(e.target.value))} className="w-20 p-1 border rounded bg-white dark:bg-slate-700 dark:border-slate-600" />
                                                            <span>%</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm mt-2">
                                                            <span>Basis Hitung:</span>
                                                            <select
                                                                value={(setting as CODSettings).handlingFeeBase || 'product_and_shipping'}
                                                                onChange={e => handleSubNestedFieldChange('paymentSettings', 'cod', 'handlingFeeBase', e.target.value)}
                                                                className="p-1 border rounded bg-white dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                            >
                                                                <option value="product">Harga Produk saja</option>
                                                                <option value="product_and_shipping">Harga Produk + Ongkir</option>
                                                            </select>
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-1">Biaya ini akan ditambahkan ke total tagihan.</div>
                                                    </>
                                                )}
                                                {key === 'bankTransfer' && (
                                                    <div>
                                                        {(setting as BankTransferSetting).accounts.map((acc, index) => (
                                                            <div key={acc.id} className="flex items-center gap-2 mb-2">
                                                                <input type="text" placeholder="Nama Bank" value={acc.bankName} onChange={e => handleBankTransferAccountChange(index, 'bankName', e.target.value)} className="flex-1 p-1 border rounded bg-white dark:bg-slate-700 dark:border-slate-600 text-sm" />
                                                                <input type="text" placeholder="Nomor Rekening" value={acc.accountNumber} onChange={e => handleBankTransferAccountChange(index, 'accountNumber', e.target.value)} className="flex-1 p-1 border rounded bg-white dark:bg-slate-700 dark:border-slate-600 text-sm" />
                                                                <input type="text" placeholder="Atas Nama" value={acc.accountHolder} onChange={e => handleBankTransferAccountChange(index, 'accountHolder', e.target.value)} className="flex-1 p-1 border rounded bg-white dark:bg-slate-700 dark:border-slate-600 text-sm" />
                                                                <button type="button" onClick={() => removeBankAccount(index)}><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={addBankAccount} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">+ Tambah Rekening</button>
                                                    </div>
                                                )}
                                                {key === 'qris' && (
                                                    <div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                                {qrisImagePreview ? <img src={qrisImagePreview} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-500">No Image</span>}
                                                            </div>
                                                            <label className="cursor-pointer text-sm text-indigo-600 hover:underline">
                                                                Unggah Kode QR
                                                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'qris')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </EditorCard>

                        <EditorCard icon={CheckCircleFilledIcon} title="Halaman Terima Kasih" defaultOpen={false}>
                            <div className="flex gap-4 mb-4">
                                <button type="button" onClick={() => handleSubNestedFieldChange('thankYouPage', 'submissionAction', null, 'show_thank_you_page')} className={`flex-1 py-2 px-4 rounded-lg border text-sm ${form.thankYouPage.submissionAction === 'show_thank_you_page' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 dark:border-gray-700'}`}>Tampilkan Halaman Terima Kasih</button>
                                <button type="button" onClick={() => handleSubNestedFieldChange('thankYouPage', 'submissionAction', null, 'redirect_to_url')} className={`flex-1 py-2 px-4 rounded-lg border text-sm ${form.thankYouPage.submissionAction === 'redirect_to_url' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 dark:border-gray-700'}`}>Alihkan ke URL Lain</button>
                            </div>

                            {form.thankYouPage.submissionAction === 'show_thank_you_page' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Judul Halaman</label>
                                        <input type="text" value={form.thankYouPage.title} onChange={e => handleSubNestedFieldChange('thankYouPage', null, 'title', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pesan Utama</label>
                                        <textarea value={form.thankYouPage.message} onChange={e => handleSubNestedFieldChange('thankYouPage', null, 'message', e.target.value)} rows={3} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"></textarea>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <label className="text-sm font-medium">Tampilkan Ringkasan Pesanan</label>
                                        <ToggleSwitch checked={form.thankYouPage.showOrderSummary} onChange={v => handleSubNestedFieldChange('thankYouPage', null, 'showOrderSummary', v)} />
                                    </div>

                                    <div className="border-t pt-4 mt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium flex items-center gap-2"><WhatsAppIcon className="w-4 h-4 text-green-500" /> Konfirmasi ke WhatsApp</label>
                                            <ToggleSwitch checked={form.thankYouPage.whatsappConfirmation.active} onChange={v => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'active', v)} />
                                        </div>

                                        {form.thankYouPage.whatsappConfirmation.active && (
                                            <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Tujuan Pesan</label>
                                                    <div className="flex gap-2 text-sm">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="radio" name="waDestination" checked={form.thankYouPage.whatsappConfirmation.destination === 'assigned_cs'} onChange={() => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'destination', 'assigned_cs')} /> CS Tertunjuk
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input type="radio" name="waDestination" checked={form.thankYouPage.whatsappConfirmation.destination === 'custom'} onChange={() => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'destination', 'custom')} /> Nomor Custom
                                                        </label>
                                                    </div>
                                                </div>

                                                {form.thankYouPage.whatsappConfirmation.destination === 'custom' && (
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1">Nomor WhatsApp Admin</label>
                                                        <input type="tel" value={form.thankYouPage.whatsappConfirmation.number} onChange={e => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'number', e.target.value)} placeholder="628..." className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm" />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-xs font-medium mb-1">Isi Pesan Template</label>
                                                    <textarea value={form.thankYouPage.whatsappConfirmation.messageTemplate} onChange={e => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'messageTemplate', e.target.value)} rows={4} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm"></textarea>
                                                    <p className="text-xs text-slate-500 mt-1">Gunakan: [PRODUCT_NAME], [ORDER_ID], [CUSTOMER_NAME], [TOTAL_PRICE], [PAYMENT_METHOD]</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-1">URL Pengalihan</label>
                                    <input type="url" value={form.thankYouPage.redirectUrl} onChange={e => handleSubNestedFieldChange('thankYouPage', null, 'redirectUrl', e.target.value)} placeholder="https://..." className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600" />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Tersedia parameter URL: [ORDER_ID], [TOTAL_PRICE], [CUSTOMER_NAME], [CUSTOMER_PHONE], [CUSTOMER_EMAIL]
                                    </p>
                                </div>
                            )}
                        </EditorCard>

                        <EditorCard icon={UserGroupIcon} title="Distribusi CS (Rotator)" badge={form.thankYouPage?.csAssignment?.singleAgentId || (form.thankYouPage?.csAssignment?.roundRobinAgents?.length || 0) > 0 ? 'Aktif' : undefined} badgeColor="green" defaultOpen={false}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs text-slate-500">Pilih mode dan assign minimal 1 CS</p>
                                <span className="text-xs text-red-500 font-medium">Wajib</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'mode', 'single')} className={`flex-1 py-2 px-3 rounded-lg border text-sm ${form.thankYouPage.csAssignment?.mode === 'single' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 dark:border-gray-700'}`}>Satu CS</button>
                                    <button type="button" onClick={() => handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'mode', 'round_robin')} className={`flex-1 py-2 px-3 rounded-lg border text-sm ${form.thankYouPage.csAssignment?.mode === 'round_robin' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 dark:border-gray-700'}`}>Round Robin (Bagi Rata)</button>
                                </div>

                                {form.thankYouPage.csAssignment?.mode === 'single' ? (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Pilih CS</label>
                                        <select
                                            value={form.thankYouPage.csAssignment?.singleAgentId || ''}
                                            onChange={e => handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'singleAgentId', e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                        >
                                            <option value="">Pilih Agen...</option>
                                            {csAgents.map(agent => (
                                                <option key={agent.id} value={agent.id}>{agent.name} ({agent.status})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Daftar CS & Bobot (%)</p>
                                        {form.thankYouPage.csAssignment?.roundRobinAgents?.map((setting, index) => {
                                            const agent = csAgents.find(a => a.id === setting.csAgentId);
                                            return (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="flex-grow p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm">{agent?.name || 'Unknown Agent'}</div>
                                                    <input
                                                        type="number"
                                                        value={setting.percentage}
                                                        onChange={e => {
                                                            const newArr = [...(form.thankYouPage.csAssignment?.roundRobinAgents || [])];
                                                            newArr[index] = { ...newArr[index], percentage: parseInt(e.target.value) || 0 };
                                                            handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'roundRobinAgents', newArr);
                                                        }}
                                                        className="w-16 p-2 border rounded text-center dark:bg-slate-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newArr = (form.thankYouPage.csAssignment?.roundRobinAgents || []).filter((_, i) => i !== index);
                                                            handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'roundRobinAgents', newArr);
                                                        }}
                                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )
                                        })}

                                        <div className="flex gap-2 mt-2">
                                            <select id="new-cs-select" className="flex-grow p-2 border rounded-lg bg-white dark:bg-slate-700 text-sm">
                                                <option value="">Tambah Agen...</option>
                                                {csAgents.filter(a => !(form.thankYouPage.csAssignment?.roundRobinAgents || []).some(ra => ra.csAgentId === a.id)).map(agent => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const select = document.getElementById('new-cs-select') as HTMLSelectElement;
                                                    const agentId = select.value;
                                                    if (agentId) {
                                                        const newArr = [...(form.thankYouPage.csAssignment?.roundRobinAgents || []), { csAgentId: agentId, percentage: 50 }];
                                                        handleSubNestedFieldChange('thankYouPage', 'csAssignment', 'roundRobinAgents', newArr);
                                                        select.value = "";
                                                    }
                                                }}
                                                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </EditorCard>

                        {/* Step Navigation */}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => goToStep(1, true)}
                                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm flex items-center gap-2"
                            >
                                <ChevronDownIcon className="w-4 h-4 rotate-90" /> Kembali
                            </button>
                            <button
                                type="button"
                                onClick={() => goToStep(3)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
                            >
                                Selanjutnya <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Lanjutan */}
                {wizardStep === 3 && (
                    <div className="space-y-4">
                        <EditorCard icon={CheckCircleFilledIcon} title="Platform Tracking Terpilih">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Pilih platform untuk fokus tracking pada campaign tertentu. Hanya pixel dari platform yang dipilih yang akan dimuat di halaman formulir.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {(
                                        [
                                            { value: null, name: 'Semua Platform', icon: CheckCircleFilledIcon },
                                            { value: 'meta' as const, name: 'Meta Pixel', icon: MetaIcon },
                                            { value: 'tiktok' as const, name: 'TikTok Pixel', icon: TikTokIcon },
                                            { value: 'google' as const, name: 'Google Analytics', icon: GoogleIcon },
                                            { value: 'snack' as const, name: 'Snack Video', icon: SnackVideoIcon },
                                        ] as const
                                    ).map((platform) => {
                                        const IconComponent = platform.icon;
                                        const isSelected = form.assignedPlatform === platform.value;

                                        return (
                                            <button
                                                key={platform.value || 'all'}
                                                type="button"
                                                onClick={() => handleFieldChange('assignedPlatform', platform.value)}
                                                className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                    }`}
                                            >
                                                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-600 dark:text-slate-400'
                                                    }`} />
                                                <span className={`text-xs font-medium text-center ${isSelected ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {platform.name}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-indigo-700 dark:text-indigo-200">
                                    <strong>Info:</strong> Setting ini adalah default. Kamu bisa override dengan parameter URL: <code className="bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded text-xs">?platform=meta|tiktok|google|snack</code>
                                </div>
                            </div>
                        </EditorCard>

                        <EditorCard icon={TrackingIcon} title="Pelacakan & Pixel" defaultOpen={false}>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-3 border-b pb-1">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Halaman Formulir</h4>
                                        <span className="text-xs text-red-500 font-medium">Min. 1 Pixel</span>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.keys(PLATFORM_CONFIG).map(key => {
                                            const platformKey = key as keyof FormPageTrackingSettings;
                                            const config = PLATFORM_CONFIG[platformKey];
                                            const setting = form.trackingSettings?.formPage[platformKey];

                                            const globalOptions = globalPixels[platformKey as keyof GlobalPixelSettings] || [];

                                            return (
                                                <div key={`form-${key}`} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                                    <div className="flex items-center gap-2 mb-2 font-medium">
                                                        <config.icon className="w-4 h-4" /> {config.name}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Pixel ID</label>
                                                            <PixelMultiSelectDropdown
                                                                options={globalOptions}
                                                                selectedIds={setting?.pixelIds || []}
                                                                onChange={(ids) => handleTrackingChange('formPage', platformKey, 'pixelIds', ids)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Event</label>
                                                            <select
                                                                value={setting?.eventName || 'ViewContent'}
                                                                onChange={(e) => handleTrackingChange('formPage', platformKey, 'eventName', e.target.value)}
                                                                className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-700"
                                                            >
                                                                {TRACKING_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-3 border-b pb-1">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Halaman Terima Kasih</h4>
                                        <span className="text-xs text-red-500 font-medium">Min. 1 Pixel</span>
                                    </div>
                                    <div className="space-y-4">
                                        {Object.keys(PLATFORM_CONFIG).map(key => {
                                            const platformKey = key as keyof FormPageTrackingSettings;
                                            const config = PLATFORM_CONFIG[platformKey];
                                            const setting = form.trackingSettings?.thankYouPage[platformKey];
                                            const globalOptions = globalPixels[platformKey as keyof GlobalPixelSettings] || [];

                                            return (
                                                <div key={`thankyou-${key}`} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                                    <div className="flex items-center gap-2 mb-2 font-medium">
                                                        <config.icon className="w-4 h-4" /> {config.name}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Pixel ID</label>
                                                            <PixelMultiSelectDropdown
                                                                options={globalOptions}
                                                                selectedIds={setting?.pixelIds || []}
                                                                onChange={(ids) => handleTrackingChange('thankYouPage', platformKey, 'pixelIds', ids)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">Event</label>
                                                            <select
                                                                value={setting?.eventName || 'Purchase'}
                                                                onChange={(e) => handleTrackingChange('thankYouPage', platformKey, 'eventName', e.target.value)}
                                                                className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-700"
                                                            >
                                                                {TRACKING_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </EditorCard>

                        <EditorCard icon={CodeIcon} title="Custom Scripts (Advanced)" defaultOpen={false}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Script Halaman Formulir (Head)</label>
                                    <textarea
                                        value={form.customScripts?.formPage || ''}
                                        onChange={e => handleSubNestedFieldChange('customScripts', null, 'formPage', e.target.value)}
                                        rows={4}
                                        className="w-full p-2 border rounded-lg font-mono text-xs bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                                        placeholder="<!-- Masukkan script custom di sini, e.g., GTM, Hotjar -->"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Script Halaman Terima Kasih (Head)</label>
                                    <textarea
                                        value={form.customScripts?.thankYouPage || ''}
                                        onChange={e => handleSubNestedFieldChange('customScripts', null, 'thankYouPage', e.target.value)}
                                        rows={4}
                                        className="w-full p-2 border rounded-lg font-mono text-xs bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                                        placeholder="Gunakan [TOTAL_PRICE], [ORDER_ID] untuk data dinamis."
                                    />
                                </div>
                            </div>
                        </EditorCard>

                        <EditorCard icon={ClockIcon} title="Fitur Tambahan (Konversi)" defaultOpen={false}>
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <ClockIcon className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-sm font-medium">Countdown Timer</p>
                                        <p className="text-xs text-slate-500">Batas waktu checkout (e.g. 10:00)</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {form.countdownSettings?.active && (
                                        <input
                                            type="number"
                                            value={form.countdownSettings.duration}
                                            onChange={e => handleSubNestedFieldChange('countdownSettings', null, 'duration', parseInt(e.target.value))}
                                            className="w-16 p-1 text-sm border rounded text-center"
                                        />
                                    )}
                                    <ToggleSwitch checked={form.countdownSettings?.active || false} onChange={v => handleSubNestedFieldChange('countdownSettings', null, 'active', v)} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mt-3">
                                <div className="flex items-center gap-3">
                                    <ArchiveIcon className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <p className="text-sm font-medium">Stock Countdown (Fake)</p>
                                        <p className="text-xs text-slate-500">Stok menipis otomatis</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {form.stockCountdownSettings?.active && (
                                        <input
                                            type="number"
                                            value={form.stockCountdownSettings.initialStock}
                                            onChange={e => handleSubNestedFieldChange('stockCountdownSettings', null, 'initialStock', parseInt(e.target.value))}
                                            className="w-16 p-1 text-sm border rounded text-center"
                                            title="Stok Awal"
                                        />
                                    )}
                                    <ToggleSwitch checked={form.stockCountdownSettings?.active || false} onChange={v => handleSubNestedFieldChange('stockCountdownSettings', null, 'active', v)} />
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <ChatBubbleIcon className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium">Social Proof (Sales Popup)</p>
                                            <p className="text-xs text-slate-500">Notifikasi pembelian palsu</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={form.socialProofSettings?.active || false} onChange={v => handleSubNestedFieldChange('socialProofSettings', null, 'active', v)} />
                                </div>
                                {form.socialProofSettings?.active && (
                                    <div className="space-y-3 mt-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Posisi Popup</label>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                {(['bottom-left', 'bottom-right', 'top-left', 'top-right'] as const).map(pos => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => handleSubNestedFieldChange('socialProofSettings', null, 'position', pos)}
                                                        className={`px-3 py-2 text-xs font-medium rounded border transition ${form.socialProofSettings?.position === pos
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-500'
                                                            }`}
                                                    >
                                                        {pos === 'bottom-left' && '↙ Bawah Kiri'}
                                                        {pos === 'bottom-right' && '↘ Bawah Kanan'}
                                                        {pos === 'top-left' && '↖ Atas Kiri'}
                                                        {pos === 'top-right' && '↗ Atas Kanan'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Animasi</label>
                                            <div className="grid grid-cols-3 gap-2 mt-1">
                                                {(['slide-up', 'slide-down', 'fade-in'] as const).map(anim => (
                                                    <button
                                                        key={anim}
                                                        onClick={() => handleSubNestedFieldChange('socialProofSettings', null, 'animation', anim)}
                                                        className={`px-3 py-2 text-xs font-medium rounded border transition ${form.socialProofSettings?.animation === anim
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-500'
                                                            }`}
                                                    >
                                                        {anim === 'slide-up' && '↑ Geser'}
                                                        {anim === 'slide-down' && '↓ Turun'}
                                                        {anim === 'fade-in' && '✦ Muncul'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Mulai Setelah (detik)</label>
                                                <input
                                                    type="number"
                                                    value={form.socialProofSettings.initialDelaySeconds || 5}
                                                    onChange={e => handleSubNestedFieldChange('socialProofSettings', null, 'initialDelaySeconds', parseInt(e.target.value))}
                                                    className="w-full p-2 text-xs border rounded mt-1 bg-white dark:bg-slate-800"
                                                    min="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Durasi Tampil (detik)</label>
                                                <input
                                                    type="number"
                                                    value={form.socialProofSettings.displayDurationSeconds || 5}
                                                    onChange={e => handleSubNestedFieldChange('socialProofSettings', null, 'displayDurationSeconds', parseInt(e.target.value))}
                                                    className="w-full p-2 text-xs border rounded mt-1 bg-white dark:bg-slate-800"
                                                    min="1"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Interval Tampil (detik)</label>
                                                <input
                                                    type="number"
                                                    value={form.socialProofSettings.intervalSeconds || 10}
                                                    onChange={e => handleSubNestedFieldChange('socialProofSettings', null, 'intervalSeconds', parseInt(e.target.value))}
                                                    className="w-full p-2 text-xs border rounded mt-1 bg-white dark:bg-slate-800"
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Daftar Nama (pisahkan dengan baris baru)"
                                            value={form.socialProofSettings.customerNames}
                                            onChange={e => handleSubNestedFieldChange('socialProofSettings', null, 'customerNames', e.target.value)}
                                            className="w-full p-2 text-xs border rounded"
                                            rows={3}
                                        />
                                        <textarea
                                            placeholder="Daftar Kota (pisahkan dengan baris baru)"
                                            value={form.socialProofSettings.customerCities}
                                            onChange={e => handleSubNestedFieldChange('socialProofSettings', null, 'customerCities', e.target.value)}
                                            className="w-full p-2 text-xs border rounded"
                                            rows={3}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg mt-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <CursorClickIcon className="w-5 h-5 text-blue-500" />
                                    <p className="text-sm font-medium">Teks Tombol & Urgensi</p>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Teks Tombol</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Pesan Sekarang"
                                            value={form.ctaSettings?.mainText || ''}
                                            onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'mainText', e.target.value)}
                                            className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Teks Urgensi</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. {count} sudah beli hari ini (gunakan {count} untuk angka)"
                                            value={form.ctaSettings?.urgencyText || ''}
                                            onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'urgencyText', e.target.value)}
                                            className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Angka Awal</label>
                                            <input
                                                type="number"
                                                placeholder="265"
                                                value={form.ctaSettings?.initialCount || 265}
                                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'initialCount', parseInt(e.target.value))}
                                                className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Interval (detik)</label>
                                            <input
                                                type="number"
                                                placeholder="1"
                                                value={form.ctaSettings?.increaseIntervalSeconds || 1}
                                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'increaseIntervalSeconds', parseInt(e.target.value))}
                                                className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Tambah Per Interval</label>
                                            <input
                                                type="number"
                                                placeholder="2"
                                                value={form.ctaSettings?.incrementPerSecond || 2}
                                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'incrementPerSecond', parseInt(e.target.value))}
                                                className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1">Warna Tombol</label>
                                            <input
                                                type="color"
                                                value={form.ctaSettings?.buttonColor || '#6366f1'}
                                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'buttonColor', e.target.value)}
                                                className="w-full p-2 text-sm border rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1">Kode Hex Warna</label>
                                        <input
                                            type="text"
                                            placeholder="#6366f1"
                                            value={form.ctaSettings?.buttonColor || '#6366f1'}
                                            onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'buttonColor', e.target.value)}
                                            className="w-full p-2 text-sm border rounded bg-white dark:bg-slate-700 dark:border-slate-600 font-mono"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                                        <label className="text-sm font-medium">Animasi Tombol</label>
                                        <ToggleSwitch
                                            checked={form.ctaSettings?.animationEnabled || false}
                                            onChange={v => handleSubNestedFieldChange('ctaSettings', null, 'animationEnabled', v)}
                                        />
                                    </div>
                                    {form.ctaSettings?.animationEnabled && (
                                        <div>
                                            <label className="block text-xs font-medium mb-2">Pilih Jenis Animasi</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { value: 'pulse', label: '💓 Pulse', desc: 'Denyut Lembut' },
                                                    { value: 'shine', label: '✨ Shine', desc: 'Cahaya Gerak' },
                                                    { value: 'bounce', label: '⬆️ Bounce', desc: 'Memantul' },
                                                    { value: 'scale', label: '📏 Scale', desc: 'Membesar' },
                                                    { value: 'glow', label: '🌟 Glow', desc: 'Bersinar' },
                                                    { value: 'rotate', label: '🔄 Rotate', desc: 'Berputar' }
                                                ].map(anim => (
                                                    <button
                                                        key={anim.value}
                                                        onClick={() => handleSubNestedFieldChange('ctaSettings', null, 'animationType', anim.value as any)}
                                                        className={`p-2 text-xs font-medium rounded border transition ${form.ctaSettings?.animationType === anim.value
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-500'
                                                            }`}
                                                    >
                                                        <div>{anim.label}</div>
                                                        <div className="text-xs opacity-70">{anim.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </EditorCard>

                        {/* Step Navigation */}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => goToStep(2, true)}
                                className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm flex items-center gap-2"
                            >
                                <ChevronDownIcon className="w-4 h-4 rotate-90" /> Kembali
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || mainImageUploading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2 disabled:opacity-60"
                            >
                                {(isSaving || mainImageUploading) && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                {isSaving ? 'Menyimpan...' : '✓ Simpan Formulir'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="hidden lg:block lg:col-span-4 sticky top-6">
                {/* Preview Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/30">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button onClick={() => setActivePreviewTab('form')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activePreviewTab === 'form'
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                    }`}>Formulir</button>
                                <button onClick={() => setActivePreviewTab('thankyou')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activePreviewTab === 'thankyou'
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                    }`}>Terima Kasih</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                        {activePreviewTab === 'form' ? (
                            <FormPreview form={form} />
                        ) : (
                            <ThankYouPagePreview thankYouPage={form.thankYouPage} formTitle={form.title} />
                        )}
                    </div>
                </div>
            </div>

            {showDeleteConfirmation && form && (
                <ConfirmationModal
                    isOpen={true}
                    title="Hapus Formulir"
                    message={`Apakah Anda yakin ingin menghapus formulir "${form.title}"? Tindakan ini tidak dapat dibatalkan.`}
                    confirmLabel="Ya, Hapus"
                    variant="danger"
                    onConfirm={confirmDelete}
                    onClose={() => setShowDeleteConfirmation(false)}
                    isLoading={isSaving}
                />
            )}

            {showCancelConfirmation && (
                <ConfirmationModal
                    isOpen={true}
                    title="Batalkan Perubahan?"
                    message="Perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin keluar?"
                    confirmLabel="Ya, Keluar"
                    variant="warning"
                    onConfirm={() => {
                        setShowCancelConfirmation(false);
                        handleClose();
                    }}
                    onClose={() => setShowCancelConfirmation(false)}
                />
            )}
        </div>
    );
};

export default FormEditorPage;








