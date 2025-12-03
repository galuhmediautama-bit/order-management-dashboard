import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Form, ProductOption, VariantCombination, ShippingSettings, PaymentSettings, VariantDisplayStyle, CustomerFieldSetting, ShippingSetting, BankTransferSetting, PaymentSetting, BankAccount, CODSettings, QRISSettings, ThankYouPageSettings, TrackingEventName, FormPageTrackingSettings, FormPixelSetting, CSAgent, CSAssignmentMode, CSAssignmentSettings, Brand, MessageTemplates, User } from '../types';
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
import SpinnerIcon from '../components/icons/SpinnerIcon';
import CheckIcon from '../components/icons/CheckIcon';
import XIcon from '../components/icons/XIcon';
import PencilAltIcon from '../components/icons/PencilAltIcon';
import TagIcon from '../components/icons/TagIcon';
import ShipIcon from '../components/icons/ShipIcon';
import CreditCardIcon from '../components/icons/CreditCardIcon';
import ChatBubbleIcon from '../components/icons/ChatBubbleIcon';
import ClockIcon from '../components/icons/ClockIcon';
import ArchiveIcon from '../components/icons/ArchiveIcon';
import CursorClickIcon from '../components/icons/CursorClickIcon';
import Bars3Icon from '../components/icons/Bars3Icon';
import Bars4Icon from '../components/icons/Bars4Icon';
import Squares2x2Icon from '../components/icons/Squares2x2Icon';
import CodeIcon from '../components/icons/CodeIcon';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';


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

