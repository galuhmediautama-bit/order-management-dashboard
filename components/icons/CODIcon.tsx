import React from 'react';

const CODIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h7.5m-7.5 0h7.5m0 0v.75A.75.75 0 0110.5 6h-.75m0 0v-.75A.75.75 0 0110.5 4.5h.75m0 0h7.5m-7.5 0h7.5m0 0v.75c0 .414.336.75.75.75h.75a.75.75 0 01.75-.75V4.5h.75m-7.5 0h7.5M12 12.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25M3 8.25c0-1.036.84-1.875 1.875-1.875h13.25c1.035 0 1.875.84 1.875 1.875M3 8.25h18M3 11.25h18M3 14.25h18" />
    </svg>
);

export default CODIcon;
