import React from 'react';

const MetaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.08 12.52c0 5.04-3.6 9.12-8.12 9.12-1.92 0-3.68-.64-5.12-1.68l-1.24 4.56-1.4-1.4 4.56-1.24c-1.04-1.44-1.68-3.2-1.68-5.12 0-5.04 3.6-9.12 8.12-9.12s9.4 4.08 9.4 9.12zM13.96 7.4c-4.16 0-7.52 3.04-7.52 6.8s3.36 6.8 7.52 6.8c4.16 0 7.52-3.04 7.52-6.8s-3.36-6.8-7.52-6.8z"/>
    </svg>
);

export default MetaIcon;
