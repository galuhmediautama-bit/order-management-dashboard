
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase';
import type { AnnouncementSettings } from '../types';

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
    announcementSettings: AnnouncementSettings | null;
    loading: boolean;
}

export const SettingsContext = createContext<ISettingsContext>({
    websiteSettings: null,
    trackingSettings: null,
    announcementSettings: null,
    loading: true,
});

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
    const [trackingSettings, setTrackingSettings] = useState<GlobalPixelSettings | null>(null);
    const [announcementSettings, setAnnouncementSettings] = useState<AnnouncementSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalSettings = async () => {
            try {
                // Fetch in parallel
                const { data: websiteData } = await supabase.from('settings').select('*').eq('id', 'website').single();
                const { data: trackingData } = await supabase.from('settings').select('*').eq('id', 'trackingPixels').single();
                const { data: announcementData } = await supabase.from('settings').select('*').eq('id', 'announcementSettings').single();

                if (websiteData) {
                    setWebsiteSettings(websiteData as WebsiteSettings);
                }

                if (trackingData) {
                    setTrackingSettings(trackingData as GlobalPixelSettings);
                }

                if (announcementData) {
                    const normalized: AnnouncementSettings = {
                        popup: {
                            enabled: announcementData.announcementPopupEnabled ?? true,
                            frequency: announcementData.announcementPopupFrequency ?? 'per_session',
                            cooldownMinutes: announcementData.announcementPopupCooldownMinutes ?? 30,
                            maxShowsPerDay: announcementData.announcementPopupMaxShowsPerDay ?? 3,
                        },
                        lineBar: {
                            enabled: announcementData.announcementLineBarEnabled ?? true,
                            dismissBehavior: announcementData.announcementLineBarDismissBehavior ?? 'hide_for_hours',
                            hideDurationHours: announcementData.announcementLineBarHideDurationHours ?? 12,
                        },
                    };
                    setAnnouncementSettings(normalized);
                } else {
                    // Set defaults if not found
                    setAnnouncementSettings({
                        popup: {
                            enabled: true,
                            frequency: 'per_session',
                            cooldownMinutes: 30,
                            maxShowsPerDay: 3,
                        },
                        lineBar: {
                            enabled: true,
                            dismissBehavior: 'hide_for_hours',
                            hideDurationHours: 12,
                        },
                    });
                }

            } catch (error) {
                console.error("Failed to fetch global settings:", error);
                // Set defaults on error
                setAnnouncementSettings({
                    popup: {
                        enabled: true,
                        frequency: 'per_session',
                        cooldownMinutes: 30,
                        maxShowsPerDay: 3,
                    },
                    lineBar: {
                        enabled: true,
                        dismissBehavior: 'hide_for_hours',
                        hideDurationHours: 12,
                    },
                });
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ websiteSettings, trackingSettings, announcementSettings, loading }}>
            {children}
        </SettingsContext.Provider>
    );
};
