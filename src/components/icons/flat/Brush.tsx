
'use client';
import React from 'react';

export const Brush = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M7 21H11" stroke="#4F4F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.5 6.5L17.5 1.5" stroke="#4F4F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 3L21 7" stroke="#4F4F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 8L21 3" stroke="#4F4F4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 13C18 17.4183 14.4183 21 10 21C5.58172 21 2 17.4183 2 13C2 8.58172 5.58172 5 10 5C14.4183 5 18 8.58172 18 13Z" fill="#4680FF" stroke="#4680FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
