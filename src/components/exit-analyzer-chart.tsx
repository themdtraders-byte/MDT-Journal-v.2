'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell, Brush } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { BarChartHorizontal, Info } from 'lucide-react';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExitAnalyzerChartProps {
  trades: Trade[];
  onClick?: (data: any) => void;
  showZoomSlider?: boolean;
  brushY?: number;
}

const StatCard = ({ title, value, unit, tooltip }: { title: string; value: string; unit?: string; tooltip: string }) => (
  <TooltipProvider>
    <UiTooltip>
      <TooltipTrigger asChild>
        <div className="flex-1 rounded-lg p-3 text-center glassmorphic">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            {title}
            <Info className="h-3 w-3" />
          </p>
          <p className="text-xl font-bold font-mono">
            {value}<span className="text-sm font-sans">{unit}</span>
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent><p>{tooltip}</p></TooltipContent>
    </UiTooltip>
  </TooltipProvider>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload.find(p => p.dataKey === 'range')?.payload;
        if (!data) return null;

        const rMultiple = data.pl_percent / 100;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-48">
                <p className="font-bold mb-1">Trade #{label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" />Updraw</div>
                    <div className="font-bold text-right text-green-500">{data.updraw.toFixed(2)}%</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" />Drawdown</div>
                    <div className="font-bold text-right text-red-500">{data.drawdown.toFixed(2)}%</div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-foreground" />P/L</div>
                    <div className={cn("font-bold text-right", data.pl_percent >= 0 ? 'text-green-500' : 'text-red-500')}>{data.pl_percent.toFixed(2)}%</div>
                     <div className="text-muted-foreground">R-Multiple</div>
                    <div className={cn("font-bold text-right", rMultiple >= 0 ? 'text-green-500' : 'text-red-500')}>{rMultiple.toFixed(2)}R</div>
                </div>
            </div>
        );
    }
    return null;
};

export default function ExitAnalyzerChart({ trades, onClick, showZoomSlider = false, brushY = 275 }: ExitAnalyzerChartProps) {
    const { appSettings } = useJournalStore();

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

            const pl_percent = (plPips / riskPips) * 100;
            const updraw = (mfePips / riskPips) * 100;
            const drawdown = -(maePips / riskPips) * 100;

            return {
                name: String(index + 1),
                pl_percent,
                updraw,
                drawdown,
                range: [drawdown, updraw],
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
                <CardTitle className="flex items-center gap-2">
                    <BarChartHorizontal className="text-primary"/>
                    Exit Analysis
                </CardTitle>
                <CardDescription>Visualize the exits of your trades and optimize stop loss and target placement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                   <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: showZoomSlider ? 20 : 5 }} onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                        <XAxis dataKey="name" type="category" tick={{ fontSize: 10 }} label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} dy={10}/>
                        <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} label={{ value: 'Updraw / Drawdown', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip content={<CustomTooltip />} />
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard 
                        title="Avg Updraw Winning"
                        value={`${stats.avgUpdrawWinning.toFixed(0)}`}
                        unit="%"
                        tooltip="Average maximum potential profit on winning trades."
                    />
                     <StatCard 
                        title="Avg Updraw Losing"
                        value={`${stats.avgUpdrawLosing.toFixed(0)}`}
                        unit="%"
                        tooltip="Average maximum potential profit on losing trades."
                    />
                     <StatCard 
                        title="Avg Drawdown Winning"
                        value={`${stats.avgDrawdownWinning.toFixed(0)}`}
                        unit="%"
                        tooltip="Average maximum drawdown on winning trades."
                    />
                     <StatCard 
                        title="Avg Drawdown Losing"
                        value={`${stats.avgDrawdownLosing.toFixed(0)}`}
                        unit="%"
                        tooltip="Average maximum drawdown on losing trades."
                    />
                    <StatCard 
                        title="Avg Exit Winning"
                        value={`${stats.avgExitWinning.toFixed(0)}`}
                        unit="%"
                        tooltip="Average realized profit on winning trades."
                    />
                    <StatCard 
                        title="Avg Exit Losing"
                        value={`${stats.avgExitLosing.toFixed(0)}`}
                        unit="%"
                        tooltip="Average realized loss on losing trades."
                    />
                </div>
            </CardContent>
        </Card>
    )
}
