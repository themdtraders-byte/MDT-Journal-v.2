
'use client';
import React from 'react';

export const Brain = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7v0A2.5 2.5 0 0 1 7 9.5v0A2.5 2.5 0 0 1 4.5 12v0a2.5 2.5 0 0 1-2 2.5" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v0A2.5 2.5 0 0 0 14.5 7v0A2.5 2.5 0 0 0 17 9.5v0A2.5 2.5 0 0 0 19.5 12v0a2.5 2.5 0 0 0 2 2.5" />
        <path d="M2.5 14.5A2.5 2.5 0 0 1 4.5 17v0a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 9.5 22v0" />
        <path d="M21.5 14.5A2.5 2.5 0 0 0 19.5 17v0a2.5 2.5 0 0 0-2.5 2.5v0A2.5 2.5 0 0 0 14.5 22v0" />
    </svg>
);
