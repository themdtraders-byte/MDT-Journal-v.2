
'use client';
import React from 'react';

export const BrainBulb = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M12 2a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5v0a4.5 4.5 0 0 1-4.5-4.5v0A4.5 4.5 0 0 1 12 2z" />
        <path d="M14 11a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2z" />
        <path d="M12 16v2" />
        <path d="M10 22h4" />
        <path d="M9 19h6" />
    </svg>
);
