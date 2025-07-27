
import React from 'react';
import { cn } from '@/lib/utils';

export const MentraIcon = ({ className, isAnimated = false }: { className?: string, isAnimated?: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className={cn(className, isAnimated && 'animate-wobble')}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* Brain Outline - the "head" that will wobble */}
        <g>
            <path d="M32 12C20 12 14 22 14 32S20 52 32 52s18-10 18-20S44 12 32 12z" />
            <path d="M32 12c-4 0-6 4-6 10s2 10 6 10s6-4 6-10s-2-10-6-10z" />
            <path d="M26 32c-4 0-6 4-6 10s2 10 6 10s6-4 6-10s-2-10-6-10z" />
            <path d="M38 32c-4 0-6 4-6 10s2 10 6 10s6-4 6-10s-2-10-6-10z" />
        </g>

        {/* Lighthouse Beam */}
        <path d="M32 32 L48 22" strokeWidth="2.5" />
        <path d="M32 32 L50 32" strokeWidth="2.5" />
        <path d="M32 32 L48 42" strokeWidth="2.5" />
    </svg>
);
