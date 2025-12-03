import React from 'react';
import { createPortal } from 'react-dom';

interface HeadManagerProps {
    children: React.ReactNode;
}

const HeadManager: React.FC<HeadManagerProps> = ({ children }) => {
    const [head, setHead] = React.useState<HTMLElement | null>(null);
    React.useEffect(() => {
        setHead(document.head);
    }, []);
    
    return head ? createPortal(children, head) : null;
};

export default HeadManager;
