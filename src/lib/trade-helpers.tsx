

'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from './utils';

export const getStatusIcon = (outcome: 'Win' | 'Loss' | 'Neutral') => {
    if (outcome === 'Win') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (outcome === 'Loss') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
};

export const getResultBadgeVariant = (result: 'TP' | 'SL' | 'BE' | 'Stop' | 'Running') => {
    switch (result) {
        case 'TP': return 'bg-green-500/20 text-green-500';
        case 'SL': return 'bg-red-500/20 text-red-500';
        case 'BE': return 'bg-blue-500/20 text-blue-400';
        case 'Running': return 'bg-yellow-500/20 text-yellow-500';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

    