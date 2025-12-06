
import type { Form, ProductOption, VariantCombination, ShippingSettings, PaymentSettings, ThankYouPageSettings, TrackingEventName, User, UserRole, ShippingSetting } from './types';

const OWNER_EMAIL = 'galuhmediautama@gmail.com';

export const capitalizeWords = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getNormalizedRole = (role: string | undefined, email?: string | null): UserRole => {
    // 1. Hardcoded Owner Override
    if (email && email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
        return 'Super Admin';
    }

    // ⚠️ IMPORTANT: Do NOT default to Super Admin if role is undefined
    // This prevents accidental elevation to admin when profile hasn't loaded yet
    if (!role) {
        console.warn('⚠️ getNormalizedRole called with undefined role. This may indicate a profile loading issue.');
        return 'Admin'; // Safe fallback to lower privilege, not Super Admin
    }

    const lower = role.toLowerCase().trim();
    
    // 2. Standard Role Normalization
    if (lower === 'owner' || lower === 'super admin' || lower === 'superadmin') return 'Super Admin';
    if (lower === 'admin' || lower === 'administrator') return 'Admin';
    if (lower === 'keuangan' || lower === 'finance') return 'Keuangan';
    if (lower === 'customer service' || lower === 'cs' || lower === 'support') return 'Customer service';
    if (lower === 'gudang' || lower === 'warehouse' || lower === 'wh') return 'Gudang';
    if (lower === 'advertiser' || lower === 'marketing' || lower === 'ads') return 'Advertiser';
    if (lower === 'partner' || lower === 'partnert' || lower === 'mitra') return 'Partner';

    // 3. Return valid role or default to Super Admin if unknown to prevent lockout, 
    // checking against known types would be safer but strict mapping is done above.
    return role as UserRole;
};

/**
 * Filters an array of data based on the user's assigned brands.
 * Super Admins see all data.
 * Other users only see data where the `brandId` field matches one of their `assignedBrandIds`.
 */
export const filterDataByBrand = <T>(
    data: T[],
    user: User | null,
    brandIdField: keyof T = 'brandId' as keyof T
): T[] => {
    if (!user) return [];
    if (user.role === 'Super Admin') return data;

    if (!user.assignedBrandIds || user.assignedBrandIds.length === 0) {
        return []; // No brands assigned, see nothing (strict mode)
    }

    return data.filter(item => {
        const itemBrandId = item[brandIdField] as unknown as string;
        // If item has no brandId, generally Super Admin sees it, but what about others?
        // For safety, if an item isn't tagged with a brand, only Super Admin sees it.
        if (!itemBrandId) return false;
        return user.assignedBrandIds!.includes(itemBrandId);
    });
};

/**
 * Filters users for the Team Earnings view.
 * Super Admin sees all users.
 * Admins/Others only see users who share at least one assigned brand with them.
 */
export const filterUsersByBrandIntersection = (
    targetUsers: User[],
    currentUser: User | null
): User[] => {
    if (!currentUser) return [];
    if (currentUser.role === 'Super Admin') return targetUsers;

    const myBrands = currentUser.assignedBrandIds || [];
    if (myBrands.length === 0) return [];

    return targetUsers.filter(target => {
        // Always see yourself
        if (target.id === currentUser.id) return true;
        
        // Check intersection
        const targetBrands = target.assignedBrandIds || [];
        return targetBrands.some(b => myBrands.includes(b));
    });
};

export const createDefaultTrackingSettings = (): Form['trackingSettings'] => {
    const defaultSetting = (eventName: TrackingEventName) => ({ pixelIds: [], eventName });
    return {
        formPage: {
            meta: defaultSetting('ViewContent'),
            google: defaultSetting('ViewContent'),
            tiktok: defaultSetting('ViewContent'),
            snack: defaultSetting('ViewContent'),
        },
        thankYouPage: {
            meta: defaultSetting('Purchase'),
            google: defaultSetting('Purchase'),
            tiktok: defaultSetting('Purchase'),
            snack: defaultSetting('Purchase'),
        }
    };
};

