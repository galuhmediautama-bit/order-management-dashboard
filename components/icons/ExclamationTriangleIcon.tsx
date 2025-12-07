import React from 'react';

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c.866-1.5 2.845-2.506 4.795-2.506a4.828 4.828 0 012.368.557m14.946 1.048c.281-.855.3-2.15 0-3.365m-14.946-1.049c1.194.56 2.747.56 4.404-.312m-4.404.312c.102.006.202.013.302.013m4.102 0h.002M7.501 19.795a6.002 6.002 0 100-11.592 6.002 6.002 0 000 11.592zM12 12.75h.007v.008H12v-.008z" />
    </svg>
);

export default ExclamationTriangleIcon;
