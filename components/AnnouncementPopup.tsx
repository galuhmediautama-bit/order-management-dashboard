import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import { supabase } from '../firebase';
import type { Announcement } from '../types';
import XIcon from './icons/XIcon';

interface AnnouncementPopupProps {
    onClose?: () => void;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ onClose }) => {
    const { announcementSettings } = useContext(SettingsContext);
    const [isVisible, setIsVisible] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        const fetchAndShowAnnouncement = async () => {
            if (!announcementSettings?.popup?.enabled) {
                setIsVisible(false);
                return;
            }

            try {
                // Fetch active popup announcements
                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('announcements')
                    .select('*')
                    .eq('isActive', true)
                    .eq('displayMode', 'popup')
                    .lte('startDate', now)
                    .gte('endDate', now)
                    .order('order', { ascending: true })
                    .limit(1);

                if (error) {
                    console.error('Error fetching announcement:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const announcement = data[0] as Announcement;
                    setCurrentAnnouncement(announcement);

                    // Check frequency rules
                    if (shouldShowAnnouncement(announcement)) {
                        setIsVisible(true);
                    }
                }
            } catch (err) {
                console.error('Error in announcement popup:', err);
            }
        };

        fetchAndShowAnnouncement();
    }, [announcementSettings]);

    const shouldShowAnnouncement = (announcement: Announcement): boolean => {
        const settings = announcementSettings?.popup;
        if (!settings) return false;

        const storageKey = `announcement_popup_${announcement.id}`;
        const showCountKey = `announcement_popup_count_${announcement.id}`;
        const today = new Date().toDateString();

        if (settings.frequency === 'always') {
            return true;
        }

        if (settings.frequency === 'per_session') {
            const sessionShown = sessionStorage.getItem(storageKey);
            if (!sessionShown) {
                sessionStorage.setItem(storageKey, 'true');
                return true;
            }
            return false;
        }

        if (settings.frequency === 'cooldown') {
            const lastShown = localStorage.getItem(storageKey);
            const cooldownMs = (settings.cooldownMinutes || 30) * 60 * 1000;

            if (!lastShown) {
                localStorage.setItem(storageKey, new Date().toISOString());
                return true;
            }

            const lastTime = new Date(lastShown).getTime();
            const elapsed = new Date().getTime() - lastTime;

            if (elapsed >= cooldownMs) {
                localStorage.setItem(storageKey, new Date().toISOString());
                
                // Check max shows per day
                const countKey = `${showCountKey}_${today}`;
                const showCount = parseInt(localStorage.getItem(countKey) || '0', 10);
                const maxShows = settings.maxShowsPerDay || 3;

                if (showCount < maxShows) {
                    localStorage.setItem(countKey, (showCount + 1).toString());
                    return true;
                }
            }
            return false;
        }

        return false;
    };

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    if (!isVisible || !currentAnnouncement) {
        return null;
    }

    // Color mapping based on announcement type
    const typeColorMap = {
        info: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        success: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        warning: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        error: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className={`p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r ${typeColorMap[currentAnnouncement.type]} flex items-start justify-between`}>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentAnnouncement.title}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                        aria-label="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {currentAnnouncement.imageUrl && (
                        <div className="w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700/50">
                            <img
                                src={currentAnnouncement.imageUrl}
                                alt={currentAnnouncement.title || 'Pengumuman'}
                                className="w-full h-56 object-cover"
                            />
                        </div>
                    )}
                    {currentAnnouncement.message && (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{currentAnnouncement.message}</p>
                    )}
                    {currentAnnouncement.linkUrl && (
                        <a
                            href={currentAnnouncement.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            Buka tautan
                        </a>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementPopup;