export const normalizeForm = (formToEdit: Form): Form => {
    
    const defaultShippingSettings: ShippingSettings = {
        regular: { visible: true, cost: 10000 },
        free: { visible: false, cost: 0 },
        flat_jawa: { visible: false, cost: 15000 },
        flat_bali: { visible: false, cost: 25000 },
        flat_sumatra: { visible: false, cost: 35000 },
    };

    let migratedForm: Form = {
        ...formToEdit,
        slug: formToEdit.slug || '',
        brandId: formToEdit.brandId || '', // Ensure brandId exists
        assignedAdvertiserId: formToEdit.assignedAdvertiserId || '', // PRESERVE: Don't reset advertiser assignment
        productImages: [], // Always empty - tidak digunakan lagi
        showTitle: formToEdit.showTitle ?? true,
        showDescription: formToEdit.showDescription ?? true,
        productOptions: (formToEdit.productOptions || []).map(opt => ({
            ...opt,
            displayStyle: opt.displayStyle || 'dropdown'
        })),
        variantCombinations: (formToEdit.variantCombinations || []).map(combo => ({
            ...combo,
            csCommission: combo.csCommission !== undefined ? combo.csCommission : (combo.commissionPrice ?? undefined),
            advCommission: combo.advCommission !== undefined ? combo.advCommission : undefined,
        })),
        customerFields: {
            name: formToEdit.customerFields?.name || { visible: true, required: true },
            whatsapp: formToEdit.customerFields?.whatsapp || { visible: true, required: true },
            email: formToEdit.customerFields?.email || { visible: true, required: false },
            province: formToEdit.customerFields?.province || { visible: true, required: true },
            city: formToEdit.customerFields?.city || { visible: true, required: true },
            district: formToEdit.customerFields?.district || { visible: true, required: true },
            address: formToEdit.customerFields?.address || { visible: true, required: true },
        },
        shippingSettings: formToEdit.shippingSettings || defaultShippingSettings,
        paymentSettings: formToEdit.paymentSettings || {
            cod: { visible: true, handlingFeePercentage: 0, handlingFeeBase: 'product' },
            qris: { visible: false, qrImageUrl: '' },
            bankTransfer: { visible: true, accounts: [] },
        },
        thankYouPage: formToEdit.thankYouPage || {
            submissionAction: 'show_thank_you_page',
            redirectUrl: '',
            title: 'Terima Kasih!',
            message: 'Pesanan Anda telah kami terima dan akan segera diproses. Berikut adalah rincian pesanan Anda:',
            showOrderSummary: true,
            whatsappConfirmation: {
                active: true,
                destination: 'custom',
                number: '',
                messageTemplate: 'Halo, saya ingin konfirmasi pesanan saya dengan ID [ORDER_ID].\n\nNama: [CUSTOMER_NAME]\nTotal: [TOTAL_PRICE]'
            }
        },
        trackingSettings: formToEdit.trackingSettings || createDefaultTrackingSettings(),
        customMessageTemplates: formToEdit.customMessageTemplates || { active: false, templates: {} },
        countdownSettings: formToEdit.countdownSettings || { active: true, duration: 600 },
        stockCountdownSettings: formToEdit.stockCountdownSettings || { active: true, initialStock: 10, intervalSeconds: 5 },
        socialProofSettings: formToEdit.socialProofSettings || {
            active: false,
            position: 'bottom-left',
            animation: 'slide-up',
            initialDelaySeconds: 5,
            displayDurationSeconds: 5,
            intervalSeconds: 10,
            customerNames: '',
            customerCities: '',
        },
        ctaSettings: formToEdit.ctaSettings || {
            mainText: 'Kirim Pesanan Sekarang',
            urgencyText: '{count} orang sudah checkout hari ini',
            initialCount: 124,
            increaseIntervalSeconds: 8,
        },
    };

    // --- NEW ROBUST SHIPPING SETTINGS MERGE LOGIC ---
    const savedSettings = formToEdit.shippingSettings || {};
    const finalShippingSettings = JSON.parse(JSON.stringify(defaultShippingSettings));

    (Object.keys(finalShippingSettings) as Array<keyof ShippingSettings>).forEach(key => {
        const savedKeySetting = (savedSettings as any)[key];
        if (savedKeySetting && typeof savedKeySetting === 'object') {
            // Merge saved properties over default, preserving defaults for any missing properties
            finalShippingSettings[key] = { ...finalShippingSettings[key], ...savedKeySetting };
        }
    });

    migratedForm.shippingSettings = finalShippingSettings;


    if (migratedForm.thankYouPage) {
        if (!migratedForm.thankYouPage.whatsappConfirmation.destination) {
            migratedForm.thankYouPage.whatsappConfirmation.destination = 'custom';
        }
        if (!migratedForm.thankYouPage.submissionAction) {
            migratedForm.thankYouPage.submissionAction = 'show_thank_you_page';
        }
        if (migratedForm.thankYouPage.redirectUrl === undefined) {
            migratedForm.thankYouPage.redirectUrl = '';
        }
    }

    if (migratedForm.paymentMethods) {
        const newSettings: PaymentSettings = {
            cod: { visible: false, handlingFeePercentage: 0, handlingFeeBase: 'product' },
            qris: { visible: false, qrImageUrl: '' },
            bankTransfer: { visible: false, accounts: [] },
        };
        migratedForm.paymentMethods.forEach(method => {
            if (method.type === 'COD') newSettings.cod.visible = true;
            if (method.type === 'Transfer') {
                newSettings.bankTransfer.visible = true;
                if (method.details) {
                    newSettings.bankTransfer.accounts.push({ id: Date.now(), bankName: 'Bank', accountNumber: method.details, accountHolder: 'Pemilik' });
                }
            }
        });
        migratedForm.paymentSettings = { ...newSettings, ...formToEdit.paymentSettings };
        delete migratedForm.paymentMethods;
    }

    if (migratedForm.shippingMethods && !formToEdit.shippingSettings) {
        const newSettings: ShippingSettings = {
            regular: { visible: false, cost: 0 },
            free: { visible: false, cost: 0 },
            flat_jawa: { visible: false, cost: 15000 },
            flat_bali: { visible: false, cost: 25000 },
            flat_sumatra: { visible: false, cost: 35000 },
        };
        migratedForm.shippingMethods.forEach(method => {
            if (method.name.toLowerCase().includes('regular')) {
                newSettings.regular = { visible: true, cost: method.cost };
            } else if (method.name.toLowerCase().includes('gratis')) {
                newSettings.free = { visible: true, cost: 0 };
            } else if (method.name.toLowerCase().includes('flat')) {
                newSettings.flat_jawa.visible = true;
                newSettings.flat_jawa.cost = method.cost;
            }
        });
        migratedForm.shippingSettings = newSettings;
        delete migratedForm.shippingMethods;
    }

    if (migratedForm.variants && (!migratedForm.productOptions || migratedForm.productOptions.length === 0)) {
        const newOptions: ProductOption[] = [{
            id: Date.now(),
            name: 'Varian',
            values: migratedForm.variants.map(v => v.name),
            displayStyle: 'dropdown'
        }];
        const newCombinations: VariantCombination[] = migratedForm.variants.map(v => ({
            attributes: { 'Varian': v.name },
            sellingPrice: v.price,
            costPrice: 0, // Default initialization
            csCommission: 0,
            advCommission: 0
        }));
        migratedForm.productOptions = newOptions;
        migratedForm.variantCombinations = newCombinations;
        delete migratedForm.variants;
    }

    if (migratedForm.variantCombinations && migratedForm.variantCombinations.length > 0) {
        migratedForm.variantCombinations = migratedForm.variantCombinations.map(combo => {
            const oldCombo = combo as any;
            if (oldCombo.price !== undefined && oldCombo.sellingPrice === undefined) {
                const { price, ...rest } = oldCombo;
                return {
                    ...rest,
                    sellingPrice: price,
                    costPrice: oldCombo.costPrice ?? undefined,
                    csCommission: oldCombo.csCommission !== undefined ? oldCombo.csCommission : (oldCombo.commissionPrice ?? undefined),
                    advCommission: oldCombo.advCommission !== undefined ? oldCombo.advCommission : undefined
                };
            }
            return {
                ...combo,
                csCommission: combo.csCommission !== undefined ? combo.csCommission : ((combo as any).commissionPrice ?? undefined),
                advCommission: combo.advCommission !== undefined ? combo.advCommission : undefined
            };
        });
    }

    if (migratedForm.paymentSettings) {
        const defaultOrder: Record<keyof PaymentSettings, number> = { cod: 1, qris: 2, bankTransfer: 3 };
        (Object.keys(migratedForm.paymentSettings) as Array<keyof PaymentSettings>).forEach(key => {
            if (migratedForm.paymentSettings[key].order === undefined) {
                (migratedForm.paymentSettings[key] as any).order = defaultOrder[key];
            }
        });
    }

    return migratedForm;
};
