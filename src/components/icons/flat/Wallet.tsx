
'use client';
import React from 'react';

export const Wallet = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M20 12V8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2z" />
    </svg>
);
