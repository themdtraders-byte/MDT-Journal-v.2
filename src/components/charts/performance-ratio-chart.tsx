
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import type { Trade, Journal } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Target, Info } from 'lucide-react';
import FormattedNumber from '../ui/formatted-number';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PerformanceRatioCoach from './performance-ratio-coach';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';

type RatioType = 'sharpe' | 'sortino' | 'profitFactor' | 'calmar' | 'sqn';

const ratioDescriptions: Record<RatioType, string> = {
    sharpe: "Measures your average return relative to your strategy's volatility. A higher Sharpe Ratio is better. A value > 1 is considered good.",
    sortino: "Similar to Sharpe, but only considers downside volatility (your losses). It better measures return against 'bad' risk. A high Sortino Ratio (> 2) is excellent.",
    profitFactor: "The ratio of your gross profits to your gross losses. A value above 1 indicates profitability. For every $1 lost, this is how much you made.",
    calmar: "Measures your strategy's return against its maximum drawdown. A high Calmar Ratio (> 3) means you're getting a great return for the risk you've endured.",
    sqn: "System Quality Number. A holistic score combining expectancy, trade count, and consistency. A score > 2.5 is considered a high-quality trading system.",
};


interface PerformanceRatioChartProps {
  trades: Trade[];
}

const CustomTooltip = ({ active, payload, label, ratioType }: { active?: boolean; payload?: any[]; label?: string; ratioType: RatioType }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-48">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-bold">After Trade #{label}</p>
                    <p className="text-muted-foreground">{data.tradeObject?.openDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" />{ratioType.toUpperCase()} Ratio</div>
                    <div className={cn("font-bold text-right", data.value >= 1 ? "text-primary" : "text-destructive")}>
                        {data.value.toFixed(2)}
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function PerformanceRatioChart({ trades }: PerformanceRatioChartProps) {
    const { journals, activeJournalId } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const [ratioType, setRatioType] = useState<RatioType>('sharpe');

    const analysisData = useMemo(() => {
        if (!trades || trades.length < 2 || !activeJournal) return null;

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let peakBalance = activeJournal.initialDeposit;
        let maxDrawdown = 0;

        return sortedTrades.map((trade, index) => {
            const currentTrades = sortedTrades.slice(0, index + 1);
            const returns = currentTrades.map(t => t.auto.pl);
            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            
            // Standard Deviation for Sharpe
            const stdDev = Math.sqrt(returns.map(x => Math.pow(x - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
            
            // Downside Deviation for Sortino
            const negativeReturns = returns.filter(r => r < 0);
            const downsideDeviation = Math.sqrt(negativeReturns.map(x => Math.pow(x, 2)).reduce((a, b) => a + b, 0) / currentTrades.length);

            // Profit Factor
            const grossProfit = returns.filter(r => r > 0).reduce((a, b) => a + b, 0);
            const grossLoss = Math.abs(returns.filter(r => r < 0).reduce((a, b) => a + b, 0));
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);

            // Max Drawdown for Calmar
            const currentBalance = activeJournal.initialDeposit + returns.reduce((a, b) => a + b, 0);
            peakBalance = Math.max(peakBalance, currentBalance);
            maxDrawdown = Math.max(maxDrawdown, peakBalance - currentBalance);
            
            // Calmar Ratio
            const totalPl = currentBalance - activeJournal.initialDeposit;
            const calmarRatio = maxDrawdown > 0 ? totalPl / maxDrawdown : 0;
            
            // System Quality Number (SQN)
            const expectancy = meanReturn;
            const sqn = stdDev > 0 ? (expectancy / stdDev) * Math.sqrt(currentTrades.length) : 0;

            const sharpe = stdDev > 0 ? meanReturn / stdDev : 0;
            const sortino = downsideDeviation > 0 ? meanReturn / downsideDeviation : 0;
            
            let value = 0;
            switch(ratioType) {
                case 'sharpe': value = sharpe; break;
                case 'sortino': value = sortino; break;
                case 'profitFactor': value = profitFactor; break;
                case 'calmar': value = calmarRatio; break;
                case 'sqn': value = sqn; break;
            }

            return {
                tradeNumber: index + 1,
                value: isFinite(value) ? value : 0,
                tradeObject: trade,
            };
        });

    }, [trades, activeJournal, ratioType]);

    if (!analysisData || !activeJournal) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> Performance Ratios</CardTitle>
                    <CardDescription>At least 2 trades are needed for meaningful ratio analysis.</CardDescription>
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
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Target className="text-primary"/>
                            Performance Ratios
                        </CardTitle>
                        <Select value={ratioType} onValueChange={(v) => setRatioType(v as RatioType)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                                <SelectItem value="sortino">Sortino Ratio</SelectItem>
                                <SelectItem value="profitFactor">Profit Factor</SelectItem>
                                <SelectItem value="calmar">Calmar Ratio</SelectItem>
                                <SelectItem value="sqn">System Quality Number (SQN)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <CardDescription>
                    {ratioDescriptions[ratioType]}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={analysisData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis 
                                dataKey="tradeNumber" type="number" domain={['dataMin', 'dataMax']}
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Trades', position: 'insideBottom', offset: -5 }} 
                                dy={10}
                            />
                            <YAxis 
                                yAxisId="left"
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: `${ratioType.toUpperCase()} Ratio`, angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip ratioType={ratioType} />} />
                            <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeDasharray="3 3" yAxisId="left" />
                            <defs>
                                <linearGradient id="ratioGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area 
                                yAxisId="left" type="monotone" dataKey="value"
                                stroke="hsl(var(--primary))" fill="url(#ratioGradient)"
                                strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} 
                            />
                    </ComposedChart>
                    </ResponsiveContainer>
                    <ScrollArea className="mt-4 max-h-60">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead>Trade #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Pair</TableHead>
                                    <TableHead>{ratioType.toUpperCase()}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisData.map(d => (
                                    <TableRow key={d.tradeNumber}>
                                        <TableCell>{d.tradeNumber}</TableCell>
                                        <TableCell>{d.tradeObject.openDate}</TableCell>
                                        <TableCell>{d.tradeObject.pair}</TableCell>
                                        <TableCell className={cn(d.value >= 1 ? 'text-green-500' : 'text-red-500')}>{d.value.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
            <PerformanceRatioCoach journal={activeJournal} ratioData={analysisData} selectedRatio={ratioType} />
        </div>
    )
}
