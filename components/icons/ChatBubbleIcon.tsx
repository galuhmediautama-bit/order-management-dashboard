import React from 'react';

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 01-1.06 0l-3.72-3.72H6.31c-1.133 0-1.98-.987-1.98-2.193v-4.286c0-.97.616-1.813 1.5-2.097m14.25-6.118c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 01-1.06 0l-3.72-3.72H6.31c-1.133 0-1.98-.987-1.98-2.193v-4.286c0-.97.616-1.813 1.5-2.097" />
    </svg>
);

export default ChatBubbleIcon;
