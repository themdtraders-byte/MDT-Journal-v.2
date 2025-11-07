
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import type { Trade } from '@/types';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import WinrateOverTimeCoach from './winrate-over-time-coach';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

interface WinRateOverTimeChartProps {
  trades: Trade[];
  onClick?: (data: any) => void;
  showZoomSlider?: boolean;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const tradeObject = data.tradeObject;
        const directionColor = tradeObject?.direction === 'Buy' ? 'bg-green-500' : tradeObject?.direction === 'Sell' ? 'bg-red-500' : 'bg-muted-foreground';

        return (
            <div className="rounded-md border bg-background/80 backdrop-blur-sm p-1.5 shadow-sm text-[10px] w-48">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", directionColor)} />
                        <p className="font-bold text-xs">After Trade #{label}</p>
                    </div>
                    <p className="text-muted-foreground text-[9px]">{data.tradeObject?.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" />Win Rate</div>
                    <div className="font-bold text-right text-primary">{data.winRate.toFixed(1)}%</div>
                </div>
                 {tradeObject && (
                <>
                    <hr className="border-border/50 my-1"/>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                        <div className="text-muted-foreground">Instrument</div>
                        <div className="font-bold text-right">{tradeObject.pair}</div>
                        <div className="text-muted-foreground">Risk %</div>
                        <div className="font-bold text-right">{tradeObject.auto.riskPercent.toFixed(2)}%</div>
                    </div>
                </>
             )}
            </div>
        );
    }
    return null;
};

export default function WinRateOverTimeChart({ trades, onClick, showZoomSlider = false }: WinRateOverTimeChartProps) {
    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0) return null;

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let winCount = 0;
        return sortedTrades.map((trade, index) => {
            const totalTrades = index + 1;
            if (trade.auto.outcome === 'Win') {
                winCount++;
            }
            const winRate = (winCount / totalTrades) * 100;
            
            return {
                tradeNumber: totalTrades,
                winRate: winRate || 0,
                tradeObject: trade,
            };
        });
    }, [trades]);

    if (!analysisData) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> Win Rate Over Time</CardTitle>
                    <CardDescription>At least 1 trade is needed to show win rate evolution.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough data for this chart.</p>
                </CardContent>
             </Card>
        );
    }
    
    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="text-primary"/>
                        Win Rate Over Time
                    </CardTitle>
                    <CardDescription>
                        Visualizes how your win rate has evolved with each trade, showing your consistency over time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart 
                            data={analysisData} 
                            margin={{ top: 5, right: 20, left: 0, bottom: showZoomSlider ? 20 : 5 }}
                            onClick={onClick}
                            className={onClick ? 'cursor-pointer' : ''}
                        >
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
                                yAxisId="left" tickFormatter={(v) => `${v.toFixed(0)}%`}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={50} stroke="hsl(var(--foreground))" strokeDasharray="3 3" yAxisId="left" />
                            <defs>
                                <linearGradient id="winrateGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="winRate"
                                stroke="hsl(var(--primary))"
                                fill="url(#winrateGradient)"
                                strokeWidth={1.5} 
                                dot={false} 
                                activeDot={{ r: 4 }} 
                            />
                            {showZoomSlider && <Brush dataKey="tradeNumber" height={15} stroke="hsl(var(--foreground))" y={275} />}
                    </ComposedChart>
                    </ResponsiveContainer>
                    <ScrollArea className="mt-4 max-h-60">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead>Trade #</TableHead>
                                    <TableHead>Win Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisData.map(d => (
                                    <TableRow key={d.tradeNumber}>
                                        <TableCell>{d.tradeNumber}</TableCell>
                                        <TableCell>{d.winRate.toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <WinrateOverTimeCoach winrateData={analysisData} />
        </div>
    )
}
