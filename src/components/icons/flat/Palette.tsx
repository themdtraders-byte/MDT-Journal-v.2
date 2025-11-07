
'use client';
import React from 'react';

export const Palette = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <circle cx="12" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="12" r="3" />
        <path d="M12 21a9 9 0 0 0 9-9" />
        <path d="M3 12a9 9 0 0 1 9-9" />
    </svg>
);
