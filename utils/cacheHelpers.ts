/**
 * Caching Integration Helpers
 * Simplified API for integrating caching into existing pages
 */

import { cacheQuery } from './caching';
import { supabase } from '../firebase';

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
    // Forms
    FORMS: 'forms-all',
    FORMS_BY_BRAND: (brandId: string) => `forms-brand-${brandId}`,

    // Users
    USERS_ALL: 'users-all',
    USERS_CS: 'users-cs',
    USERS_BY_ROLE: (role: string) => `users-role-${role}`,

    // Brands
    BRANDS: 'brands-all',
    BRANDS_BY_ID: (id: string) => `brand-${id}`,

    // Products
    PRODUCTS: 'products-all',
    PRODUCTS_BY_BRAND: (brandId: string) => `products-brand-${brandId}`,

    // Settings
    SETTINGS: 'settings-all',
    SETTINGS_BY_KEY: (key: string) => `settings-${key}`,

    // Orders
    ORDERS: 'orders-all',
    ORDERS_BY_STATUS: (status: string) => `orders-status-${status}`,
    ORDERS_BY_USER: (userId: string) => `orders-user-${userId}`,

    // Abandoned Carts
    CARTS: 'abandoned-carts-all',
    CARTS_BY_USER: (userId: string) => `carts-user-${userId}`,

    // CS Agents
    CS_AGENTS: 'cs-agents-all',
};

/**
 * Fetch and cache forms
 */
export async function getCachedForms() {
    return cacheQuery(
        CACHE_KEYS.FORMS,
        () => supabase.from('forms').select('id, title, brandId'),
        5 * 60 * 1000 // 5 minutes
    );
}

/**
 * Fetch and cache forms by brand
 */
export async function getCachedFormsByBrand(brandId: string) {
    return cacheQuery(
        CACHE_KEYS.FORMS_BY_BRAND(brandId),
        () =>
            supabase
                .from('forms')
                .select('id, title, brandId')
                .eq('brandId', brandId),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache all users
 */
export async function getCachedUsers() {
    return cacheQuery(
        CACHE_KEYS.USERS_ALL,
        () => supabase.from('users').select('id, name, role, "assignedBrandIds", status'),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache CS users
 */
export async function getCachedCsUsers() {
    return cacheQuery(
        CACHE_KEYS.USERS_CS,
        async () => {
            const users = await supabase
                .from('users')
                .select('id, name, role, status')
                .eq('status', 'Aktif');

            return {
                data: (users.data || []).filter((u: any) => u.role === 'Customer service'),
                error: users.error,
            };
        },
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache users by role
 */
export async function getCachedUsersByRole(role: string) {
    return cacheQuery(
        CACHE_KEYS.USERS_BY_ROLE(role),
        () =>
            supabase
                .from('users')
                .select('id, name, role, "assignedBrandIds", status')
                .eq('role', role),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache brands
 */
export async function getCachedBrands() {
    return cacheQuery(
        CACHE_KEYS.BRANDS,
        () => supabase.from('brands').select('id, name'),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache products
 */
export async function getCachedProducts() {
    return cacheQuery(
        CACHE_KEYS.PRODUCTS,
        () => supabase.from('products').select('id, name, brand_id'),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache products by brand
 */
export async function getCachedProductsByBrand(brandId: string) {
    return cacheQuery(
        CACHE_KEYS.PRODUCTS_BY_BRAND(brandId),
        () =>
            supabase
                .from('products')
                .select('id, name, brand_id')
                .eq('brand_id', brandId),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache CS agents
 */
export async function getCachedCsAgents() {
    return cacheQuery(
        CACHE_KEYS.CS_AGENTS,
        () => supabase.from('cs_agents').select('id, name, phone'),
        5 * 60 * 1000
    );
}

/**
 * Fetch and cache settings
 */
export async function getCachedSettings(id: string) {
    return cacheQuery(
        CACHE_KEYS.SETTINGS_BY_KEY(id),
        () => supabase.from('settings').select('*').eq('id', id).single(),
        10 * 60 * 1000 // 10 minutes (settings change less frequently)
    );
}

/**
 * Fetch and cache message templates
 */
export async function getCachedMessageTemplates() {
    return getCachedSettings('messageTemplates');
}

/**
 * Fetch and cache cancellation reasons
 */
export async function getCachedCancellationReasons() {
    return getCachedSettings('cancellationReasons');
}

/**
 * Manual cache invalidation
 * Call when data changes to clear stale cache
 */
export function invalidateCache(keys: string | string[]) {
    const keysToInvalidate = Array.isArray(keys) ? keys : [keys];

    for (const key of keysToInvalidate) {
        // This would need to be implemented in caching.ts
        // For now, just log
        if (import.meta.env.DEV) {
            console.log(`[Cache] Invalidating: ${key}`);
        }
    }
}

/**
 * Invalidate related caches when specific data changes
 */
export function invalidateOnOrderChange() {
    // Order changed, invalidate related caches
    invalidateCache([
        CACHE_KEYS.ORDERS,
        CACHE_KEYS.CARTS,
    ]);
}

export function invalidateOnUserChange(userId: string) {
    // User changed, invalidate related caches
    invalidateCache([
        CACHE_KEYS.USERS_ALL,
        CACHE_KEYS.USERS_CS,
        CACHE_KEYS.ORDERS_BY_USER(userId),
    ]);
}

export function invalidateOnBrandChange(brandId: string) {
    // Brand changed, invalidate related caches
    invalidateCache([
        CACHE_KEYS.BRANDS,
        CACHE_KEYS.FORMS_BY_BRAND(brandId),
        CACHE_KEYS.PRODUCTS_BY_BRAND(brandId),
    ]);
}

/**
 * Pre-warm cache for better performance
 * Call on app startup to load frequently used data
 */
export async function warmCache() {
    try {
        console.log('[Cache] Warming up cache...');

        // Load frequently accessed data
        await Promise.all([
            getCachedForms(),
            getCachedUsers(),
            getCachedBrands(),
            getCachedProducts(),
            getCachedCsAgents(),
            getCachedMessageTemplates(),
            getCachedCancellationReasons(),
        ]);

        console.log('[Cache] Cache warming complete');
    } catch (error) {
        console.error('[Cache] Error warming cache:', error);
    }
}

export default {
    CACHE_KEYS,
    getCachedForms,
    getCachedFormsByBrand,
    getCachedUsers,
    getCachedCsUsers,
    getCachedUsersByRole,
    getCachedBrands,
    getCachedProducts,
    getCachedProductsByBrand,
    getCachedCsAgents,
    getCachedSettings,
    getCachedMessageTemplates,
    getCachedCancellationReasons,
    invalidateCache,
    invalidateOnOrderChange,
    invalidateOnUserChange,
    invalidateOnBrandChange,
    warmCache,
};
