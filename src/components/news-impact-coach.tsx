
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { NewsEventSelection } from '@/types';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface NewsImpactCoachProps {
    newsEvents: NewsEventSelection[];
    pair: string;
}

const NewsImpactCoach = ({ newsEvents, pair }: NewsImpactCoachProps) => {
    
    const analysis = useMemo(() => {
        if (!newsEvents || newsEvents.length === 0 || !pair) {
            return null;
        }

        const primaryEvent = newsEvents.find(e => e.impact === 'High' && e.details.actual !== undefined && e.details.forecast !== undefined) || 
                             newsEvents.find(e => e.details.actual !== undefined && e.details.forecast !== undefined);

        if (!primaryEvent) {
            return {
                verdict: 'Neutral Impact',
                verdictColor: 'text-muted-foreground',
                reason: 'Could not determine impact. Please provide "Actual" and "Forecast" values for at least one news event.',
                tableData: null
            };
        }
        
        const { currency, details } = primaryEvent;
        const actual = details.actual!;
        const forecast = details.forecast!;
        
        // This is a simplified logic. A real implementation would need to know if higher is better for each specific event.
        // We'll assume higher is better for most common indicators (CPI, GDP, Jobs, etc.)
        const isGoodForCurrency = actual > forecast;
        
        const baseCurrency = pair.substring(0, 3);
        const quoteCurrency = pair.substring(3, 6);

        let verdict = 'Neutral Impact';
        let verdictColor = 'text-muted-foreground';
        let reason = '';
        
        const isCommodity = ['XAU', 'XAG', 'USOIL'].some(p => pair.includes(p));

        if (isCommodity && currency === 'USD') {
            if(isGoodForCurrency) {
                verdict = `Bearish for ${pair}`;
                verdictColor = 'text-red-500';
                reason = `A strong USD makes dollar-priced commodities like ${pair} more expensive for foreign buyers, leading to decreased demand and a likely price drop.`;
            } else {
                verdict = `Bullish for ${pair}`;
                verdictColor = 'text-green-500';
                reason = `A weak USD makes dollar-priced commodities like ${pair} cheaper for foreign buyers, leading to increased demand and a likely price increase.`;
            }
        } else if (currency === quoteCurrency) {
            if (isGoodForCurrency) {
                verdict = `Bearish for ${pair}`;
                verdictColor = 'text-red-500';
                reason = `The news is good for the quote currency (${quoteCurrency}), strengthening it. This means it takes less of the base currency (${baseCurrency}) to buy one unit of the quote currency, causing the pair's value to fall.`;
            } else {
                verdict = `Bullish for ${pair}`;
                verdictColor = 'text-green-500';
                reason = `The news is bad for the quote currency (${quoteCurrency}), weakening it. This means it takes more of the base currency (${baseCurrency}) to buy one unit of the quote currency, causing the pair's value to rise.`;
            }
        } else if (currency === baseCurrency) {
            if (isGoodForCurrency) {
                verdict = `Bullish for ${pair}`;
                verdictColor = 'text-green-500';
                reason = `The news is good for the base currency (${baseCurrency}), strengthening it. This causes the pair's value to rise against the quote currency (${quoteCurrency}).`;
            } else {
                verdict = `Bearish for ${pair}`;
                verdictColor = 'text-red-500';
                reason = `The news is bad for the base currency (${baseCurrency}), weakening it. This causes the pair's value to fall against the quote currency (${quoteCurrency}).`;
            }
        } else {
             reason = `The primary news event currency (${currency}) is not part of the selected pair (${pair}), so direct impact is less certain.`;
        }

        return {
            verdict,
            verdictColor,
            reason,
            tableData: {
                newsEvent: `Good News for ${currency}`,
                affectedPair: pair,
                impact: verdict.split(' ')[0]
            }
        };

    }, [newsEvents, pair]);

    if (!analysis) {
        return null;
    }

    const { verdict, verdictColor, reason, tableData } = analysis;

    return (
        <Card className="glassmorphic bg-primary/5 mt-2">
            <CardHeader className="p-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    News Impact Coach
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-2">
                <div className="text-center bg-muted/50 p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">Expected Market Impact</p>
                    <p className={cn("text-base font-bold", verdictColor)}>{verdict}</p>
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center">
                    {reason}
                </p>
            </CardContent>
        </Card>
    );
};

export default NewsImpactCoach;
