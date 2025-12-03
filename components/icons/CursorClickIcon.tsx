import React from 'react';

const CursorClickIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.832.168l-1.18 1.18M21.75 12h-2.25m-.168 5.832l-1.18-1.18M4.5 12H2.25m.168-5.832l1.18 1.18m5.494 14.13l.493-1.572A23.945 23.945 0 0112 15c-2.43 0-4.735.345-6.897.942l.493 1.572M12 15v-2.121c0-1.742.668-3.328 1.76-4.522m2.46-2.46a7.5 7.5 0 00-10.606 0M12 15a7.5 7.5 0 01-7.5-7.5" />
    </svg>
);

export default CursorClickIcon;