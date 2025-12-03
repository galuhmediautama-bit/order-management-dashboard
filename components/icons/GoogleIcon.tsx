import React from 'react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="currentColor">
        <path fill="#4285F4" d="M24 9.8c3.86 0 7.02 1.34 9.62 3.72l7.78-7.78C37.36 2.26 31.18 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.32 6.43C12.84 14.15 17.98 9.8 24 9.8z"/>
        <path fill="#34A853" d="M46.44 24.5c0-1.63-.15-3.2-.42-4.7H24v9.4h12.78c-.55 3.03-2.26 5.6-4.8 7.32l8.03 6.2c4.66-4.32 7.43-10.65 7.43-18.22z"/>
        <path fill="#FBBC05" d="M10.88 28.18c-.49-1.47-.76-3.04-.76-4.68s.27-3.21.76-4.68l-8.32-6.43C.96 15.7 0 19.75 0 24s.96 8.3 2.56 11.82l8.32-6.44z"/>
        <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.9-5.72l-8.03-6.2c-2.12 1.42-4.92 2.26-8.03 2.26-6.02 0-11.16-4.35-13.08-10.27l-8.32 6.43C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
);

export default GoogleIcon;
