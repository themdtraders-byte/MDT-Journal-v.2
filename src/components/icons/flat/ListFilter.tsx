
'use client';
import React from 'react';

export const ListFilter = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M3 6h18" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
    </svg>
);
