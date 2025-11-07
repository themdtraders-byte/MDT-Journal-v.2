

'use client';
import { useMemo } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FormattedNumber from '@/components/ui/formatted-number';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatCard from '../ui/stat-card';

type BarChartData = {
  name: string;
  profit: number;
  loss: number;
  trades: number;
  winRate: number;
  totalR: number;
  avgR: number;
  profitFactor: number;
  totalPl: number;
  gainPercent: number;
  expectancy: number;
  avgPl: number;
  avgLotSize: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgDuration: string;
  avgScore: number;
};

const PairStatGrid = ({ data }: { data: BarChartData[] }) => {
    const pairStats = useMemo(() => {
        if (data.length === 0) {
            return {
                bestInstrumentSum: { name: 'N/A', totalPl: 0 },
                worstInstrumentSum: { name: 'N/A', totalPl: 0 },
                bestInstrumentAvg: { name: 'N/A', avgPl: 0 },
                worstInstrumentAvg: { name: 'N/A', avgPl: 0 },
                count: 0
            };
        }

        const dataWithAvgPl = data.map(d => ({ ...d, avgPl: d.trades > 0 ? d.totalPl / d.trades : 0 }));
        
        const sortedBySum = [...dataWithAvgPl].sort((a,b) => b.totalPl - a.totalPl);
        const sortedByAvg = [...dataWithAvgPl].sort((a,b) => b.avgPl - a.avgPl);
        
        return {
            bestInstrumentSum: sortedBySum[0],
            worstInstrumentSum: sortedBySum[sortedBySum.length - 1],
            bestInstrumentAvg: sortedByAvg[0],
            worstInstrumentAvg: sortedByAvg[sortedByAvg.length - 1],
            count: data.length
        };
    }, [data]);

    return (
        <CardContent className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard positive={pairStats.bestInstrumentSum.totalPl >= 0} label="Best Pair (Sum)" value={<FormattedNumber value={pairStats.bestInstrumentSum.totalPl} />} subValue={pairStats.bestInstrumentSum.name} tooltip="The most profitable pair by total P/L."/>
                <StatCard positive={pairStats.worstInstrumentSum.totalPl >= 0} label="Worst Pair (Sum)" value={<FormattedNumber value={pairStats.worstInstrumentSum.totalPl} />} subValue={pairStats.worstInstrumentSum.name} tooltip="The least profitable pair by total P/L."/>
                <StatCard positive={pairStats.bestInstrumentAvg.avgPl >= 0} label="Best Pair (Avg)" value={<FormattedNumber value={pairStats.bestInstrumentAvg.avgPl} />} subValue={pairStats.bestInstrumentAvg.name} tooltip="The most profitable pair by average P/L per trade."/>
                <StatCard positive={pairStats.worstInstrumentAvg.avgPl >= 0} label="Worst Pair (Avg)" value={<FormattedNumber value={pairStats.worstInstrumentAvg.avgPl} />} subValue={pairStats.worstInstrumentAvg.name} tooltip="The least profitable pair by average P/L per trade."/>
                <StatCard label="Total Pairs Traded" value={pairStats.count} tooltip="The total number of unique pairs traded."/>
            </div>
        </CardContent>
    );
};

export default PairStatGrid;
