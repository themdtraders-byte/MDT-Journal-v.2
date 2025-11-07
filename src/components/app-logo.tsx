
'use client';

import React from 'react';

export const AppLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="grad-green-shiny" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="50%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="grad-red-shiny" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="50%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
        <feOffset dx="2" dy="4" result="offsetblur"/>
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5"/>
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"/> 
        </feMerge>
      </filter>
       <linearGradient id="bg-shine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
    </defs>
    
    {/* Background with 3D effect */}
    <g filter="url(#drop-shadow)">
      <rect width="100" height="100" rx="15" fill="#1C1C1C"/>
      <rect width="100" height="100" rx="15" fill="url(#bg-shine)"/>
    </g>
    
    {/* Main "D" shape */}
    <g fill="white">
        {/* Vertical bar of D */}
        <path d="M28 22 H 38 V 78 H 28 Z" />
        {/* Curved part of D */}
        <path d="M38 22 C 58 22, 72 34, 72 50 C 72 66, 58 78, 38 78 V 22 Z" />
    </g>

    {/* Candles with animation */}
    <g className="candle-group">
      {/* Green Candle 1 */}
      <g className="animate-candle-up">
        <rect x="42" y="30" width="6" height="38" rx="3" fill="url(#grad-green-shiny)" />
        <rect x="44" y="24" width="2" height="50" fill="url(#grad-green-shiny)" />
      </g>
      
      {/* Red Candle 1 */}
       <g className="animate-candle-down">
        <rect x="50" y="32" width="6" height="38" rx="3" fill="url(#grad-red-shiny)" />
        <rect x="52" y="26" width="2" height="50" fill="url(#grad-red-shiny)" />
      </g>
      
      {/* Green Candle 2 */}
       <g className="animate-candle-up" style={{ animationDelay: '0.2s' }}>
        <rect x="58" y="30" width="6" height="38" rx="3" fill="url(#grad-green-shiny)" />
        <rect x="60" y="24" width="2" height="50" fill="url(#grad-green-shiny)" />
      </g>

       {/* Red Candle 2 */}
       <g className="animate-candle-down" style={{ animationDelay: '0.2s' }}>
        <rect x="66" y="32" width="6" height="38" rx="3" fill="url(#grad-red-shiny)" />
        <rect x="68" y="26" width="2" height="50" fill="url(#grad-red-shiny)" />
      </g>
    </g>
  </svg>
);
