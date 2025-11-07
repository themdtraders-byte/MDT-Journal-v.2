
'use client';
import React from 'react';

export const Rocket = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M5.5 16.5L4 20L7.5 18.5" stroke="#E48900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 14L8 22L12 19L16 22L12 14Z" fill="#E48900"/>
        <path d="M12 2L13.5 6.5L18 8L13.5 9.5L12 14L10.5 9.5L6 8L10.5 6.5L12 2Z" fill="#4680FF" stroke="#4680FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
