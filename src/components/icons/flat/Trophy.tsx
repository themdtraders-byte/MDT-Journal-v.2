
'use client';
import React from 'react';

export const Trophy = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21A3.5 3.5 0 0 1 12 18.5a3.5 3.5 0 0 1 2.97-.29c-.5-.23-.97-.66-.97-1.21v-2.34" />
        <path d="M12 11.1V14.5" />
        <path d="M12 2v5.11" />
        <path d="M8.5 4.5a3.5 3.5 0 1 1 7 0" />
    </svg>
);
