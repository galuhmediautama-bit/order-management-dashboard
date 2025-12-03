
import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM3 13.239a3.75 3.75 0 007.5 0v-1.062a3.75 3.75 0 00-7.5 0v1.062zM17.25 12.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM14.25 8.25c0 .621.504 1.125 1.125 1.125s1.125-.504 1.125-1.125S16.004 7.125 15.375 7.125 14.25 7.629 14.25 8.25z" />
    </svg>
);

export default UsersIcon;
