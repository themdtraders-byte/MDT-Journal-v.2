
'use client';
import React from 'react';

export const Timer = (props: React.SVGProps<SVGSVGElement>) => (
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
        <line x1="12" y1="12" x2="12" y2="6" />
        <line x1="12" y1="2" x2="10" y2="2" />
        <line x1="14" y1="2" x2="12" y2="2" />
        <circle cx="12" cy="13" r="8" />
    </svg>
);
