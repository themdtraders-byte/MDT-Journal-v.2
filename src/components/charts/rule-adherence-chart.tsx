
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { Trade, TradingPlanData } from '@/types';
import { cn } from '@/lib/utils';
import FormattedNumber from '../ui/formatted-number';
import { IconShieldCheck } from '@/components/icons';
import RuleAdherenceCoach from './rule-adherence-coach';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { startOfWeek, startOfMonth, format } from 'date-fns';

interface RuleAdherenceChartProps {
  trades: Trade[];
  plan: TradingPlanData;
  capital: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs w-48">
                <p className="font-bold mb-1">{label}</p>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Compliance:</span>
                    <span className="font-semibold text-right">{data.value.toFixed(1)}%</span>
                </div>
            </div>
        );
    }
    return null;
};

export default function RuleAdherenceChart({ trades, plan, capital }: RuleAdherenceChartProps) {
    const adherenceData = useMemo(() => {
    if (!plan || !trades) { // Definitive guard clause
      return [];
    }

    const realTrades = trades.filter(t => !t.isMissing);
    if (realTrades.length === 0) return [];
    const totalTrades = realTrades.length;

    const timeToMinutes = (time: string) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    // --- Time, Pair, Risk per trade ---
    const riskCompliantTrades = realTrades.filter(t => !t.isMissing && t.auto && t.auto.riskPercent <= plan.riskPerTrade).length;
    const instrumentCompliantTrades = realTrades.filter(t => plan.instruments.includes(t.pair)).length;
    const rrCompliantTrades = realTrades.filter(t => t.auto.rr >= plan.minRiskToReward).length;

    const timeCompliantTrades = realTrades.filter(t => {
        if (!t.openTime) return true; // Cannot determine compliance without time
        const tradeTimeInMinutes = timeToMinutes(t.openTime);
        const activeHours = plan.activeHours || [];
        const noTradeZones = plan.noTradeZones || [];

        const isInActiveHours = activeHours.length === 0 || activeHours.some(zone => {
            const startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return tradeTimeInMinutes >= startMins || tradeTimeInMinutes <= endMins;
            return tradeTimeInMinutes >= startMins && tradeTimeInMinutes <= endMins;
        });

        if (!isInActiveHours) return false;
        
        const isInNoTradeZone = noTradeZones.some(zone => {
            const startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return tradeTimeInMinutes >= startMins || tradeTimeInMinutes <= endMins;
            return tradeTimeInMinutes >= startMins && tradeTimeInMinutes <= endMins;
        });

        if(isInNoTradeZone) return false;

        return true;
    }).length;

    // --- Group trades by periods ---
    const tradesByDay: { [key: string]: { pl: number, count: number } } = {};
    const tradesByWeek: { [key: string]: { pl: number } } = {};
    const tradesByMonth: { [key: string]: { pl: number } } = {};
    realTrades.forEach(t => {
        if (t.openDate) {
            const date = new Date(t.openDate + "T00:00:00");
            const dayKey = format(date, 'yyyy-MM-dd');
            const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const monthKey = format(startOfMonth(date), 'yyyy-MM');

            tradesByDay[dayKey] = tradesByDay[dayKey] || { pl: 0, count: 0 };
            tradesByDay[dayKey].pl += t.auto.pl;
            tradesByDay[dayKey].count++;
            
            tradesByWeek[weekKey] = tradesByWeek[weekKey] || { pl: 0 };
            tradesByWeek[weekKey].pl += t.auto.pl;

            tradesByMonth[monthKey] = tradesByMonth[monthKey] || { pl: 0 };
            tradesByMonth[monthKey].pl += t.auto.pl;
        }
    });

    const totalDaysTraded = Object.keys(tradesByDay).length;
    const totalWeeksTraded = Object.keys(tradesByWeek).length;
    const totalMonthsTraded = Object.keys(tradesByMonth).length;

    // --- Daily/Weekly/Monthly Limits Adherence ---
    const dailyTradeLimitCompliantDays = Object.values(tradesByDay).filter(d => plan.maxTradesPerDay > 0 && d.count <= plan.maxTradesPerDay).length;
    const dailyLossLimitCompliantDays = Object.values(tradesByDay).filter(d => plan.dailyLossLimit > 0 && -d.pl <= (plan.dailyLossLimit / 100 * capital)).length;
    const weeklyLossLimitCompliantWeeks = Object.values(tradesByWeek).filter(w => plan.weeklyLossLimit > 0 && -w.pl <= (plan.weeklyLossLimit / 100 * capital)).length;
    const monthlyLossLimitCompliantMonths = Object.values(tradesByMonth).filter(m => plan.monthlyLossLimit > 0 && -m.pl <= (plan.monthlyLossLimit / 100 * capital)).length;

    return [
        { name: 'Risk/Trade', value: (riskCompliantTrades / totalTrades) * 100 },
        { name: 'Time Rules', value: (timeCompliantTrades / totalTrades) * 100 },
        { name: 'Instruments', value: (instrumentCompliantTrades / totalTrades) * 100 },
        { name: 'Min R:R', value: (rrCompliantTrades / totalTrades) * 100 },
        { name: 'Max Trades/Day', value: totalDaysTraded > 0 ? (dailyTradeLimitCompliantDays / totalDaysTraded) * 100 : 100 },
        { name: 'Daily Loss Limit', value: totalDaysTraded > 0 ? (dailyLossLimitCompliantDays / totalDaysTraded) * 100 : 100 },
        { name: 'Weekly Loss Limit', value: totalWeeksTraded > 0 ? (weeklyLossLimitCompliantWeeks / totalWeeksTraded) * 100 : 100 },
        { name: 'Monthly Loss Limit', value: totalMonthsTraded > 0 ? (monthlyLossLimitCompliantMonths / totalMonthsTraded) * 100 : 100 },
    ];
  }, [trades, plan, capital]);

    if(adherenceData.length === 0) {
        return (
             <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><IconShieldCheck className="text-primary"/> Plan Adherence</CardTitle>
                </CardHeader>
                <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>No trades to analyze for adherence.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><IconShieldCheck className="text-primary"/> Plan Adherence</CardTitle>
                <CardDescription>
                    Measures how consistently you follow the core rules of your trading plan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={adherenceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={{ stroke: 'hsl(var(--border))' }}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}/>
                        <Bar dataKey="value" barSize={40}>
                            {adherenceData.map((entry, index) => {
                                const color = entry.value >= 80 ? '#22C55E' : entry.value >= 60 ? '#FBBF24' : '#EF4444';
                                return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                 <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rule</TableHead>
                                <TableHead className="text-right">Adherence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {adherenceData.map(d => (
                                <TableRow key={d.name}>
                                    <TableCell>{d.name}</TableCell>
                                    <TableCell className="text-right">{d.value.toFixed(1)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        <RuleAdherenceCoach adherenceData={adherenceData} />
        </div>
    );
}
