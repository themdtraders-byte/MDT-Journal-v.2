
'use client';
import React from 'react';

export const BullIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        <path d="M12 2L8 6" />
        <path d="M16 6L12 2" />
        <path d="M12 22V18" />
        <path d="M12 18H8.5C6 18 4 16 4 13.5V11C4 8.5 6 6.5 8.5 6.5H15.5C18 6.5 20 8.5 20 11V13.5C20 16 18 18 15.5 18H12Z" />
    </svg>
);
