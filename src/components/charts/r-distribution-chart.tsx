
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, Cell, ReferenceLine } from 'recharts';
import type { Trade } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import FormattedNumber from '../ui/formatted-number';
import RDistributionCoach from './r-distribution-coach';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface RDistributionChartProps {
  trades: Trade[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-40">
                <p className="font-bold mb-1">R-Multiple: {label}</p>
                <div className="grid grid-cols-2 gap-x-2">
                    <span className="text-muted-foreground">Trades:</span>
                    <span className="font-semibold text-right">{data.count}</span>
                    <span className="text-muted-foreground">Total P/L:</span>
                    <span className={cn("font-semibold text-right", data.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>
                        <FormattedNumber value={data.totalPl} />
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function RDistributionChart({ trades }: RDistributionChartProps) {
    const { appSettings } = useJournalStore();

    const analysisData = useMemo(() => {
        if (!trades || trades.length === 0 || !appSettings) return null;

        const tradesWithR = trades.map(trade => {
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            if (!trade.stopLoss || trade.stopLoss === 0) return { ...trade, realizedR: 0 };
            const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
            return { ...trade, realizedR };
        });

        const rBuckets: Record<string, { trades: Trade[], totalPl: number, count: number }> = {};
        const maxR = 10;
        const minR = -5;

        for (let i = minR; i <= maxR; i++) {
            const bucketName = `${i}R`;
            rBuckets[bucketName] = { trades: [], totalPl: 0, count: 0 };
        }
        rBuckets[`< ${minR}R`] = { trades: [], totalPl: 0, count: 0 };
        rBuckets[`> ${maxR}R`] = { trades: [], totalPl: 0, count: 0 };

        tradesWithR.forEach(trade => {
            const r = trade.realizedR;
            const roundedR = Math.round(r);

            let bucketName = `${roundedR}R`;
            if (r < minR) bucketName = `< ${minR}R`;
            else if (r > maxR) bucketName = `> ${maxR}R`;
            
            if(rBuckets[bucketName]) {
                rBuckets[bucketName].trades.push(trade);
                rBuckets[bucketName].totalPl += trade.auto.pl;
                rBuckets[bucketName].count++;
            }
        });
        
        const sortedKeys = Object.keys(rBuckets).sort((a, b) => {
            if (a.startsWith('<')) return -1;
            if (a.startsWith('>')) return 1;
            if (b.startsWith('<')) return 1;
            if (b.startsWith('>')) return -1;
            return parseInt(a, 10) - parseInt(b, 10);
        });

        return sortedKeys.map(key => ({
            name: key,
            count: rBuckets[key].count,
            totalPl: rBuckets[key].totalPl,
        }));

    }, [trades, appSettings]);

    if (!analysisData) {
        return (
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> R-Multiple Distribution</CardTitle>
                    <CardDescription>Not enough data to create R-Distribution chart.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>At least one trade with a valid stop loss is required.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> R-Multiple Distribution</CardTitle>
                    <CardDescription>A histogram showing the frequency of your trades based on their realized R-Multiple.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analysisData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'R-Multiple', position: 'insideBottom', offset: -5 }} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                axisLine={{ stroke: 'hsl(var(--border))' }}
                                tickLine={{ stroke: 'hsl(var(--border))' }}
                                label={{ value: 'Number of Trades', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }} />
                            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                            <Bar dataKey="count">
                                {analysisData.map((entry, index) => {
                                    const rValue = parseInt(entry.name, 10);
                                    const isNegative = entry.name.startsWith('<') || rValue < 0;
                                    return <Cell key={`cell-${index}`} fill={isNegative ? '#EF4444' : '#22C55E'} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead>R-Multiple</TableHead>
                                    <TableHead>Trade Count</TableHead>
                                    <TableHead>Total P/L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analysisData.map(d => d.count > 0 && (
                                    <TableRow key={d.name}>
                                        <TableCell>{d.name}</TableCell>
                                        <TableCell>{d.count}</TableCell>
                                        <TableCell className={cn(d.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={d.totalPl} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <RDistributionCoach trades={trades} r_data={analysisData} />
        </div>
    );
}
