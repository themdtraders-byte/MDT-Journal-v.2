
'use client';
import React from 'react';

export const Gamepad = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M6 12h4m-2-2v4" />
        <path d="M15 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <path d="M18 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
    </svg>
);
