
'use client';

import Image from 'next/image';
import { Droplets, Bitcoin, Component } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pairsConfig } from '@/lib/data';

interface PairIconProps {
  pair: string;
  className?: string;
}

const GoldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="goldVignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: '#FFDD4A'}} />
                <stop offset="100%" style={{stopColor: '#FDB813'}} />
            </radialGradient>
        </defs>
        <path d="M4 4 L12 2 L20 4 L20 10 C20 16 12 22 12 22 C12 22 4 16 4 10 Z" fill="url(#goldVignette)"/>
        <text x="12" y="14" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">Au</text>
    </svg>
);

const SilverIcon = () => (
     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="silverVignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: '#E0E0E0'}} />
                <stop offset="100%" style={{stopColor: '#A9A9A9'}} />
            </radialGradient>
        </defs>
        <path d="M4 4 L12 2 L20 4 L20 10 C20 16 12 22 12 22 C12 22 4 16 4 10 Z" fill="url(#silverVignette)"/>
        <text x="12" y="14" textAnchor="middle" fontSize="10" fill="#000" fontWeight="bold">Ag</text>
    </svg>
);

const EthereumIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
             <linearGradient id="ethGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#8A2BE2', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#4B0082', stopOpacity: 1}} />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#ethGradient)" />
        <path d="M12 2L11.5 3.5L12 2.5L12.5 3.5L12 2Z" fill="white" fillOpacity="0.7"/>
        <path d="M12 2L5 12L12 16L19 12L12 2Z" fill="white" fillOpacity="0.7"/>
        <path d="M12 17.5L5 13.5L12 22L19 13.5L12 17.5Z" fill="white"/>
        <path d="M5 12L12 16L5 13.5" fill="white" fillOpacity="0.5"/>
        <path d="M19 12L12 16L19 13.5" fill="white" fillOpacity="0.9"/>
    </svg>
);

const IndexIcon = ({ text }: { text: string }) => (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-700 text-white font-bold text-xs">
        {text}
    </div>
)

const getSpecialIcon = (pair: string): React.ReactNode | null => {
    const config = pairsConfig[pair as keyof typeof pairsConfig];
    if (!config || !config.iconName) return null;

    const iconMap: { [key: string]: React.ReactNode } = {
        'XAUUSD': <GoldIcon />,
        'XAGUSD': <SilverIcon />,
        'BTCUSD': <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-[0_0_15px] shadow-orange-500/50"><Bitcoin className="h-5 w-5" /></div>,
        'ETHUSD': <EthereumIcon />,
        'USOIL': <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-gray-900 to-black text-white"><Droplets className="h-5 w-5" /></div>,
        'Component': <IndexIcon text={pair.substring(0,2)} />,
    };
    
    // Check for indices patterns
    if (/[A-Z]{2,}\d{2,}/.test(pair) || ['US30', 'US500', 'USTEC'].includes(pair)) {
        return <IndexIcon text={pair.replace(/\d/g, '').substring(0,2)} />
    }

    return iconMap[config.iconName] || null;
}

const getCountryCode = (currency: string): string => {
  const currencyCodeMap: { [key: string]: string } = {
    USD: 'us', EUR: 'eu', JPY: 'jp', GBP: 'gb', AUD: 'au',
    CAD: 'ca', CHF: 'ch', NZD: 'nz', CNY: 'cn', HKD: 'hk',
    MXN: 'mx', TRY: 'tr', ZAR: 'za', NOK: 'no', SEK: 'se',
  };
  return currencyCodeMap[currency] || currency.toLowerCase().slice(0, 2);
};

const PairIcon = ({ pair, className }: PairIconProps) => {
  if (!pair) {
    return <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-muted", className)}><Component className="h-4 w-4" /></div>;
  }

  const specialIcon = getSpecialIcon(pair);

  if (specialIcon) {
    return <div className={className}>{specialIcon}</div>;
  }

  const base = pair.substring(0, 3).toUpperCase();
  const quote = pair.substring(3, 6).toUpperCase();

  if (base.length !== 3 || quote.length !== 3) {
     return <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-muted", className)}><Component className="h-4 w-4" /></div>
  }

  const baseCode = getCountryCode(base);
  const quoteCode = getCountryCode(quote);

  return (
    <div className={cn("relative w-8 h-8", className)}>
      <Image
        src={`https://flagcdn.com/w40/${baseCode}.png`}
        alt={`${base} flag`}
        width={24}
        height={24}
        className="rounded-full border-2 border-background absolute top-0 left-0 z-10"
      />
      <Image
        src={`https://flagcdn.com/w40/${quoteCode}.png`}
        alt={`${quote} flag`}
        width={24}
        height={24}
        className="rounded-full border-2 border-background absolute bottom-0 right-0"
      />
    </div>
  );
};

export default PairIcon;
