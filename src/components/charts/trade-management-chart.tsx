
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { BarChart } from 'lucide-react';
import TradeManagementCoach from './trade-management-coach';
import StatCard from '../ui/stat-card';
import FormattedNumber from '../ui/formatted-number';


const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const tradeObject = data.tradeObject;
        const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : 'bg-red-500';

        const managementEffect = data.actualR - data.potentialR;
        return (
            <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                        <p className="font-bold text-xs">Trade #{data.tradeNumber}</p>
                    </div>
                    <p className="text-muted-foreground text-[9px]">{data.tradeObject?.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <div className="text-green-500">Actual R</div>
                    <div className="font-bold text-right text-green-500">{data.actualR.toFixed(2)}R</div>
                    <div className="text-orange-500">Potential R</div>
                    <div className="font-bold text-right text-orange-500">{data.potentialR.toFixed(2)}R</div>
                    <div className="text-blue-500">Mgmt. Effect</div>
                    <div className={cn("font-bold text-right", managementEffect >= 0 ? 'text-blue-500' : 'text-red-500')}>
                        {managementEffect >= 0 ? '+' : ''}{managementEffect.toFixed(2)}R
                    </div>
                    <hr className="col-span-2 border-border/50 my-1"/>
                    <div className="text-muted-foreground">Instrument</div>
                    <div className="font-bold text-right">{tradeObject.pair}</div>
                    <div className="text-muted-foreground">Risk %</div>
                    <div className="font-bold text-right">{tradeObject.auto.riskPercent.toFixed(2)}%</div>
                </div>
            </div>
        );
    }
    return null;
};

interface TradeManagementChartProps {
    trades: Trade[];
    onClick?: (data: any) => void;
    showZoomSlider?: boolean;
    brushY?: number;
}

export default function TradeManagementChart({ trades, onClick, showZoomSlider = false, brushY = 275 }: TradeManagementChartProps) {
    const { appSettings } = useJournalStore();

    const analysisData = useMemo(() => {
        if (!trades || trades.length < 1 || !appSettings) return null;

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let cumulativeActualR = 0;
        let cumulativePotentialR = 0;
        let cumulativeManagementEffect = 0;

        let correctlyManagedCount = 0;
        let incorrectlyManagedCount = 0;
        
        const chartData = sortedTrades.map((trade, index) => {
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            if (!trade.stopLoss || trade.stopLoss === 0) return null;
            const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
            if (riskPips === 0) return null;

            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            if (riskAmount === 0) return null;

            const actualR = trade.auto.pl / riskAmount;
            
            let potentialPl = 0;
            const isManualClose = trade.auto.result === 'Stop';

            if (isManualClose) {
                if (trade.wasTpHit === true) {
                    const tpPips = trade.takeProfit ? Math.abs(trade.takeProfit - trade.entryPrice) / pairInfo.pipSize : 0;
                    potentialPl = tpPips * pairInfo.pipValue * trade.lotSize * (trade.direction === 'Buy' ? 1 : -1);
                } else if (trade.wasTpHit === false) {
                    potentialPl = -riskAmount;
                } else {
                    potentialPl = trade.auto.pl;
                }
            } else {
                 potentialPl = trade.auto.pl;
            }
            
            const potentialR = potentialPl / riskAmount;
            const managementEffect = actualR - potentialR;

            if(isManualClose) {
                if(managementEffect > 0) correctlyManagedCount++;
                if(managementEffect < 0) incorrectlyManagedCount++;
            }

            cumulativeActualR += actualR;
            cumulativePotentialR += potentialR;
            cumulativeManagementEffect += managementEffect;

            return {
                tradeNumber: index + 1,
                actualR: cumulativeActualR,
                potentialR: cumulativePotentialR,
                managementEffect: cumulativeManagementEffect,
                tradeObject: trade,
            };
        }).filter(Boolean);

        const totalManaged = correctlyManagedCount + incorrectlyManagedCount;
        
        return {
            chartData,
            stats: {
                correctlyManagedPercent: totalManaged > 0 ? (correctlyManagedCount / totalManaged) * 100 : 0,
                incorrectlyManagedPercent: totalManaged > 0 ? (incorrectlyManagedCount / totalManaged) * 100 : 0,
                actualPerformanceSum: cumulativeActualR,
                potentialPerformanceSum: cumulativePotentialR,
                managementEffectSum: cumulativeManagementEffect,
            }
        };
    }, [trades, appSettings]);

    if (!analysisData) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="text-primary"/>
                        Trade Management
                    </CardTitle>
                    <CardDescription>Log trades with `wasTpHit` data to analyze management effectiveness.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough data for this chart.</p>
                </CardContent>
             </Card>
        );
    }
    
    const { chartData, stats } = analysisData;

    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart className="text-primary"/>
                        Trade Management
                    </CardTitle>
                    <CardDescription>
                        Compares your actual performance against what you could have achieved by letting trades hit their original SL/TP.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                       <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: showZoomSlider ? 20 : 5 }} onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis 
                                dataKey="tradeNumber"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} 
                                dy={10}
                            />
                            <YAxis 
                                tickFormatter={(v) => v} 
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Cumulative R-Multiple', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="square" height={36} />
                            <Line type="monotone" dataKey="actualR" name="Actual Performance" stroke="#22C55E" strokeWidth={1} dot={false} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="potentialR" name="Potential Performance" stroke="#F97316" strokeWidth={1} dot={false} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="managementEffect" name="R Gained by Managing" stroke="#3B82F6" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                            {showZoomSlider && brushY && <Brush dataKey="tradeNumber" height={5} stroke="hsl(var(--foreground))" y={brushY} />}
                       </ComposedChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
                        <StatCard 
                            label="Managed Correctly"
                            value={`${stats.correctlyManagedPercent.toFixed(0)}%`}
                            subValue="Interventions improved outcome"
                            positive={true}
                        />
                         <StatCard 
                            label="Managed Incorrectly"
                            value={`${stats.incorrectlyManagedPercent.toFixed(0)}%`}
                            subValue="Interventions worsened outcome"
                            positive={false}
                        />
                         <StatCard 
                            label="Actual Performance"
                            value={`${stats.actualPerformanceSum.toFixed(2)}R`}
                            subValue="Cumulative R-Multiple"
                            positive={stats.actualPerformanceSum >= 0}
                        />
                         <StatCard 
                            label="Potential Performance"
                            value={`${stats.potentialPerformanceSum.toFixed(2)}R`}
                            subValue="R-Multiple if not managed"
                            positive={stats.potentialPerformanceSum >= 0}
                        />
                         <StatCard 
                            label="Management Effect"
                            value={`${stats.managementEffectSum.toFixed(2)}R`}
                            subValue="R gained or lost by managing"
                            positive={stats.managementEffectSum >= 0}
                        />
                    </div>
                </CardContent>
            </Card>
            <TradeManagementCoach trades={trades} managementData={chartData} />
        </div>
    )
}
