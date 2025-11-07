

'use client';

import React from 'react';
import './financial-bars-loader.css';

const Candle = ({ isGreen, animationDuration, animationDelay }: { isGreen: boolean; animationDuration: number; animationDelay: number; }) => {
    const color = isGreen ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
    const randomHeight = Math.random() * 15 + 5; // Body height between 5 and 20
    const randomWick = Math.random() * 10 + 2;   // Wick height between 2 and 12

    return (
        <svg
            className="candle"
            width="8"
            height="40"
            viewBox="0 0 8 40"
            style={{
                animationDuration: `${animationDuration}s`,
                animationDelay: `${animationDelay}s`,
            }}
        >
            {/* Wick */}
            <line x1="4" y1="0" x2="4" y2={20 + randomWick} stroke={color} strokeWidth="1.5" />
            {/* Body */}
            <rect x="1" y="10" width="6" height={randomHeight} fill={color} rx="1" />
        </svg>
    );
};

export const AnimatedBars = () => {
    const candleCount = 18;
    const candles = Array.from({ length: candleCount });

    return (
        <div className="financial-bars-loader">
            {candles.map((_, index) => {
                const duration = Math.random() * 2 + 1; // 1s to 3s
                const delay = Math.random() * 2; // 0s to 2s
                const isGreen = Math.random() > 0.5;

                return (
                    <Candle
                        key={index}
                        isGreen={isGreen}
                        animationDuration={duration}
                        animationDelay={delay}
                    />
                );
            })}
        </div>
    );
};
