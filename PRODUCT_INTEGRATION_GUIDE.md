/**
 * INTEGRATION GUIDE: Product Tracking in FormEditorPage
 * 
 * This file shows how to integrate the product tracking system
 * into the FormEditorPage for form creation/editing.
 */

// ============= 1. ADD PRODUCT SELECTION DROPDOWN =============

// In FormEditorPage.tsx, add these imports:
import { productService } from '../services/productService';
import { Product } from '../types';

// In component state:
const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
const [isLoadingProducts, setIsLoadingProducts] = useState(false);

// In useEffect (alongside other data fetching):
useEffect(() => {
    if (currentUser?.id) {
        fetchProducts();
    }
}, [currentUser]);

const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
        const products = await productService.getProductsByBrand(currentUser.id);
        setAvailableProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    } finally {
        setIsLoadingProducts(false);
    }
};

// ============= 2. ADD PRODUCT UI TO FORM =============

// In the form settings section (after Title input):
<div className="mb-4">
    <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
        Produk Induk *
    </label>
    <select
        value={form.productId || ''}
        onChange={(e) => setForm(prev => prev ? ({ 
            ...prev, 
            productId: e.target.value || undefined 
        }) : null)}
        className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
    >
        <option value="">-- Pilih Produk --</option>
        {availableProducts.map(product => (
            <option key={product.id} value={product.id}>
                {product.name} {product.sku ? `(${product.sku})` : ''}
            </option>
        ))}
    </select>
    <p className="text-xs text-slate-500 mt-1">
        Pilih produk induk untuk tracking performa iklan multi-advertiser
    </p>
</div>

// ============= 3. ADD PRODUCT VALIDATION =============

// In handleSave function, add validation:
if (!form.productId) {
    showToast("Silakan pilih produk induk terlebih dahulu", 'error');
    return;
}

// ============= 4. CREATE ANALYTICS ON FORM SAVE =============

// In handleSave function, after form is successfully saved:
try {
    // Save form first...
    await supabase.from("forms").insert([formToSave]);
    
    // Then create analytics record
    if (form.productId && form.brandId) {
        const analytics = await productService.createOrGetAnalytics(
            form.productId,
            formToSave.id,
            form.brandId  // advertiser_id in this context
        );
        console.log('Analytics created:', analytics);
    }
} catch (error) {
    console.error('Error:', error);
}

// ============= 5. UPDATE ANALYTICS ON ORDER CREATION =============

// In FormViewerPage.tsx or order submission handler:
// After order is created successfully:

import { productService } from '../services/productService';

async function handleOrderSubmit(orderData: any) {
    try {
        // Create order...
        const newOrder = await supabase.from('orders').insert([orderData]).select().single();
        
        // Get form data
        const { data: formData } = await supabase
            .from('forms')
            .select('product_id, brand_id')
            .eq('id', formId)
            .single();
        
        // Update analytics if product is linked
        if (formData?.product_id) {
            const analytics = await productService.getFormAnalytics(formId);
            
            if (analytics) {
                await productService.updateAnalyticsMetrics(analytics.id, {
                    ordersCount: analytics.ordersCount + 1,
                    totalRevenue: (analytics.totalRevenue || 0) + orderData.total_amount
                });
                
                console.log('Analytics updated successfully');
            }
        }
        
        showToast('Pesanan berhasil dikirim', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Gagal mengirim pesanan', 'error');
    }
}

// ============= 6. VIEW ANALYTICS IN FORMS PAGE =============

// In FormsPage.tsx, add button to view analytics:
<button
    onClick={() => {
        // Navigate to product analytics with pre-selected form
        navigate('/analitik-produk');
    }}
    className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm"
>
    📊 Lihat Analitik
</button>

// ============= 7. DISPLAY ANALYTICS INFO IN FORM PREVIEW =============

// In FormEditorPage FormPreview component, show product info:
{form.productId && (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg mb-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
            📦 Formulir terhubung ke produk induk untuk tracking analitik
        </p>
    </div>
)}

// ============= 8. EXAMPLE: COMPLETE INTEGRATION IN FormEditorPage =============

/*
// State additions:
const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

// Effect to fetch products:
useEffect(() => {
    if (currentUser?.id) {
        fetchProducts();
    }
}, [currentUser]);

// Fetch function:
const fetchProducts = async () => {
    try {
        const products = await productService.getProductsByBrand(currentUser.id);
        setAvailableProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Gagal mengambil daftar produk', 'error');
    }
};

// Updated handleSave with analytics:
const handleSave = useCallback(async () => {
    if (!form || isSaving) return;
    
    // Validation
    if (!form.title || form.title.trim() === '') {
        showToast("Judul formulir tidak boleh kosong.", 'error');
        return;
    }
    
    if (!form.productId) {
        showToast("Silakan pilih produk induk terlebih dahulu.", 'error');
        return;
    }
    
    setIsSaving(true);
    try {
        // Save form
        const { data, error } = await supabase
            .from("forms")
            .upsert([formToSave])
            .select()
            .single();
        
        if (error) throw error;
        
        // Create/update analytics
        if (form.productId && form.brandId) {
            try {
                const analytics = await productService.createOrGetAnalytics(
                    form.productId,
                    data.id,
                    form.brandId
                );
                console.log('✅ Analytics record created/updated:', analytics.id);
            } catch (analyticsError) {
                console.warn('⚠️ Analytics creation failed (non-blocking):', analyticsError);
                // Don't fail form save if analytics fails
            }
        }
        
        showToast('Formulir berhasil disimpan.', 'success');
        navigate('/formulir');
        
    } catch (error) {
        console.error("Error:", error);
        showToast('Gagal menyimpan formulir.', 'error');
    } finally {
        setIsSaving(false);
    }
}, [form, isSaving, slugAvailable, showToast, navigate]);

// In JSX - Product selection in form settings:
<div>
    <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
        Produk Induk * 
        <span className="text-red-500">*</span>
    </label>
    <select
        value={form.productId || ''}
        onChange={(e) => handleFieldChange('productId', e.target.value || undefined)}
        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                   bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                   focus:ring-2 focus:ring-indigo-500"
    >
        <option value="">-- Pilih Produk --</option>
        {availableProducts.map(product => (
            <option key={product.id} value={product.id}>
                {product.name} 
                {product.sku && ` (${product.sku})`}
                {product.isFeatured && ' ⭐'}
            </option>
        ))}
    </select>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Pilih produk induk untuk melacak performa dari berbagai advertiser
    </p>
</div>
*/

// ============= 9. WEBHOOK FOR REAL-TIME ANALYTICS UPDATE =============

/*
// Example webhook handler (in backend/edge function):
export async function updateOrderAnalytics(req: Request) {
    const { orderId, formId, amount } = await req.json();
    
    try {
        // Get form to find product
        const form = await supabase
            .from('forms')
            .select('product_id, brand_id')
            .eq('id', formId)
            .single();
        
        if (!form.data?.product_id) {
            return new Response(JSON.stringify({ error: 'No product linked' }), { status: 400 });
        }
        
        // Get or create analytics
        const analytics = await productService.createOrGetAnalytics(
            form.data.product_id,
            formId,
            form.data.brand_id
        );
        
        // Update metrics
        await productService.updateAnalyticsMetrics(analytics.id, {
            ordersCount: (analytics.ordersCount || 0) + 1,
            totalRevenue: (analytics.totalRevenue || 0) + amount
        });
        
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error('Error updating analytics:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
*/

export {};
