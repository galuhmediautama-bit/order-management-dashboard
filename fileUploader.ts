
import { supabase } from './supabase';

export const uploadFileAndGetURL = async (file: File): Promise<string> => {
    // Gunakan bucket 'images' atau nama bucket lain yang sudah Anda buat di Supabase
    const bucketName = 'images'; 
    // Sanitize filename to avoid issues with special characters
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    try {
        // Attempt to upload file to Supabase Storage
        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, file);

        if (error) {
            console.warn(`Supabase Storage upload failed (Bucket: '${bucketName}'). Falling back to Base64.`, error.message);
            // If bucket is missing or upload fails, convert file to Base64 string
            // This allows the app to continue working without a configured storage bucket
            return await fileToBase64(file);
        }

        // Get Public URL if upload succeeded
        const { data: { publicUrl } } = supabase
            .storage
            .from(bucketName)
            .getPublicUrl(fileName);
        
        return publicUrl;

    } catch (e) {
        console.warn("Unexpected error during file upload. Falling back to Base64.", e);
        return await fileToBase64(file);
    }
};

// Helper function to convert File object to Base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};
