
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell, Brush } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Brain, Info } from 'lucide-react';
import EfficiencyCoach from './efficiency-coach';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import FormattedNumber from '../ui/formatted-number';

type ChartType = 'risk' | 'time';

interface EfficiencyChartProps {
  trades: Trade[];
  onClick?: (data: any) => void;
}

const CustomTooltip = ({ active, payload, label, chartType }: { active?: boolean; payload?: any[]; label?: string; chartType: ChartType }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const tradeObject = data.tradeObject;
        if(!tradeObject) return null;
        const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : 'bg-red-500';

        return (
            <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
                <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                        <p className="font-bold text-xs">Trade #{label}</p>
                    </div>
                    <p className="text-muted-foreground text-[9px]">{data.tradeObject?.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {chartType === 'risk' ? (
                         <>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" />Cumulative R</div>
                            <div className={cn("font-bold text-right", data.cumulativeR >= 0 ? "text-blue-400" : "text-red-400")}>{data.cumulativeR.toFixed(2)}R</div>
                         </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-teal-500" />Profit/Hour</div>
                            <div className={cn("font-bold text-right", data.profitPerHour >= 0 ? "text-teal-400" : "text-red-400")}><FormattedNumber value={data.profitPerHour}/></div>
                         </>
                    )}
                     <hr className="col-span-2 border-border/50 my-1"/>
                     <div className="text-muted-foreground">Instrument</div>
                    <div className="font-bold text-right">{tradeObject.pair}</div>
                    <div className="text-muted-foreground">Risk %</div>
                    <div className="font-bold text-right">{tradeObject.auto.riskPercent.toFixed(2)}%</div>
                     <div className="text-muted-foreground">P/L</div>
                    <div className={cn("font-bold text-right", tradeObject.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}>
                        <FormattedNumber value={tradeObject.auto.pl} />
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function EfficiencyChart({ trades, onClick }: { trades: Trade[], onClick?: (data: any) => void }) {
    const { appSettings } = useJournalStore();
    const [chartType, setChartType] = useState<ChartType>('risk');

    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0 || !appSettings) return null;

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let cumulativeR = 0;
        let totalDurationHours = 0;
        let totalProfit = 0;
        let totalCost = 0;
        
        let tradesWithoutMistake = 0;
        let winnersWithMistake = 0;
        let losersWithMistake = 0;
        let entryMistakes = 0;

        const chartData = sortedTrades.map((trade, index) => {
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            let realizedR = 0;
            if (trade.stopLoss && trade.stopLoss > 0) {
                const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
                const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
                if (riskAmount > 0) {
                    realizedR = trade.auto.pl / riskAmount;
                }
            }
            
            cumulativeR += realizedR;
            totalDurationHours += trade.auto.durationMinutes / 60;
            totalProfit += trade.auto.pl;
            totalCost += (trade.auto.commissionCost || 0) + (trade.auto.spreadCost || 0);

             // Efficiency & Mistake Calculations
            const mfePips = trade.auto.mfe || 0;
            const maePips = trade.auto.mae || 0;
            const pcp = mfePips > 0 ? (trade.auto.pips / mfePips) * 100 : 0;
            
            if (pcp >= 80) tradesWithoutMistake++;
            if (trade.auto.status === 'Win' && pcp < 50) winnersWithMistake++;
            if (trade.auto.status === 'Loss' && maePips > Math.abs(trade.auto.pips)) losersWithMistake++;
            if (trade.auto.score.value < 75) entryMistakes++;
            
            return {
                tradeNumber: index + 1,
                cumulativeR,
                profitPerHour: totalDurationHours > 0 ? totalProfit / totalDurationHours : 0,
                costPerTrade: (totalCost / (index + 1)),
                profitPerTrade: totalProfit / (index + 1),
                pcp,
                tradeObject: trade,
            };
        });
        
        const winningTradesCount = trades.filter(t => t.auto.status === 'Win').length;
        const losingTradesCount = trades.filter(t => t.auto.status === 'Loss').length;
        const totalTrades = trades.length;

        return {
            chartData,
            tradesWithoutMistakePercent: (tradesWithoutMistake / totalTrades) * 100,
            entryMistakePercent: (entryMistakes / totalTrades) * 100,
            exitMistakePercent: winningTradesCount > 0 ? (winnersWithMistake / winningTradesCount) * 100 : 0,
            managementMistakePercent: losingTradesCount > 0 ? (losersWithMistake / losingTradesCount) * 100 : 0,
        };

    }, [trades, appSettings]);

    if (!analysisData) {
        return (
            <Card className="glassmorphic bg-glass-teal">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="text-primary"/>
                        Efficiency Analysis
                    </CardTitle>
                    <CardDescription>Analyze how effectively your trading converts risk and time into profit.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough data for efficiency analysis.</p>
                </CardContent>
             </Card>
        );
    }
    
    const { chartData, ...stats } = analysisData;
    const isRiskChart = chartType === 'risk';

    return (
        <div className="space-y-4">
            <Card className="glassmorphic bg-glass-teal">
                <CardHeader>
                     <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="text-primary"/>
                                Efficiency Analysis
                            </CardTitle>
                            <CardDescription>
                                Analyze how effectively your trading converts risk and time into profit.
                            </CardDescription>
                        </div>
                         <div className="flex items-center gap-2">
                             <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)} className="w-auto">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="risk">Risk-Based</TabsTrigger>
                                    <TabsTrigger value="time">Time-Based</TabsTrigger>
                                </TabsList>
                            </Tabs>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                       <ComposedChart 
                            data={chartData} 
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            onClick={onClick}
                            className={onClick ? 'cursor-pointer' : ''}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis 
                                dataKey="tradeNumber"
                                type="number"
                                domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <YAxis 
                                yAxisId="left"
                                tickFormatter={(v) => isRiskChart ? `${v}R` : `$${v.toFixed(0)}`}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                            />
                            <Tooltip content={<CustomTooltip chartType={chartType} />} />
                            <Legend iconType="square" height={36} />
                            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} yAxisId="left" />
                             <defs>
                                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                </linearGradient>
                             </defs>
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey={isRiskChart ? 'cumulativeR' : 'profitPerHour'}
                                name={isRiskChart ? 'Risk Efficiency (Cumulative R)' : 'Time Efficiency (P/L per Hour)'}
                                stroke={isRiskChart ? '#3B82F6' : '#14B8A6'}
                                fill={isRiskChart ? 'url(#riskGradient)' : 'url(#timeGradient)'}
                                strokeWidth={1.5} 
                                dot={false} 
                                activeDot={{ r: 4 }} 
                            />
                       </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <EfficiencyCoach 
                trades={trades} 
                efficiencyData={chartData}
            />
        </div>
    );
}
