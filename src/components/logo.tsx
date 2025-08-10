
import React from 'react';
import { cn } from '@/lib/utils';

export const Logo = ({ className, textClassName }: { className?: string, textClassName?: string }) => (
    <svg 
        viewBox="0 0 160 30" 
        className={cn("h-auto", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ResuAI Logo"
    >
        <circle cx="10" cy="15" r="5" fill="hsl(var(--primary))" />
        <text 
            x="22" 
            y="22" 
            fontFamily="'Archivo Black', sans-serif" 
            fontSize="24" 
            className={cn("fill-foreground", textClassName)}
        >
            ResuAI
        </text>
    </svg>
);
