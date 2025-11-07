
'use client';
import React from 'react';

export const ChartLabIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M7 21h10" />
        <path d="M12 21v-8" />
        <path d="M12 3v2" />
        <path d="M12 9a2 2 0 00-2 2H8a4 4 0 018 0h-2a2 2 0 00-2-2z" />
        <path d="M6 15a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" />
    </svg>
);