const PLATFORM_CONFIG: Record<keyof FormPageTrackingSettings, { name: string; icon: React.FC<{className?: string}> }> = {
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

const EditorCard: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; }> = ({ icon: Icon, title, children }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/30 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-6 space-y-5">
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

const FormPreview: React.FC<{ form: Form }> = ({ form }) => {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

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
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

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

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border dark:border-gray-700 text-slate-900 dark:text-slate-100">
            <div className="mb-4">
                {currentGalleryImage && <img src={currentGalleryImage} alt={form.title} className="w-full aspect-square object-cover rounded-lg transition-opacity duration-300" />}
                {!currentGalleryImage && <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-lg text-slate-500">Gambar Utama</div>}
            </div>
            
            {form.productImages && form.productImages.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    <div 
                        onClick={() => handleGalleryImageClick(form.mainImage)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 cursor-pointer transition-all ${
                            currentGalleryImage === form.mainImage 
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
                            className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 cursor-pointer transition-all ${
                                currentGalleryImage === img 
                                ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' 
                                : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                            }`}
                        >
                            <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                        </div>
                    ))}
                </div>
            )}
            
            {(form.showTitle ?? true) && <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{form.title || 'Judul Produk'}</h1>}
            {(form.showDescription ?? true) && <p className={descriptionClasses}>{form.description || 'Deskripsi produk akan muncul di sini.'}</p>}

            {form.countdownSettings?.active && (
                <div className="my-4 text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg shadow-sm font-medium">
                    ⏳ Pesanan Anda akan di-hold selama <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>.
                </div>
            )}

            {form.productOptions.length > 0 && <div className="mb-4 space-y-4">
                {form.productOptions.map((option, index) => {
                    const displayStyle = option.displayStyle || 'dropdown';
                    return (
                        <div key={option.id}>
                            <div className="flex justify-between items-baseline mb-2">
                                <label className="font-semibold block text-sm text-slate-900 dark:text-slate-100">{option.name}:</label>
                            </div>
                             {displayStyle === 'dropdown' && (
                                <select
                                    onChange={(e) => setSelectedOptions(prev => ({...prev, [option.name]: e.target.value}))}
                                    value={selectedOptions[option.name] || ''}
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    {option.values.map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            )}
                            {displayStyle === 'radio' && (
                                <div className="space-y-2">
                                    {option.values.map(val => (
                                        <label 
                                            key={val} 
                                            className={`flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                selectedOptions[option.name] === val 
                                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md transform scale-[1.01]' 
                                                    : 'border-gray-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                    selectedOptions[option.name] === val ? 'border-white' : 'border-gray-400'
                                                }`}>
                                                    {selectedOptions[option.name] === val && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                                </div>
                                                <input
                                                    type="radio"
                                                    name={option.name}
                                                    value={val}
                                                    checked={selectedOptions[option.name] === val}
                                                    onChange={(e) => setSelectedOptions(prev => ({...prev, [option.name]: e.target.value}))}
                                                    className="hidden"
                                                />
                                                <span className="font-medium">{val}</span>
                                            </div>
                                            {form.stockCountdownSettings?.active && variantStock[val] !== undefined && (
                                                <span className={`text-sm font-medium animate-pulse ${
                                                    selectedOptions[option.name] === val ? 'text-red-200' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                    Stok: {variantStock[val]} pcs
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                            {displayStyle === 'modern' && (
                                <div className="flex flex-col gap-2">
                                    {option.values.map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setSelectedOptions(prev => ({...prev, [option.name]: val}))}
                                            className={`w-full flex justify-between items-center px-3 py-1.5 border rounded-lg text-sm transition-colors ${selectedOptions[option.name] === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}`}
                                        >
                                            <span>{val}</span>
                                            {form.stockCountdownSettings?.active && variantStock[val] !== undefined && (
                                                <span className="text-xs font-medium opacity-80 animate-pulse">
                                                    Stok: {variantStock[val]}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>}
            
            <div className="mb-4">
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Informasi Pelanggan:</h3>
                <form className="space-y-3">
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
                     {form.customerFields.address.visible && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Alamat Lengkap {form.customerFields.address.required && <span className="text-red-500">*</span>}</label>
                            <textarea rows={3} placeholder="Sertakan nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, dan kode pos" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    )}
                </form>
            </div>

            {(Object.values(form.shippingSettings) as ShippingSetting[]).some(s => s.visible) && <div className="mb-4">
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
            </div>}

            {(Object.values(form.paymentSettings) as PaymentSetting[]).some(s => s.visible) && <div className="mb-4">
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Metode Pembayaran:</h3>
                <div className="space-y-2">
                    {(Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>)
                        .filter(key => form.paymentSettings[key].visible)
                        .sort((a, b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99))
                        .map(key => {
                        const setting = form.paymentSettings[key];
                        const config = PAYMENT_CONFIG[key];
                        const Icon = config.icon;
                        if (!setting.visible) return null;
                        
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
                                {key === 'bankTransfer' && selectedPaymentKey === 'bankTransfer' && (
                                    <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm space-y-2">
                                        <p className="font-semibold">Silakan transfer ke salah satu rekening berikut:</p>
                                        {(setting as BankTransferSetting).accounts && (setting as BankTransferSetting).accounts.length > 0 ? (
                                            (setting as BankTransferSetting).accounts.map(acc => (
                                                <div key={acc.id}>
                                                    <p><strong>{acc.bankName}:</strong> {acc.accountNumber} (a/n {acc.accountHolder})</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p>Detail rekening belum diatur.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>}

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
                <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-slate-100"><span >Total</span><span>{total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span></div>
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
        </div>
    );
};

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
    
    const [form, setForm] = useState<Form | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

     useEffect(() => {
        const fetchData = async () => {
            try {
                // Check user role for permissions
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: userDoc } = await supabase.from('users').select('*').eq('id', user.id).single();
                    if (userDoc) {
                        setCurrentUserRole((userDoc as User).role);
                    }
                }

                // Fetch Brands with LocalStorage Fallback (Robust implementation)
                let brandsList: Brand[] = [];
                const localBrandsRaw = localStorage.getItem('brands_local_data');
                if (localBrandsRaw) {
                    try {
                        brandsList = JSON.parse(localBrandsRaw);
                    } catch (e) {
                        console.error("Failed to parse local brands", e);
                    }
                }

                const { data: brandsData, error: brandsError } = await supabase.from('brands').select('*');

                if (brandsError) {
                    console.warn("DB Error fetching brands (using local fallback only):", brandsError.message);
                } else {
                    if (brandsData && brandsData.length > 0) {
                        brandsList = brandsData.map(doc => ({ ...doc } as Brand));
                    }
                }
                setBrands(brandsList);

                const { data: csAgentsData } = await supabase.from('cs_agents').select('*');
                setCsAgents((csAgentsData || []).map(doc => ({ ...doc } as CSAgent)));
                
                const { data: pixelsDoc } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
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

                if (formId) {
                    const { data: docSnap } = await supabase.from("forms").select('*').eq('id', formId).single();
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
                    } else {
                        console.error("Form not found!");
                        navigate('/formulir');
                    }
                } else {
                    const newForm = normalizeForm({
                        id: '', title: '', mainImage: '', description: '', descriptionAlign: 'left', productOptions: [],
                        variantCombinations: [], customerFields: { name: { visible: true, required: true }, whatsapp: { visible: true, required: true }, email: { visible: true, required: false }, address: { visible: true, required: true },},
                        shippingSettings: { regular: { visible: true, cost: 10000 }, free: { visible: false, cost: 0 }, flat_jawa: { visible: false, cost: 15000 }, flat_bali: { visible: false, cost: 25000 }, flat_sumatra: { visible: false, cost: 35000 } },
                        paymentSettings: { cod: { visible: true, order: 1, handlingFeePercentage: 0, handlingFeeBase: 'product' }, qris: { visible: false, order: 2, qrImageUrl: '' }, bankTransfer: { visible: true, order: 3, accounts: [] },},
                        submissionCount: 0, createdAt: new Date().toISOString().split('T')[0], showTitle: true, showDescription: true,
                        thankYouPage: { submissionAction: 'show_thank_you_page', redirectUrl: '', title: 'Terima Kasih!', message: 'Pesanan Anda telah kami terima dan akan segera diproses. Berikut adalah rincian pesanan Anda:', showOrderSummary: true, whatsappConfirmation: { active: true, destination: 'custom', number: '', messageTemplate: '' }},
                        trackingSettings: createDefaultTrackingSettings(), customMessageTemplates: { active: false, templates: {} }
                    });
                    setForm(newForm);
                }
            } catch (error: any) {
                console.error("Error fetching dependencies:", error);
                
                if (!formId) {
                     const newForm = normalizeForm({
                        id: '', title: '', mainImage: '', description: '', descriptionAlign: 'left', productOptions: [],
                        variantCombinations: [], customerFields: { name: { visible: true, required: true }, whatsapp: { visible: true, required: true }, email: { visible: true, required: false }, address: { visible: true, required: true },},
                        shippingSettings: { regular: { visible: true, cost: 10000 }, free: { visible: false, cost: 0 }, flat_jawa: { visible: false, cost: 15000 }, flat_bali: { visible: false, cost: 25000 }, flat_sumatra: { visible: false, cost: 35000 } },
                        paymentSettings: { cod: { visible: true, order: 1, handlingFeePercentage: 0, handlingFeeBase: 'product' }, qris: { visible: false, order: 2, qrImageUrl: '' }, bankTransfer: { visible: true, order: 3, accounts: [] },},
                        submissionCount: 0, createdAt: new Date().toISOString().split('T')[0], showTitle: true, showDescription: true,
                        thankYouPage: { submissionAction: 'show_thank_you_page', redirectUrl: '', title: 'Terima Kasih!', message: 'Pesanan Anda telah kami terima dan akan segera diproses. Berikut adalah rincian pesanan Anda:', showOrderSummary: true, whatsappConfirmation: { active: true, destination: 'custom', number: '', messageTemplate: '' }},
                        trackingSettings: createDefaultTrackingSettings(), customMessageTemplates: { active: false, templates: {} }
                    });
                    setForm(newForm);
                } else {
                    showToast(`Gagal memuat formulir: ${error.message || JSON.stringify(error)}`, 'error');
                    navigate('/formulir');
                }
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
            setForm(prev => prev ? ({...prev, variantCombinations: newCombinations}) : null);
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

    const handleSave = async () => {
        if (!form || isSaving) return;
        if (!form.title || form.title.trim() === '') {
            showToast("Judul formulir tidak boleh kosong.", 'error');
            return;
        }
        if (slugAvailable === false) {
            showToast("Slug URL sudah digunakan. Silakan gunakan yang lain.", 'error');
            return;
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
            
            // Debug: Log data yang akan disimpan
            console.log('Saving form data:', {
                id: formToSave.id,
                title: formToSave.title,
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
    };

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
    
    const handleAddOption = () => {
        if (!form) return;
        const newOption: ProductOption = { id: Date.now(), name: `Opsi ${form.productOptions.length + 1}`, values: [], displayStyle: 'dropdown' };
        setForm(prev => prev ? ({ ...prev, productOptions: [...prev.productOptions, newOption] }) : null);
    };

    const handleOptionChange = (id: number, field: 'name' | 'values' | 'displayStyle', value: string | string[] | VariantDisplayStyle) => {
        setForm(prev => {
            if (!prev) return null;
            const oldOption = prev.productOptions.find(opt => opt.id === id);
            const oldName = oldOption?.name;
            const newOptions = prev.productOptions.map(opt => opt.id === id ? { ...opt, [field]: value } : opt);
            let newFormState = { ...prev, productOptions: newOptions };
            if (field === 'name' && oldName && oldName !== value && typeof value === 'string') {
                const newName = value;
                const newCombinations = newFormState.variantCombinations.map(combo => {
                    if (Object.prototype.hasOwnProperty.call(combo.attributes, oldName)) {
                        const { [oldName]: renamedValue, ...restAttrs } = combo.attributes;
                        return {
                            ...combo,
                            attributes: {
                                ...restAttrs,
                                [newName]: renamedValue
                            }
                        };
                    }
                    return combo;
                });
                newFormState = { ...newFormState, variantCombinations: newCombinations };
            }
            return newFormState;
        });
    };

    const handleRemoveOption = (id: number) => {
        if (!form) return;
        const optionToRemove = form.productOptions.find(opt => opt.id === id);
        if (!optionToRemove) return;
        setForm(prev => {
            if (!prev) return null;
            const newOptions = prev.productOptions.filter(opt => opt.id !== id);
            const newCombinations = prev.variantCombinations.map(combo => {
                const { [optionToRemove.name]: _, ...rest } = combo.attributes;
                return { ...combo, attributes: rest };
            });
            const uniqueCombinations: VariantCombination[] = [];
            newCombinations.forEach(combo => {
                if (!uniqueCombinations.some(uc => JSON.stringify(uc.attributes) === JSON.stringify(combo.attributes))) {
                    uniqueCombinations.push(combo);
                }
            });
            return { ...prev, productOptions: newOptions, variantCombinations: uniqueCombinations };
        });
    };
    
    const handleCombinationChange = (index: number, field: keyof VariantCombination, value: any) => {
        if (field === 'sellingPrice' || field === 'strikethroughPrice' || field === 'weight' || field === 'costPrice' || field === 'commissionPrice' || field === 'csCommission' || field === 'advCommission') {
            const numValue = value === '' ? undefined : parseFloat(value);
            setForm(prev => {
                if (!prev) return null;
                const newCombinations = [...prev.variantCombinations];
                newCombinations[index] = { ...newCombinations[index], [field]: numValue };
                return { ...prev, variantCombinations: newCombinations };
            });
        } else {
            setForm(prev => {
                if (!prev) return null;
                const newCombinations = [...prev.variantCombinations];
                newCombinations[index] = { ...newCombinations[index], [field]: value };
                return { ...prev, variantCombinations: newCombinations };
            });
        }
    };
    
    const handleFieldChange = <T extends keyof Form>(field: T, value: Form[T]) => {
        setForm(prev => prev ? ({ ...prev, [field]: value }) : null);
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
            const subFieldValue = mainFieldValue[subField] || {};
            if (mainField === 'thankYouPage' && subField === 'showOrderSummary') {
                return {
                    ...prev,
                    thankYouPage: {
                        ...prev.thankYouPage,
                        showOrderSummary: val
                    }
                }
            }
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
        const newAccount: BankAccount = { id: Date.now(), bankName: '', accountNumber: '', accountHolder: 'Pemilik' };
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

    if (!form) {
        return <div className="flex justify-center p-10"><SpinnerIcon className="w-10 h-10 animate-spin text-indigo-500" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
            <div className="lg:col-span-6 space-y-6">
                 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <PencilIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {formId ? 'Edit Formulir' : 'Buat Formulir Baru'}
                                </h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Kelola dan kustomisasi formulir pesanan</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formId && (
                                 <button onClick={handleDelete} disabled={isSaving} className="px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-sm">
                                    <TrashIcon className="w-4 h-4" /> Hapus
                                </button>
                            )}
                            <button onClick={handleClose} className="px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold text-sm transition-all shadow-sm">Batal</button>
                            <button onClick={handleSave} disabled={isSaving || mainImageUploading} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 font-bold text-sm disabled:opacity-60 flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-indigo-500/30">
                                {(isSaving || mainImageUploading) && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                {isSaving ? 'Menyimpan...' : mainImageUploading ? 'Mengupload Gambar...' : 'Simpan Formulir'}
                            </button>
                        </div>
                    </div>
                </div>

                <EditorCard icon={PencilAltIcon} title="Informasi Umum">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium">Judul Formulir</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Tampilkan di formulir</span>
                                <ToggleSwitch checked={form.showTitle} onChange={v => handleFieldChange('showTitle', v)} />
                            </div>
                        </div>
                        <input type="text" value={form.title} onChange={e => handleFieldChange('title', e.target.value)} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600" />
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
                             <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'left')} className={`p-1 rounded ${form.descriptionAlign === 'left' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignLeftIcon className="w-5 h-5"/></button>
                             <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'center')} className={`p-1 rounded ${form.descriptionAlign === 'center' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignCenterIcon className="w-5 h-5"/></button>
                             <button type="button" onClick={() => handleFieldChange('descriptionAlign', 'right')} className={`p-1 rounded ${form.descriptionAlign === 'right' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}><AlignRightIcon className="w-5 h-5"/></button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Merek</label>
                        <select
                            value={form.brandId || ''}
                            onChange={e => handleFieldChange('brandId', e.target.value)}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                        >
                            <option value="">Tidak ada merek</option>
                            {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Mengaitkan formulir ini ke merek akan membatasi visibilitasnya sesuai peran pengguna.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Slug URL</label>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Custom Domain (Opsional)</label>
                        <input 
                            type="text" 
                            value={form.customDomain || ''} 
                            onChange={e => handleFieldChange('customDomain', e.target.value)} 
                            placeholder="https://tokosaya.com" 
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                        />
                        <p className="text-xs text-slate-500 mt-1">Jika diisi, link pratinjau dan salin link akan menggunakan domain ini (e.g., https://tokosaya.com/?form_id=...).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Gambar Utama</label>
                        <div className="flex items-start gap-4">
                            <div 
                                className="relative w-32 h-32 flex-shrink-0 border-2 border-dashed rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'main')}
                            >
                                {mainImagePreview ? (
                                    <>
                                        <img src={mainImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        {mainImageUploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                            <label className="cursor-pointer">
                                                <PencilIcon className="w-6 h-6 text-white" />
                                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'main')} disabled={mainImageUploading} />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                        <PhotoIcon className="w-8 h-8 text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500">Upload</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'main')} disabled={mainImageUploading} />
                                    </label>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                    <p className="font-medium mb-1">Panduan Upload Gambar:</p>
                                    <ul className="text-xs text-slate-500 space-y-1">
                                        <li>• Ukuran maksimal: 10MB</li>
                                        <li>• Format: JPG, PNG, GIF</li>
                                        <li>• Rasio 1:1 atau 4:3 direkomendasikan</li>
                                    </ul>
                                </div>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                                    <PhotoIcon className="w-4 h-4" />
                                    <span>Pilih dari Komputer</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(e, 'main')} disabled={mainImageUploading} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Gambar Produk</label>
                        <div 
                            className="relative border-2 border-dashed rounded-lg p-4 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'product')}
                        >
                            <div className="flex flex-wrap gap-3">
                                {form?.productImages && form.productImages.length > 0 && form.productImages.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 group">
                                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-slate-200 dark:border-slate-600" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveProductImage(idx)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            {idx + 1}
                                        </div>
                                    </div>
                                ))}
                                
                                <label className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    {productImagesUploading ? (
                                        <SpinnerIcon className="w-8 h-8 text-indigo-600 animate-spin" />
                                    ) : (
                                        <>
                                            <PhotoIcon className="w-6 h-6 text-slate-400 mb-1" />
                                            <span className="text-xs text-slate-500">Tambah</span>
                                        </>
                                    )}
                                    <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleImageChange(e, 'product')} disabled={productImagesUploading} />
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">Maksimal 9 gambar. Drag untuk mengubah urutan. Gambar pertama akan menjadi thumbnail.</p>
                        </div>
                    </div>
                </EditorCard>
                
                <EditorCard icon={TagIcon} title="Opsi & Varian Produk">
                    {form.productOptions.map((option, index) => (
                        <div key={option.id} className="p-3 border rounded-lg dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-center mb-2">
                                <input
                                    type="text"
                                    value={option.name}
                                    onChange={e => handleOptionChange(option.id, 'name', e.target.value)}
                                    className="font-semibold bg-transparent"
                                />
                                <button onClick={() => handleRemoveOption(option.id)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Nilai Opsi</label>
                                    <TagInput
                                        values={option.values}
                                        onChange={newValues => handleOptionChange(option.id, 'values', newValues)}
                                    />
                                </div>
                                 <div>
                                    <label className="block text-xs font-medium mb-1">Tampilan Varian</label>
                                    <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                        {(['dropdown', 'radio', 'modern'] as VariantDisplayStyle[]).map(style => (
                                            <button
                                                key={style}
                                                type="button"
                                                onClick={() => handleOptionChange(option.id, 'displayStyle', style)}
                                                className={`flex-1 p-1.5 rounded-md text-sm flex items-center justify-center gap-1.5 transition-colors ${option.displayStyle === style ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-600'}`}
                                                title={style.charAt(0).toUpperCase() + style.slice(1)}
                                            >
                                                {style === 'dropdown' && <Bars3Icon className="w-5 h-5" />}
                                                {style === 'radio' && <Bars4Icon className="w-5 h-5" />}
                                                {style === 'modern' && <Squares2x2Icon className="w-5 h-5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddOption} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Tambah Opsi (e.g., Warna, Ukuran)</button>
                
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left font-medium text-slate-500">Varian</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Harga Jual</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Harga Coret</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Modal</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Komisi CS</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Komisi Adv</th>
                                    <th className="p-2 text-left font-medium text-slate-500">Berat (gr)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {form.variantCombinations.map((combo, index) => (
                                    <tr key={index} className="align-top">
                                        <td className="p-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                                            {Object.values(combo.attributes).join(' / ') || 'Produk Tunggal'}
                                        </td>
                                        <td className="p-1"><input type="number" value={combo.sellingPrice} onChange={e => handleCombinationChange(index, 'sellingPrice', e.target.value)} onFocus={e => e.target.select()} className="w-28 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" /></td>
                                        <td className="p-1"><input type="number" value={combo.strikethroughPrice ?? ''} onChange={e => handleCombinationChange(index, 'strikethroughPrice', e.target.value)} onFocus={e => e.target.select()} className="w-28 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" /></td>
                                        <td className="p-1"><input type="number" value={combo.costPrice ?? ''} onChange={e => handleCombinationChange(index, 'costPrice', e.target.value)} onFocus={e => e.target.select()} className="w-28 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" /></td>
                                        <td className="p-1"><input type="number" value={combo.csCommission ?? ''} onChange={e => handleCombinationChange(index, 'csCommission', e.target.value)} onFocus={e => e.target.select()} className="w-28 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" placeholder="0" /></td>
                                        <td className="p-1"><input type="number" value={combo.advCommission ?? ''} onChange={e => handleCombinationChange(index, 'advCommission', e.target.value)} onFocus={e => e.target.select()} className="w-28 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" placeholder="0" /></td>
                                        <td className="p-1"><input type="number" value={combo.weight ?? ''} onChange={e => handleCombinationChange(index, 'weight', e.target.value)} onFocus={e => e.target.select()} className="w-20 p-1.5 border rounded bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 dark:border-slate-600" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </EditorCard>
                
                <EditorCard icon={UserGroupIcon} title="Informasi Pelanggan">
                    {Object.keys(form.customerFields).map(key => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                            <span className="capitalize text-sm">{key}</span>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={(form.customerFields as any)[key].visible} onChange={e => handleSubNestedFieldChange('customerFields', key, 'visible', e.target.checked)} className="rounded" /> Tampilkan</label>
                                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={(form.customerFields as any)[key].required} onChange={e => handleSubNestedFieldChange('customerFields', key, 'required', e.target.checked)} className="rounded" /> Wajib</label>
                            </div>
                        </div>
                    ))}
                </EditorCard>

                <EditorCard icon={ShipIcon} title="Pengaturan Pengiriman">
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

                <EditorCard icon={CreditCardIcon} title="Pengaturan Pembayaran">
                     {(Object.keys(form.paymentSettings) as Array<keyof PaymentSettings>).sort((a,b) => (form.paymentSettings[a].order || 99) - (form.paymentSettings[b].order || 99)).map(key => {
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
                                                <div className="text-xs text-slate-500">Biaya ini akan ditambahkan ke total tagihan.</div>
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

                <EditorCard icon={CheckCircleFilledIcon} title="Halaman Terima Kasih">
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
                                                    <input type="radio" name="waDestination" checked={form.thankYouPage.whatsappConfirmation.destination === 'custom'} onChange={() => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'destination', 'custom')} /> Nomor Custom
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input type="radio" name="waDestination" checked={form.thankYouPage.whatsappConfirmation.destination === 'assigned_cs'} onChange={() => handleSubNestedFieldChange('thankYouPage', 'whatsappConfirmation', 'destination', 'assigned_cs')} /> CS Tertunjuk
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
                                            <p className="text-xs text-slate-500 mt-1">Gunakan: [ORDER_ID], [CUSTOMER_NAME], [TOTAL_PRICE]</p>
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

                <EditorCard icon={UserGroupIcon} title="Distribusi CS (Rotator)">
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
                                                <TrashIcon className="w-4 h-4"/>
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

                <EditorCard icon={TrackingIcon} title="Pelacakan & Pixel">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-1">Halaman Formulir</h4>
                            <div className="space-y-4">
                                {Object.keys(PLATFORM_CONFIG).map(key => {
                                    const platformKey = key as keyof FormPageTrackingSettings;
                                    const config = PLATFORM_CONFIG[platformKey];
                                    const setting = form.trackingSettings?.formPage[platformKey];
                                    
                                    const globalOptions = globalPixels[platformKey as keyof GlobalPixelSettings] || [];

                                    return (
                                        <div key={`form-${key}`} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2 font-medium">
                                                <config.icon className="w-4 h-4"/> {config.name}
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
                            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-1">Halaman Terima Kasih</h4>
                            <div className="space-y-4">
                                {Object.keys(PLATFORM_CONFIG).map(key => {
                                    const platformKey = key as keyof FormPageTrackingSettings;
                                    const config = PLATFORM_CONFIG[platformKey];
                                    const setting = form.trackingSettings?.thankYouPage[platformKey];
                                    const globalOptions = globalPixels[platformKey as keyof GlobalPixelSettings] || [];

                                    return (
                                        <div key={`thankyou-${key}`} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <div className="flex items-center gap-2 mb-2 font-medium">
                                                <config.icon className="w-4 h-4"/> {config.name}
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

                <EditorCard icon={CodeIcon} title="Custom Scripts (Advanced)">
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

                <EditorCard icon={ClockIcon} title="Fitur Tambahan (Konversi)">
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
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                placeholder="Teks Tombol (e.g. Pesan Sekarang)" 
                                value={form.ctaSettings?.mainText} 
                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'mainText', e.target.value)}
                                className="w-full p-2 text-sm border rounded"
                            />
                            <input 
                                type="text" 
                                placeholder="Teks Bawah (e.g. {count} orang sudah checkout)" 
                                value={form.ctaSettings?.urgencyText} 
                                onChange={e => handleSubNestedFieldChange('ctaSettings', null, 'urgencyText', e.target.value)}
                                className="w-full p-2 text-sm border rounded"
                            />
                        </div>
                    </div>
                </EditorCard>
            </div>

            <div className="hidden lg:block lg:col-span-4 sticky top-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/30">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button onClick={() => setActivePreviewTab('form')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                                    activePreviewTab === 'form' 
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                                }`}>Formulir</button>
                                <button onClick={() => setActivePreviewTab('thankyou')} className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                                    activePreviewTab === 'thankyou' 
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
                    <div className="bg-slate-100 dark:bg-slate-900 p-4 h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar relative">
                        {activePreviewTab === 'form' ? (
                            <>
                                <FormPreview form={form} />
                                {form.socialProofSettings?.active && (
                                    <SocialProofPopupPreview settings={form.socialProofSettings} productName={form.title || 'Produk'} />
                                )}
                            </>
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
        </div>
    );
};

export default FormEditorPage;