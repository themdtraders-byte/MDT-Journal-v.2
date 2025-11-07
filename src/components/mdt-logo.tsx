

'use client';

import React, { useState, useEffect } from 'react';
import { AnimatedBars } from './ui/animated-bars';

export const MdtLogo = ({ className }: { className?: string }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <svg
      viewBox="0 0 400 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ fontFamily: "'PT Sans', sans-serif" }}
    >
      <defs>
         <radialGradient id="flameGradient" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#A3D8FF" /> 
          <stop offset="50%" stopColor="#007BFF" /> 
          <stop offset="100%" stopColor="#4A00E0" />
        </radialGradient>

        <filter id="flame-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            baseFrequency="0.02 0.05"
            numOctaves="2"
            seed="2"
            stitchTiles="stitch"
            type="fractalNoise"
            result="turbulence"
          />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="25" />
        </filter>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="-50%" stopColor="white" stopOpacity="0" />
          <stop offset="-25%" stopColor="white" stopOpacity="0.5" />
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="25%" stopColor="white" stopOpacity="0.5" />
          <stop offset="50%" stopColor="white" stopOpacity="0" />
        </linearGradient>
         <clipPath id="logo-clip">
           <path 
              d="M200 10 C 180 50, 180 80, 200 120 C 220 80, 220 50, 200 10 Z"
          />
          <text 
              x="200" 
              y="100" 
              fontFamily="'PT Sans', sans-serif"
              fontSize="40" 
              textAnchor="middle"
              letterSpacing="4"
              fontWeight="bold"
              fillOpacity="1"
          >
              MD TRADERS
          </text>
         </clipPath>
      </defs>
      
      {/* Base Flame Shape */}
      <g filter="url(#flame-filter)" transform="translate(0 -20)">
          {/* Layer 1 - Main Body */}
          <path 
              d="M200 10 C 180 50, 180 80, 200 120 C 220 80, 220 50, 200 10 Z"
              fill="url(#flameGradient)"
          />
          {/* Layer 2 - Inner Core */}
           <path 
              d="M200 30 C 190 60, 190 80, 200 110 C 210 80, 210 60, 200 30 Z"
              fill="url(#flameGradient)"
              opacity="0.5"
          />
      </g>

      {/* MD TRADERS Text */}
      <text 
        x="200" 
        y="100" 
        fontFamily="'PT Sans', sans-serif"
        fontSize="40" 
        fill="white" 
        fillOpacity="1"
        textAnchor="middle"
        letterSpacing="4"
        fontWeight="bold"
        style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.5)" }}
      >
        MD TRADERS
      </text>

      {/* Tagline Text */}
      <text 
        x="200" 
        y="125" 
        fontFamily="'PT Sans', sans-serif"
        fontSize="12" 
        fill="white" 
        textAnchor="middle"
        letterSpacing="2"
        opacity="0.8"
      >
        THE EDGE YOU'VE BEEN MISSING
      </text>
      
      <g className="shiny-effect">
        <rect 
          x="0" 
          y="0" 
          width="400" 
          height="150" 
          fill="url(#shine)" 
          clipPath="url(#logo-clip)" 
        />
      </g>

      {/* Foreign object to include HTML/React component */}
      {isClient && (
        <foreignObject x="0" y="130" width="400" height="20">
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <AnimatedBars />
            </div>
        </foreignObject>
      )}
    </svg>
  );
};
