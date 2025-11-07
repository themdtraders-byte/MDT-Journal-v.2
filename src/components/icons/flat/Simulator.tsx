
'use client';
import React from 'react';

export const Simulator = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 11.13V12a2 2 0 1 0 4 0v-.38" />
        <path d="M12 11.13V12a2 2 0 1 1-4 0v-.38" />
    </svg>
);
