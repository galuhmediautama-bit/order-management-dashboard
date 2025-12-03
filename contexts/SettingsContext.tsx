
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../firebase';

export interface GlobalPixel {
    id: string;
    name: string;
}
export interface GlobalPixelSettings {
    meta: { pixels: GlobalPixel[], active: boolean };
    google: { pixels: GlobalPixel[], active: boolean };
    tiktok: { pixels: GlobalPixel[], active: boolean };
    snack: { pixels: GlobalPixel[], active: boolean };
}

interface WebsiteSettings {
    siteName?: string;
}

interface ISettingsContext {
    websiteSettings: WebsiteSettings | null;
    trackingSettings: GlobalPixelSettings | null;
    loading: boolean;
}

export const SettingsContext = createContext<ISettingsContext>({
    websiteSettings: null,
    trackingSettings: null,
    loading: true,
});

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
    const [trackingSettings, setTrackingSettings] = useState<GlobalPixelSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                // Fetch in parallel
                const { data: websiteData } = await supabase.from('settings').select('*').eq('id', 'website').single();
                const { data: trackingData } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();

                if (websiteData) {
                    setWebsiteSettings(websiteData as WebsiteSettings);
                }

                if (trackingData) {
                    setTrackingSettings(trackingData as GlobalPixelSettings);
                }

            } catch (error) {
                console.error("Failed to fetch global settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ websiteSettings, trackingSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
