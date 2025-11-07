
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import type { Trade } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FormattedNumber from '../ui/formatted-number';
import { TrendingDown, TrendingUp } from 'lucide-react';
import ConsecutiveWinsLossesCoach from './consecutive-wins-losses-coach';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface StreakChartProps {
  trades: Trade[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const winData = payload.find(p => p.dataKey === 'avgWinPl');
        const lossData = payload.find(p => p.dataKey === 'avgLossPl');

        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-3 shadow-sm text-xs w-48">
                <p className="font-bold text-base mb-2">{label} trades streak</p>
                <div className="space-y-2">
                    {winData && winData.value !== 0 && (
                        <div>
                            <div className="flex items-center gap-2 font-semibold text-green-500">
                                <div className="w-2 h-2 rounded-full bg-green-500"/>
                                Consecutive winners
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 mt-1 pl-4">
                                <span className="text-muted-foreground">Return:</span>
                                <span className="font-semibold text-right"><FormattedNumber value={winData.value} /></span>
                                <span className="text-muted-foreground">Frequency:</span>
                                <span className="font-semibold text-right">{data.winCount}</span>
                            </div>
                        </div>
                    )}
                     {lossData && lossData.value !== 0 && (
                        <div>
                            <div className="flex items-center gap-2 font-semibold text-red-500">
                                <div className="w-2 h-2 rounded-full bg-red-500"/>
                                Consecutive losers
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 mt-1 pl-4">
                                <span className="text-muted-foreground">Return:</span>
                                <span className="font-semibold text-right"><FormattedNumber value={lossData.value} /></span>
                                <span className="text-muted-foreground">Frequency:</span>
                                <span className="font-semibold text-right">{data.lossCount}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function ConsecutiveWinsLossesChart({ trades }: StreakChartProps) {
    const { streakData } = useMemo(() => {
        if (!trades || trades.length < 2) return { streakData: [] };

        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        const streaks: {
            [length: number]: {
                wins: { totalPl: number, count: number },
                losses: { totalPl: number, count: number },
            }
        } = {};

        let currentStreak = 0;
        let currentStatus: 'Win' | 'Loss' | null = null;
        
        for (let i = 0; i < sortedTrades.length; i++) {
            const trade = sortedTrades[i];
            
            if (trade.auto.outcome === 'Win') {
                if (currentStatus === 'Win') {
                    currentStreak++;
                } else {
                    currentStatus = 'Win';
                    currentStreak = 1;
                }
            } else if (trade.auto.outcome === 'Loss') {
                if (currentStatus === 'Loss') {
                    currentStreak++;
                } else {
                    currentStatus = 'Loss';
                    currentStreak = 1;
                }
            } else {
                currentStatus = null;
                currentStreak = 0;
            }

            if (currentStreak >= 2) {
                if (!streaks[currentStreak]) {
                    streaks[currentStreak] = {
                        wins: { totalPl: 0, count: 0 },
                        losses: { totalPl: 0, count: 0 },
                    };
                }
                
                const isStreakBroken = (i + 1 < sortedTrades.length && sortedTrades[i+1].auto.outcome !== currentStatus);
                const isEndOfArray = (i === sortedTrades.length - 1);

                if (isStreakBroken || isEndOfArray) {
                    const streakTrades = sortedTrades.slice(i - currentStreak + 1, i + 1);
                    const streakTotalPl = streakTrades.reduce((sum, t) => sum + t.auto.pl, 0);

                    if (currentStatus === 'Win') {
                        streaks[currentStreak].wins.totalPl += streakTotalPl;
                        streaks[currentStreak].wins.count++;
                    } else if (currentStatus === 'Loss') {
                        streaks[currentStreak].losses.totalPl += streakTotalPl;
                        streaks[currentStreak].losses.count++;
                    }
                }
            }
        }
        
        const finalData = [];
        for (let i = 2; i <= 10; i++) {
            const data = streaks[i];
            if (data) {
                finalData.push({
                    name: String(i),
                    avgWinPl: data.wins.count > 0 ? data.wins.totalPl / data.wins.count : 0,
                    winCount: data.wins.count,
                    avgLossPl: data.losses.count > 0 ? data.losses.totalPl / data.losses.count : 0,
                    lossCount: data.losses.count
                });
            } else {
                 finalData.push({ name: String(i), avgWinPl: 0, winCount: 0, avgLossPl: 0, lossCount: 0 });
            }
        }
        
        const maxLength = Math.max(...Object.keys(streaks).map(Number), 0);
        let longStreaks = { wins: { totalPl: 0, count: 0 }, losses: { totalPl: 0, count: 0 }};
        for (let i = 11; i <= maxLength; i++) {
            if (streaks[i]) {
                longStreaks.wins.totalPl += streaks[i].wins.totalPl;
                longStreaks.wins.count += streaks[i].wins.count;
                longStreaks.losses.totalPl += streaks[i].losses.totalPl;
                longStreaks.losses.count += streaks[i].losses.count;
            }
        }
        if (longStreaks.wins.count > 0 || longStreaks.losses.count > 0) {
            finalData.push({
                name: ">10",
                avgWinPl: longStreaks.wins.count > 0 ? longStreaks.wins.totalPl / longStreaks.wins.count : 0,
                winCount: longStreaks.wins.count,
                avgLossPl: longStreaks.losses.count > 0 ? longStreaks.losses.totalPl / longStreaks.losses.count : 0,
                lossCount: longStreaks.losses.count
            });
        }


        return { streakData: finalData };

    }, [trades]);

    if (!streakData || streakData.length === 0) {
        return (
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Streaks Analysis</CardTitle>
                    <CardDescription>Analyze the performance of consecutive wins and losses.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>Not enough consecutive trades to analyze streaks.</p>
                </CardContent>
            </Card>
        );
    }

    return (
         <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp /> Streaks Analysis</CardTitle>
                    <CardDescription>Visualize the average return and frequency of your winning and losing streaks to understand their statistical impact.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={streakData} stackOffset="sign" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} label={{ value: 'Consecutive winners/losers', position: 'insideBottom', offset: -5 }}/>
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} label={{ value: 'Average Return ($)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}/>
                            <ReferenceLine y={0} stroke="hsl(var(--foreground))" strokeWidth={1} />
                            <Bar dataKey="avgWinPl" name="Avg. Win Return" fill="#22C55E" stackId="stack" />
                            <Bar dataKey="avgLossPl" name="Avg. Loss Return" fill="#EF4444" stackId="stack" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Streak Length</TableHead>
                                    <TableHead>Win Count</TableHead>
                                    <TableHead>Avg. Win P/L</TableHead>
                                    <TableHead>Loss Count</TableHead>
                                    <TableHead>Avg. Loss P/L</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {streakData.map(d => (
                                    <TableRow key={d.name}>
                                        <TableCell>{d.name}</TableCell>
                                        <TableCell>{d.winCount}</TableCell>
                                        <TableCell className="text-green-500"><FormattedNumber value={d.avgWinPl} /></TableCell>
                                        <TableCell>{d.lossCount}</TableCell>
                                        <TableCell className="text-red-500"><FormattedNumber value={d.avgLossPl} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <ConsecutiveWinsLossesCoach trades={trades} />
        </div>
    );
}
