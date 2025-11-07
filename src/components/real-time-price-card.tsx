
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import PairIcon from './PairIcon';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useJournalStore } from '@/hooks/use-journal-store';

interface RealTimePriceCardProps {
  pair: string;
}

const RealTimePriceCard = ({ pair }: RealTimePriceCardProps) => {
  const { appSettings } = useJournalStore();
  const pairInfo = appSettings.pairsConfig[pair as keyof typeof appSettings.pairsConfig];

  const [price, setPrice] = useState<number | null>(null);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`/api/price?pair=${pair}`);
        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }
        const data = await response.json();
        
        if (typeof data.price === 'number') {
            setLastPrice(price);
            setPrice(data.price);
            if (lastPrice !== null) {
                setDirection(data.price >= lastPrice ? 'up' : 'down');
            }
        }
      } catch (error) {
        console.error(`Error fetching price for ${pair}:`, error);
        // Keep the last known price on error
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 300000); // Fetch every 5 minutes

    return () => clearInterval(interval);
  }, [pair, price, lastPrice]);
  
  const getPriceFraction = () => {
    if (price === null) return { main: '----', last: '-' };
    const priceString = price.toFixed(5);
    const parts = priceString.split('.');
    const mainPart = parts[0] + '.' + parts[1].slice(0, -1);
    const lastDigit = parts[1].slice(-1);
    return { main: mainPart, last: lastDigit };
  }

  const { main, last } = getPriceFraction();
  const changeColor = direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : 'text-foreground';

  return (
    <Card className="glassmorphic w-48 flex-shrink-0">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <PairIcon pair={pair} className="h-7 w-7"/>
          <span className="font-bold text-sm">{pair}</span>
        </div>
        {price === null ? (
            <div className="h-[4.25rem] flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <>
                <div className={cn("text-2xl font-mono font-bold text-right transition-colors duration-300", changeColor)}>
                    {main}<span className="text-4xl">{last}</span>
                </div>
                <div className="flex justify-end items-center text-xs text-muted-foreground gap-1 mt-1">
                    {direction === 'up' ? <ArrowUp className="h-3 w-3 text-green-500"/> : <ArrowDown className="h-3 w-3 text-red-500"/>}
                    <span>Spread: {pairInfo?.spread || 'N/A'}</span>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimePriceCard;
