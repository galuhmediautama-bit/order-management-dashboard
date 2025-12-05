import React from 'react';

interface CubeIconProps {
  className?: string;
}

const CubeIcon: React.FC<CubeIconProps> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
};

export default CubeIcon;
