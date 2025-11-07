
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell, Brush } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { BarChartHorizontal, Info } from 'lucide-react';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import StatCard from '../ui/stat-card';

type DisplayMode = 'percentage' | 'rMultiple';

interface ExitAnalyzerChartProps {
  trades: Trade[];
  onClick?: (data: any) => void;
  showZoomSlider?: boolean;
  brushY?: number;
}

const CustomTooltip = ({ active, payload, label, displayMode }: { active?: boolean; payload?: any[]; label?: string, displayMode: DisplayMode }) => {
    if (active && payload && payload.length) {
        const data = payload.find(p => p.dataKey === 'range')?.payload;
        if (!data) return null;

        const isPercentage = displayMode === 'percentage';
        const suffix = isPercentage ? '%' : 'R';
        const plValue = isPercentage ? data.pl_percent : data.pl_r;
        const updrawValue = isPercentage ? data.updraw : data.updraw_r;
        const drawdownValue = isPercentage ? data.drawdown : data.drawdown_r;

        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-48">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-bold">Trade #{label}</p>
                    <p className="text-muted-foreground">{data.tradeObject?.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" />Updraw</div>
                    <div className="font-bold text-right text-green-500">{updrawValue.toFixed(2)}{suffix}</div>
                    
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" />Drawdown</div>
                    <div className="font-bold text-right text-red-500">{drawdownValue.toFixed(2)}{suffix}</div>
                     
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-foreground" />Final P/L</div>
                    <div className={cn("font-bold text-right", plValue >= 0 ? 'text-green-500' : 'text-red-500')}>{plValue.toFixed(2)}{suffix}</div>
                </div>
            </div>
        );
    }
    return null;
};

export default function ExitAnalyzerChart({ trades, onClick, showZoomSlider = false, brushY = 275 }: ExitAnalyzerChartProps) {
    const { appSettings } = useJournalStore();
    const [displayMode, setDisplayMode] = useState<DisplayMode>('rMultiple');

    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0 || !appSettings) return null;

        const chartData = trades.map((trade, index) => {
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            if(!trade.stopLoss || trade.stopLoss === 0) return null;
            const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
            if (riskPips === 0) return null;

            const plPips = trade.auto.pips;
            
            const mfePips = trade.auto.mfe || 0;
            const maePips = trade.auto.mae || 0;

            // R-Multiple values
            const pl_r = plPips / riskPips;
            const updraw_r = mfePips / riskPips;
            const drawdown_r = -(maePips / riskPips);

            // Percentage values
            const pl_percent = (plPips / riskPips) * 100;
            const updraw = (mfePips / riskPips) * 100;
            const drawdown = -(maePips / riskPips) * 100;

            return {
                name: String(index + 1),
                pl_percent,
                updraw,
                drawdown,
                range: [drawdown, updraw],
                pl_r,
                updraw_r,
                drawdown_r,
                tradeObject: trade,
            };
        }).filter(Boolean);

        if (chartData.length === 0) return null;

        const winningTrades = chartData.filter(d => d!.pl_percent >= 0);
        const losingTrades = chartData.filter(d => d!.pl_percent < 0);
        
        const avgUpdrawWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + d!.updraw, 0) / winningTrades.length : 0;
        const avgExitWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + d!.pl_percent, 0) / winningTrades.length : 0;
        const avgDrawdownWinning = winningTrades.length > 0 ? winningTrades.reduce((sum, d) => sum + d!.drawdown, 0) / winningTrades.length : 0;
        
        const avgUpdrawLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + d!.updraw, 0) / losingTrades.length : 0;
        const avgExitLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + d!.pl_percent, 0) / losingTrades.length : 0;
        const avgDrawdownLosing = losingTrades.length > 0 ? losingTrades.reduce((sum, d) => sum + d!.drawdown, 0) / losingTrades.length : 0;


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

    }, [trades, appSettings]);

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
                    <p>Not enough data for exit analysis.</p>
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
                        <Label className="text-xs">Display</Label>
                        <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as DisplayMode)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rMultiple">R-Multiple</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
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
                        <YAxis tickFormatter={(v) => displayMode === 'percentage' ? `${v}%` : v} tick={{ fontSize: 10 }} label={{ value: displayMode === 'percentage' ? 'Updraw / Drawdown (% of Risk)' : 'Updraw / Drawdown (R-Multiple)', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip content={<CustomTooltip displayMode={displayMode} />} />
                        <Legend iconType="square" height={36} />

                        <ReferenceLine y={100} label={{ value: "TP 100%", position: 'insideTopRight' }} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
                        <ReferenceLine y={-100} label={{ value: "SL -100%", position: 'insideBottomRight' }} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                        <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                        
                         <Bar dataKey="range" barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.updraw > Math.abs(entry.drawdown) ? 'hsl(142 71% 45% / 0.8)' : 'hsl(0 84% 60% / 0.8)'} />
                            ))}
                        </Bar>
                         <Line 
                            type="monotone" 
                            dataKey="pl_percent" 
                            strokeWidth={0} 
                            activeDot={false}
                            dot={{ stroke: '#1c1917', strokeWidth: 1, r: 3, fill: '#fafaf9' }}
                            name="Final P/L"
                        />
                        {showZoomSlider && <Brush dataKey="name" height={5} stroke="hsl(var(--foreground))" y={brushY} />}
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
                        unit="%"
                        subValue="of Risk"
                        positive={true}
                    />
                    <StatCard 
                        label="Avg. Updraw (L)"
                        value={`${stats.avgUpdrawLosing.toFixed(0)}`}
                        unit="%"
                        subValue="of Risk"
                        positive={true}
                    />
                    <StatCard 
                        label="Avg. Drawdown (W)"
                        value={`${stats.avgDrawdownWinning.toFixed(0)}`}
                        unit="%"
                        subValue="of Risk"
                        positive={false}
                    />
                    <StatCard 
                        label="Avg. Drawdown (L)"
                        value={`${stats.avgDrawdownLosing.toFixed(0)}`}
                        unit="%"
                        subValue="of Risk"
                        positive={false}
                    />
                    <StatCard 
                        label="Avg. Exit (W)"
                        value={`${stats.avgExitWinning.toFixed(0)}`}
                        unit="%"
                        subValue="of Risk"
                        positive={true}
                    />
                     <StatCard 
                        label="Avg. Exit (L)"
                        value={`${stats.avgExitLosing.toFixed(0)}`}
                        unit="%"
                        subValue="of Risk"
                        positive={false}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
