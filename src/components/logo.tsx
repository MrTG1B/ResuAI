import React from 'react';
import Image from 'next/image';

export const Logo = ({ className }: { className?: string }) => (
    <Image
        src="/logo.png"
        alt="ResuAI Logo"
        width={120}
        height={90}
        className={className}
        priority
    />
);
