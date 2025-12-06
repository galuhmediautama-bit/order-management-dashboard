import { supabase } from '../firebase';

/**
 * Initialize brand_settings table if it doesn't exist
 * This is a client-side initialization helper that runs on app startup
 */
export const initializeBrandSettings = async () => {
    try {
        // Try to query the table - if it exists, this will work
        const { data, error } = await supabase
            .from('brand_settings')
            .select('count(*)', { count: 'exact', head: true });

        if (error && error.code === 'PGRST116') {
            // Table doesn't exist - this is expected on first run
            console.warn('brand_settings table not found. Please run SQL migration.');
            return false;
        }

        if (error) {
            console.error('Error checking brand_settings table:', error);
            return false;
        }

        console.log('✓ brand_settings table exists');
        return true;
    } catch (error) {
        console.error('Error initializing brand settings:', error);
        return false;
    }
};

/**
 * Ensure a brand has a settings record (create empty if not exists)
 */
export const ensureBrandSettings = async (brandId: string) => {
    try {
        if (!brandId) {
            console.error('ensureBrandSettings: brandId is empty');
            return false;
        }

        console.log('ensureBrandSettings: Checking settings for brandId:', brandId);

        // Check if settings exist
        const { data: existing, error: checkError } = await supabase
            .from('brand_settings')
            .select('*')
            .eq('brandId', brandId)
            .single();

        // Settings already exist
        if (existing) {
            console.log('✓ Brand settings already exist:', existing.id);
            return true;
        }

        // Table not found or no record - try to create
        if (checkError) {
            console.log('Check error code:', checkError.code);
            
            // PGRST116 = no rows returned (expected for new brand)
            if (checkError.code === 'PGRST116') {
                console.log('No settings found, creating new...');

                const newSettings = {
                    brandId,
                    bankAccounts: [],
                    qrisPayments: [],
                    warehouses: [],
                };

                console.log('Inserting new settings:', newSettings);

                const { data: insertData, error: insertError } = await supabase
                    .from('brand_settings')
                    .insert(newSettings)
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating brand settings:', {
                        code: insertError.code,
                        message: insertError.message,
                        details: insertError.details,
                        hint: insertError.hint,
                    });
                    return false;
                }

                console.log('✓ Created brand settings:', insertData?.id);
                return true;
            }

            // Other error codes
            console.error('Unexpected error checking brand settings:', {
                code: checkError.code,
                message: checkError.message,
                details: checkError.details,
            });
            return false;
        }

        return true;
    } catch (error: any) {
        console.error('ensureBrandSettings exception:', error);
        return false;
    }
};

/**
 * Get readable error message from Supabase error
 */
export const getBrandSettingsErrorMessage = (error: any): string => {
    if (!error) return 'Terjadi kesalahan yang tidak diketahui';

    console.log('Error object:', { code: error.code, message: error.message, details: error.details });

    // Check for specific error codes
    if (error.code === 'PGRST116') {
        return 'Tabel brand_settings belum dibuat. Hubungi admin untuk menjalankan SQL migration.';
    }

    if (error.code === '42P01') {
        return 'Tabel brand_settings tidak ditemukan di database.';
    }

    if (error.code === 'PGRST201') {
        return 'Tidak ada izin untuk mengakses tabel brand_settings.';
    }

    // Foreign key violation
    if (error.code === '23503') {
        return 'Brand ID tidak valid atau brand sudah dihapus.';
    }

    // Unique constraint violation
    if (error.code === '23505') {
        return 'Pengaturan untuk brand ini sudah ada.';
    }

    // Check for specific error messages
    if (error.message?.includes('brand_settings')) {
        return `Masalah dengan tabel brand_settings: ${error.message}`;
    }

    if (error.message?.includes('permission')) {
        return `Tidak ada izin: ${error.message}`;
    }

    if (error.message?.includes('JWT')) {
        return 'Sesi Anda telah berakhir. Silakan refresh halaman dan login ulang.';
    }

    // Generic messages
    if (error.message) {
        return error.message;
    }

    if (error.error_description) {
        return error.error_description;
    }

    if (error.details) {
        return error.details;
    }

    return String(error);
};
