
'use client';
import React from 'react';

export const Redo = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M21.5 4c-1.8 2-3.8 3-5.5 3-4.5 0-7-3.5-7-8V2" />
        <path d="M22 4h-4v4" />
    </svg>
);
