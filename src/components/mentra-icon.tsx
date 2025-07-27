
import React from 'react';
import { cn } from '@/lib/utils';

export const MentraIcon = ({ className, isAnimated = false }: { className?: string, isAnimated?: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={cn(className)}
        fill="currentColor" // Use currentColor to inherit from parent
    >
        {/* Group the head elements to apply the animation */}
        <g className={cn(isAnimated && 'animate-wobble')} style={{ transformOrigin: 'center 8px' }}>
            <circle cx="12" cy="6" r="4" fillOpacity="0.8"></circle>
            <path d="M16,6c0-2.2-1.8-4-4-4v8C14.2,10,16,8.2,16,6z" fillOpacity="0.6"></path>
        </g>
        
        {/* Body elements */}
        <path d="M20.5,18.1C19.3,14.4,15.8,12,12,12s-7.3,2.4-8.5,6.1c-0.3,0.9-0.2,1.9,0.4,2.7C4.5,21.5,5.4,22,6.3,22h11.3 c1,0,1.9-0.5,2.5-1.3C20.7,19.9,20.8,19,20.5,18.1z" fillOpacity="0.4"></path>
        <path d="M20.1,20.7c0.6-0.8,0.7-1.8,0.4-2.7C19.3,14.4,15.8,12,12,12v10h5.7C18.6,22,19.5,21.5,20.1,20.7z" fillOpacity="0.2"></path>
    </svg>
);
