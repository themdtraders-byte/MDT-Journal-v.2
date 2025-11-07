

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell, Brush } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { BarChartHorizontal, Info } from 'lucide-react';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import StatCard from '../ui/stat-card';
import FormattedNumber from '../ui/formatted-number';
import PcpPcrCoach from './pcp-pcr-coach';

type DisplayMode = 'percentage' | 'rMultiple';
type ChartType = 'PCP' | 'PCR';

interface PcpPcrChartProps {
  trades: Trade[];
  onClick?: (data: any) => void;
  showZoomSlider?: boolean;
  brushY?: number;
}

const CustomTooltip = ({ active, payload, label, chartType }: { active?: boolean; payload?: any[]; label?: string; chartType: ChartType }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        if (!data || !data.tradeObject) return null;

        const tradeObject = data.tradeObject;
        const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : 'bg-red-500';

        return (
            <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
                <div className="flex justify-between items-center mb-1">
                     <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                        <p className="font-bold text-xs">Trade #{label}</p>
                    </div>
                     <p className="text-muted-foreground text-[9px]">{tradeObject.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {chartType === 'PCP' ? (
                         <>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" />Capture %</div>
                            <div className="font-bold text-right text-blue-400">{data.value.toFixed(1)}%</div>
                         </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" />Capture Ratio</div>
                            <div className="font-bold text-right text-blue-400">{data.value.toFixed(2)}</div>
                         </>
                    )}
                    <div className="text-muted-foreground">P/L</div>
                    <div className={cn("font-bold text-right", tradeObject.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={tradeObject.auto.pl} /></div>
                    
                    <hr className="col-span-2 border-border/50 my-1"/>
                    <div className="text-muted-foreground">Instrument</div>
                    <div className="font-bold text-right">{tradeObject.pair}</div>
                    <div className="text-muted-foreground">Risk %</div>
                    <div className="font-bold text-right">{tradeObject.auto.riskPercent.toFixed(2)}%</div>
                    <div className="text-muted-foreground">MFE</div>
                    <div className="font-bold text-right text-green-500">{tradeObject.auto.mfe.toFixed(1)} pips</div>

                    <div className="text-muted-foreground">MAE</div>
                    <div className="font-bold text-right text-red-500">{tradeObject.auto.mae.toFixed(1)} pips</div>
                </div>
            </div>
        );
    }
    return null;
};

export default function PcpPcrChart({ trades, onClick, showZoomSlider = false, brushY = 275 }: PcpPcrChartProps) {
    const { appSettings } = useJournalStore();
    const [chartType, setChartType] = useState<ChartType>('PCP');

    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0 || !appSettings) return null;

        const chartData = trades.map((trade, index) => {
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            if(!trade.stopLoss || trade.stopLoss === 0 || !trade.takeProfit || trade.takeProfit === 0) return null;
            
            const mfePips = trade.auto.mfe || 0;
            const pcp = mfePips > 0 ? (trade.auto.pips / mfePips) * 100 : 0;
            
            const potentialPips = trade.direction === 'Buy' 
                ? (trade.takeProfit - trade.entryPrice) / pairInfo.pipSize 
                : (trade.entryPrice - trade.takeProfit) / pairInfo.pipSize;
            
            const pcr = potentialPips > 0 ? trade.auto.pips / potentialPips : 0;
            
            return {
                name: String(index + 1),
                pcp: pcp > 100 ? 100 : pcp < -100 ? -100 : pcp, // Clamp PCP
                pcr,
                value: chartType === 'PCP' ? (pcp > 100 ? 100 : pcp < -100 ? -100 : pcp) : pcr,
                tradeObject: trade,
            };
        }).filter(Boolean);

        if (chartData.length === 0) return null;

        const winningTrades = chartData.filter(d => d!.tradeObject.auto.outcome === 'Win');
        const losingTrades = chartData.filter(d => d!.tradeObject.auto.outcome === 'Loss');
        
        const avgUpdrawWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + (d!.tradeObject.auto.mfe || 0), 0) / winningTrades.length : 0;
        const avgExitWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + d!.tradeObject.auto.pips, 0) / winningTrades.length : 0;
        const avgDrawdownWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + (d!.tradeObject.auto.mae || 0), 0) / winningTrades.length : 0;
        
        const avgUpdrawLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + (d!.tradeObject.auto.mfe || 0), 0) / losingTrades.length : 0;
        const avgExitLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + d!.tradeObject.auto.pips, 0) / losingTrades.length : 0;
        const avgDrawdownLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + (d!.tradeObject.auto.mae || 0), 0) / losingTrades.length : 0;


        return {
            chartData,
            avgUpdrawWinning,
            avgExitWinning,
            avgDrawdownWinning,
            avgUpdrawLosing,
            avgExitLosing,
            avgDrawdownLosing,
            tradesHitTp: trades.filter(t => t.auto.result === 'TP').length,
            tradesHitSl: trades.filter(t => t.auto.result === 'SL').length,
        };

    }, [trades, appSettings, chartType]);

    if (!analysisData) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChartHorizontal className="text-primary"/>
                        Exit Analysis
                    </CardTitle>
                    <CardDescription>Log trades with MFE/MAE prices to analyze your exits.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough data for exit analysis. Ensure MFE/MAE and TP are logged.</p>
                </CardContent>
             </Card>
        );
    }
    
    const { chartData, ...stats } = analysisData;

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartHorizontal className="text-primary"/>
                            Exit Analysis
                        </CardTitle>
                        <CardDescription>Visualize the exits of your trades and optimize stop loss and target placement.</CardDescription>
                    </div>
                    <div className="w-40 space-y-1">
                        <Label className="text-xs">Chart Type</Label>
                         <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PCP">Profit Capture %</SelectItem>
                                <SelectItem value="PCR">Potential Capture Ratio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                   <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: showZoomSlider ? 20 : 5 }} onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                        <XAxis dataKey="name" type="category" tick={{ fontSize: 10 }} label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} dy={10}/>
                        <YAxis tickFormatter={(v) => `${v.toFixed(0)}${chartType === 'PCP' ? '%' : ''}`} tick={{ fontSize: 10 }} label={{ value: chartType === 'PCP' ? 'Capture %' : 'Capture Ratio', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip content={<CustomTooltip chartType={chartType} />} />
                        <Legend iconType="square" height={36} />

                        <ReferenceLine y={100} label={{ value: "TP 100%", position: 'insideTopRight' }} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                        <ReferenceLine y={-100} label={{ value: "SL -100%", position: 'insideBottomRight' }} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                        <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                        
                         <Bar dataKey="value" barSize={20} name={chartType}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#22C55E' : '#EF4444'} />
                            ))}
                        </Bar>
                        {showZoomSlider && brushY && <Brush dataKey="name" height={15} stroke="hsl(var(--foreground))" y={brushY} />}
                   </ComposedChart>
                </ResponsiveContainer>
                
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-2">
                     <StatCard 
                        label="Trades Hit TP"
                        value={`${(stats.tradesHitTp / trades.length * 100).toFixed(0)}`}
                        unit="%"
                        subValue={`${stats.tradesHitTp} Trades`}
                        positive={true}
                    />
                     <StatCard 
                        label="Trades Hit SL"
                        value={`${(stats.tradesHitSl / trades.length * 100).toFixed(0)}`}
                        unit="%"
                        subValue={`${stats.tradesHitSl} Trades`}
                        positive={false}
                    />
                     <StatCard 
                        label="Avg. Updraw (W)"
                        value={`${stats.avgUpdrawWinning.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={true}
                    />
                    <StatCard 
                        label="Avg. Updraw (L)"
                        value={`${stats.avgUpdrawLosing.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={true}
                    />
                    <StatCard 
                        label="Avg. Drawdown (W)"
                        value={`${stats.avgDrawdownWinning.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={false}
                    />
                    <StatCard 
                        label="Avg. Drawdown (L)"
                        value={`${stats.avgDrawdownLosing.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={false}
                    />
                    <StatCard 
                        label="Avg. Exit (W)"
                        value={`${stats.avgExitWinning.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={true}
                    />
                     <StatCard 
                        label="Avg. Exit (L)"
                        value={`${stats.avgExitLosing.toFixed(0)}`}
                        unit="pips"
                        subValue="of Risk"
                        positive={false}
                    />
                </div>
                 <PcpPcrCoach trades={trades} />
            </CardContent>
        </Card>
    )
}
