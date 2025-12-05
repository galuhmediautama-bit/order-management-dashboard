import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../contexts/SettingsContext';
import XIcon from './icons/XIcon';

interface AnnouncementPopupProps {
    title?: string;
    message: string;
    onClose?: () => void;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ 
    title = 'Pengumuman', 
    message, 
    onClose 
}) => {
    const { announcementSettings } = useContext(SettingsContext);
    const [isVisible, setIsVisible] = useState(false);
    const [showCount, setShowCount] = useState(0);

    useEffect(() => {
        if (!announcementSettings?.popup.enabled) {
            return;
        }

        // Check if we should show based on frequency settings
        const shouldShow = checkFrequencyRules();
        if (shouldShow) {
            setIsVisible(true);
            incrementShowCount();
        }
    }, [announcementSettings, message]);

    const checkFrequencyRules = (): boolean => {
        if (!announcementSettings?.popup) return false;

        const settings = announcementSettings.popup;
        const storageKey = `announcement_${Date.now()}`;

        if (settings.frequency === 'always') {
            return true;
        }

        if (settings.frequency === 'per_session') {
            // Check if already shown in this session
            const sessionKey = 'announcement_shown_session';
            if (sessionStorage.getItem(sessionKey)) {
                return false;
            }
            sessionStorage.setItem(sessionKey, 'true');
            return true;
        }

        if (settings.frequency === 'cooldown' && settings.cooldownMinutes) {
            const cooldownKey = 'announcement_last_shown';
            const lastShown = localStorage.getItem(cooldownKey);
            
            if (!lastShown) {
                localStorage.setItem(cooldownKey, Date.now().toString());
                return true;
            }

            const lastShownTime = parseInt(lastShown, 10);
            const cooldownMs = settings.cooldownMinutes * 60 * 1000;
            const now = Date.now();

            if (now - lastShownTime >= cooldownMs) {
                localStorage.setItem(cooldownKey, Date.now().toString());

                // Check max shows per day
                if (settings.maxShowsPerDay) {
                    const todayKey = `announcement_shows_today_${new Date().toDateString()}`;
                    const todayCount = parseInt(localStorage.getItem(todayKey) || '0', 10);

                    if (todayCount >= settings.maxShowsPerDay) {
                        return false;
                    }
                    localStorage.setItem(todayKey, (todayCount + 1).toString());
                }

                return true;
            }
        }

        return false;
    };

    const incrementShowCount = () => {
        setShowCount(prev => prev + 1);
    };

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/20 dark:to-cyan-900/20 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
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
                <div className="p-6">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
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
