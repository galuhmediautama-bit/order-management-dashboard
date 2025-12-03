
import React from 'react';

const BrandsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v1h-14v-1zM5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z"></path>
  </svg>
);

export default BrandsIcon;
