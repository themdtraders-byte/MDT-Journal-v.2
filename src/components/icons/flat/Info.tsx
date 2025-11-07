
'use client';
import React from 'react';

export const Info = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="11" fill="#3498DB" stroke="#3498DB" strokeWidth="2"/>
        <circle cx="12" cy="7.5" r="1.5" fill="white"/>
        <rect x="10.5" y="11" width="3" height="7" rx="1.5" fill="white"/>
    </svg>
);
