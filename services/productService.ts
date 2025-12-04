import { supabase } from '../firebase';
import { Product, ProductFormAnalytics, ProductPerformanceAggregate, AdvertiserProductPerformance } from '../types';

/**
 * Product Management Service
 * Mengelola produk induk dan analytics tracking
 */

// ============= HELPER FUNCTIONS =============

/**
 * Transform database row to Product type
 * Database menggunakan snake_case, kita perlu transform ke camelCase
 */
const transformProduct = (row: any): Product => {
    return {
        id: row.id,
        brandId: row.brand_id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        sku: row.attributes?.sku,
        category: row.category,
        initialStock: row.initial_stock,
        stockTracking: row.stock_tracking || { enabled: false, current: 0 },
        basePrice: row.base_price,
        comparePrice: row.attributes?.comparePrice,
        costPrice: row.cost_price,
        csCommission: row.attributes?.csCommission,
        advCommission: row.attributes?.advCommission,
        weight: row.attributes?.weight,
        stock: row.attributes?.stock,
        variants: row.attributes?.variants || [],
        variantOptions: row.attributes?.variantOptions || [],
        status: row.status,
        isFeatured: row.is_featured,
        tags: row.tags || [],
        attributes: row.attributes || {},
        seoTitle: row.seo_title,
        seoDescription: row.seo_description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

// ============= PRODUCTS CRUD =============

export const productService = {
    /**
     * Fetch all products (Super Admin only)
     */
    async getAllProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(transformProduct);
    },

    /**
     * Fetch all products for a brand
     */
    async getProductsByBrand(brandId: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('brand_id', brandId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(transformProduct);
    },

    /**
     * Fetch single product by ID
     */
    async getProduct(productId: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;
        return data ? transformProduct(data) : null;
    },

    /**
     * Create new product
     */
    async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
        try {
            // Validate brand exists in brands table
            if (!product.brandId) {
                throw new Error('Brand ID is required');
            }

            const { data: brandExists, error: brandError } = await supabase
                .from('brands')
                .select('id')
                .eq('id', product.brandId)
                .single();

            if (brandError || !brandExists) {
                throw new Error('Brand yang dipilih tidak valid. Silakan pilih brand dari Manajemen Merek.');
            }

            // Cek apakah nama produk sudah ada untuk brand ini
            const { data: existingProduct } = await supabase
                .from('products')
                .select('id')
                .eq('brand_id', product.brandId)
                .eq('name', product.name);
            
            if (existingProduct && existingProduct.length > 0) {
                throw new Error('Nama produk sudah ada untuk brand ini. Gunakan nama yang berbeda.');
            }

            // Hanya kirim field yang ada di database schema
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    brand_id: product.brandId,
                    name: product.name,
                    description: product.description,
                    image_url: product.imageUrl,
                    category: product.category,
                    base_price: product.basePrice,
                    cost_price: product.costPrice,
                    status: product.status,
                    is_featured: product.isFeatured,
                    seo_title: product.seoTitle,
                    seo_description: product.seoDescription,
                    // Simpan varian data di attributes JSONB
                    attributes: {
                        sku: product.sku || null,
                        variants: product.variants || [],
                        variantOptions: product.variantOptions || [],
                        comparePrice: product.comparePrice || null,
                        csCommission: product.csCommission || null,
                        advCommission: product.advCommission || null,
                        weight: product.weight || null,
                        stock: product.stock || null,
                    },
                }])
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }
            
            return transformProduct(data);
        } catch (error: any) {
            console.error('Error in createProduct:', error);
            throw new Error(error?.message || 'Gagal menyimpan produk');
        }
    },

    /**
     * Update product
     */
    async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
        const updateData: any = {};
        
        if (updates.name) updateData.name = updates.name;
        if (updates.description) updateData.description = updates.description;
        if (updates.imageUrl) updateData.image_url = updates.imageUrl;
        if (updates.category) updateData.category = updates.category;
        if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
        if (updates.costPrice !== undefined) updateData.cost_price = updates.costPrice;
        if (updates.status) updateData.status = updates.status;
        if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
        if (updates.seoTitle) updateData.seo_title = updates.seoTitle;
        if (updates.seoDescription) updateData.seo_description = updates.seoDescription;
        
        // Simpan variant data di attributes JSONB
        updateData.attributes = {
            sku: updates.sku || null,
            variants: updates.variants || [],
            variantOptions: updates.variantOptions || [],
            comparePrice: updates.comparePrice || null,
            csCommission: updates.csCommission || null,
            advCommission: updates.advCommission || null,
            weight: updates.weight || null,
            stock: updates.stock || null,
        };

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .select()
            .single();

        if (error) throw error;
        return transformProduct(data);
    },

    /**
     * Delete product (soft delete by archiving)
     */
    async deleteProduct(productId: string): Promise<boolean> {
        const { error } = await supabase
            .from('products')
            .update({ status: 'archived' })
            .eq('id', productId);

        if (error) throw error;
        return true;
    },

    // ============= PRODUCT ANALYTICS =============

    /**
     * Create or get analytics record untuk form
     */
    async createOrGetAnalytics(
        productId: string,
        formId: string,
        advertiserId: string
    ): Promise<ProductFormAnalytics> {
        const { data, error } = await supabase.rpc(
            'create_product_analytics',
            {
                p_product_id: productId,
                p_form_id: formId,
                p_advertiser_id: advertiserId,
                p_period_start: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            }
        );

        if (error) throw error;
        return data;
    },

    /**
     * Update analytics metrics (views, clicks, orders, revenue)
     */
    async updateAnalyticsMetrics(
        analyticsId: string,
        metrics: {
            viewsCount?: number;
            clicksCount?: number;
            ordersCount?: number;
            totalRevenue?: number;
        }
    ): Promise<boolean> {
        const { error } = await supabase.rpc(
            'update_analytics_metrics',
            {
                p_analytics_id: analyticsId,
                p_views_count: metrics.viewsCount,
                p_clicks_count: metrics.clicksCount,
                p_orders_count: metrics.ordersCount,
                p_total_revenue: metrics.totalRevenue,
            }
        );

        if (error) throw error;
        return true;
    },

    /**
     * Get analytics untuk specific form
     */
    async getFormAnalytics(formId: string): Promise<ProductFormAnalytics | null> {
        const { data, error } = await supabase
            .from('product_form_analytics')
            .select('*')
            .eq('form_id', formId)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        return data || null;
    },

    /**
     * Get all analytics untuk product (semua advertiser)
     */
    async getProductAnalytics(productId: string): Promise<ProductFormAnalytics[]> {
        const { data, error } = await supabase
            .from('product_form_analytics')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('period_start', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get analytics untuk advertiser's forms
     */
    async getAdvertiserProductAnalytics(advertiserId: string): Promise<ProductFormAnalytics[]> {
        const { data, error } = await supabase
            .from('product_form_analytics')
            .select('*')
            .eq('advertiser_id', advertiserId)
            .eq('is_active', true)
            .order('period_start', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ============= AGGREGATED VIEWS =============

    /**
     * Get product performance aggregation (total across all advertisers)
     */
    async getProductPerformanceAggregate(productId: string): Promise<ProductPerformanceAggregate | null> {
        const { data, error } = await supabase
            .from('product_performance_aggregate')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    /**
     * Get all products performance aggregation untuk brand
     */
    async getBrandProductsPerformance(brandId: string): Promise<ProductPerformanceAggregate[]> {
        const { data, error } = await supabase
            .from('product_performance_aggregate')
            .select('*')
            .eq('brand_id', brandId)
            .order('total_revenue', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get advertiser performance per product
     */
    async getAdvertiserPerformancePerProduct(advertiserId: string): Promise<AdvertiserProductPerformance[]> {
        const { data, error } = await supabase
            .from('advertiser_product_performance')
            .select('*')
            .eq('advertiser_id', advertiserId)
            .order('period_start', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get top performing products untuk brand
     */
    async getTopProducts(brandId: string, limit: number = 5): Promise<ProductPerformanceAggregate[]> {
        const { data, error } = await supabase
            .from('product_performance_aggregate')
            .select('*')
            .eq('brand_id', brandId)
            .order('total_revenue', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * Get forms linked to product
     */
    async getProductForms(productId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('forms')
            .select('id, title, slug, brandId')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Link form to product
     */
    async linkFormToProduct(formId: string, productId: string): Promise<boolean> {
        const { error } = await supabase
            .from('forms')
            .update({ product_id: productId })
            .eq('id', formId);

        if (error) throw error;
        return true;
    },

    /**
     * Unlink form from product
     */
    async unlinkFormFromProduct(formId: string): Promise<boolean> {
        const { error } = await supabase
            .from('forms')
            .update({ product_id: null })
            .eq('id', formId);

        if (error) throw error;
        return true;
    },
};
