import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import XIcon from './icons/XIcon';

interface AnnouncementLineBarProps {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}

const AnnouncementLineBar: React.FC<AnnouncementLineBarProps> = ({ 
    message, 
    type = 'info' 
}) => {
    const { announcementSettings } = useContext(SettingsContext);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!announcementSettings?.lineBar.enabled) {
            setIsVisible(false);
            return;
        }

        // Check if bar was dismissed and should remain hidden
        const dismissedKey = 'announcement_linebar_dismissed';
        const dismissedTime = localStorage.getItem(dismissedKey);

        if (dismissedTime) {
            const dismissedAt = parseInt(dismissedTime, 10);
            const now = Date.now();

            if (announcementSettings.lineBar.dismissBehavior === 'hide_for_session') {
                // Only hide for this session (check sessionStorage instead)
                const sessionKey = 'announcement_linebar_dismissed_session';
                if (sessionStorage.getItem(sessionKey)) {
                    setIsVisible(false);
                    return;
                }
            } else if (announcementSettings.lineBar.dismissBehavior === 'hide_for_hours') {
                const hideDurationMs = (announcementSettings.lineBar.hideDurationHours || 12) * 60 * 60 * 1000;
                if (now - dismissedAt < hideDurationMs) {
                    setIsVisible(false);
                    return;
                } else {
                    // Duration expired, clear the key
                    localStorage.removeItem(dismissedKey);
                }
            }
        }

        setIsVisible(true);
    }, [announcementSettings]);

    const handleClose = () => {
        const dismissedKey = 'announcement_linebar_dismissed';

        if (announcementSettings?.lineBar.dismissBehavior === 'hide_for_session') {
            sessionStorage.setItem('announcement_linebar_dismissed_session', 'true');
        } else if (announcementSettings?.lineBar.dismissBehavior === 'hide_for_hours') {
            localStorage.setItem(dismissedKey, Date.now().toString());
        }

        setIsVisible(false);
    };

    if (!isVisible) {
        return null;
    }

    const typeStyles = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    };

    return (
        <div className={`flex items-center justify-between gap-4 px-4 py-3 border-b ${typeStyles[type]} transition-all duration-300 animate-in slide-in-from-top`}>
            <div className="flex items-center gap-3 flex-1">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button
                onClick={handleClose}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Tutup pengumuman"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default AnnouncementLineBar;
