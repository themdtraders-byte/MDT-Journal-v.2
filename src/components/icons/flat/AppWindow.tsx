
'use client';
import React from 'react';

export const AppWindow = (props: React.SVGProps<SVGSVGElement>) => (
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
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 8h20" />
        <path d="M6 4v4" />
    </svg>
);
