import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GlobeIcon from './icons/GlobeIcon';

const LanguageToggle: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'id' ? 'en' : 'id');
    };

    return (
        <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
        >
            <GlobeIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase">
                {language === 'id' ? 'ID' : 'EN'}
            </span>
        </button>
    );
};

export default LanguageToggle;
