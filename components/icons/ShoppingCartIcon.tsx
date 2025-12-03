
import React from 'react';

const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.812a.75.75 0 00-.663-.941H5.438M7.5 14.25L5.106 5.165A.75.75 0 004.356 4.5H2.25" />
    </svg>
);

export default ShoppingCartIcon;
