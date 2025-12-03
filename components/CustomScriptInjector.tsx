// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React, { useEffect, useRef } from 'react';

const CustomScriptInjector: React.FC<{ scriptContent: string }> = ({ scriptContent }) => {
    const injectedElements = useRef<HTMLElement[]>([]);

    useEffect(() => {
        // Cleanup previous script if content changes
        injectedElements.current.forEach(el => {
            if (document.head.contains(el)) {
                document.head.removeChild(el);
            }
        });
        injectedElements.current = [];

        if (!scriptContent) {
            return;
        }

        try {
            const scriptEl = document.createElement('script');
            // Using innerHTML to execute the script block
            scriptEl.innerHTML = scriptContent;

            // Prepend to head to ensure it's available early
            document.head.insertBefore(scriptEl, document.head.firstChild);
            
            injectedElements.current.push(scriptEl);
        } catch (error) {
            console.error("Error injecting custom script:", error);
        }
        
        // Cleanup on unmount
        return () => {
            injectedElements.current.forEach(el => {
                if (document.head.contains(el)) {
                    document.head.removeChild(el);
                }
            });
            injectedElements.current = [];
        };

    }, [scriptContent]);

    return null;
};

export default CustomScriptInjector;
