
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import type { Trade } from '@/types';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, Info } from 'lucide-react';
import FormattedNumber from '../ui/formatted-number';
import ExpectancyCurveCoach from './expectancy-curve-coach';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

interface ExpectancyChartProps {
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
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" />Expectancy</div>
                    <div className={cn("font-bold text-right", data.expectancy >= 0 ? "text-primary" : "text-destructive")}>
                        <FormattedNumber value={data.expectancy} />
                    </div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" />Avg. Win</div>
                    <div className="font-bold text-right text-green-500"><FormattedNumber value={data.avgWin} /></div>
                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" />Avg. Loss</div>
                    <div className="font-bold text-right text-red-500"><FormattedNumber value={data.avgLoss} /></div>
                     <div className="text-muted-foreground">Win Rate</div>
                    <div className="font-bold text-right">{data.winRate.toFixed(1)}%</div>
                    
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

export default function ExpectancyChart({ trades, onClick, showZoomSlider = false }: ExpectancyChartProps) {
    const { journals, activeJournalId } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0) return null;

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let winningTrades: Trade[] = [];
        let losingTrades: Trade[] = [];

        return sortedTrades.map((trade, index) => {
            const currentTrades = sortedTrades.slice(0, index + 1);
            if (trade.auto.pl > 0) {
                winningTrades.push(trade);
            } else if (trade.auto.pl < 0) {
                losingTrades.push(trade);
            }

            const winRate = currentTrades.length > 0 ? winningTrades.length / currentTrades.length : 0;
            const lossRate = currentTrades.length > 0 ? losingTrades.length / currentTrades.length : 0;
            
            const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.auto.pl, 0) / winningTrades.length : 0;
            const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.auto.pl, 0) / losingTrades.length) : 0;

            const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
            
            return {
                tradeNumber: index + 1,
                expectancy: expectancy || 0,
                winRate: winRate * 100,
                avgWin,
                avgLoss,
                tradeObject: trade,
            };
        });
    }, [trades]);

    if (!analysisData || analysisData.length === 0 || !activeJournal) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> Expectancy Over Time</CardTitle>
                    <CardDescription>At least 1 trade is needed to calculate expectancy.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough data for this chart.</p>
                </CardContent>
             </Card>
        );
    }
    
    const yAxisTickFormatter = (value: number) => {
      const numValue = Number(value);
      if (Math.abs(numValue) >= 10000) {
        return `$${(numValue / 1000).toFixed(0)}k`;
      }
      return `$${numValue.toFixed(0)}`;
    };
    
    const finalExpectancy = analysisData[analysisData.length - 1].expectancy;

    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="text-primary"/>
                        Expectancy Over Time
                    </CardTitle>
                    <CardDescription>
                        Shows the evolution of your expected profit per trade over time. An upward trend indicates a strengthening edge.
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
                                yAxisId="left"
                                tickFormatter={yAxisTickFormatter}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Expectancy ($)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} yAxisId="left" />
                            <defs>
                                <linearGradient id="expectancyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey="expectancy"
                                name="Expectancy"
                                stroke="hsl(var(--primary))"
                                fill="url(#expectancyGradient)"
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
                                    <TableHead>Expectancy</TableHead>
                                    <TableHead>Win Rate</TableHead>
                                    <TableHead>Avg. Win</TableHead>
                                    <TableHead>Avg. Loss</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisData.map(d => (
                                    <TableRow key={d.tradeNumber}>
                                        <TableCell>{d.tradeNumber}</TableCell>
                                        <TableCell className={cn(d.expectancy >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={d.expectancy} /></TableCell>
                                        <TableCell>{d.winRate.toFixed(1)}%</TableCell>
                                        <TableCell className="text-green-500"><FormattedNumber value={d.avgWin} /></TableCell>
                                        <TableCell className="text-red-500"><FormattedNumber value={d.avgLoss} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <ExpectancyCurveCoach journal={activeJournal} expectancyData={analysisData} />
        </div>
    )
}
