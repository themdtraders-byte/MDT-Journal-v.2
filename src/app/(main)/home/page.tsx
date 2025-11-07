

'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import { cn, formatNumber } from '@/lib/utils';
import type { Journal, Trade } from '@/types';
import { calculateGroupMetrics } from '@/lib/analytics';

// UI Components
import StatCard from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FormattedNumber from '@/components/ui/formatted-number';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Custom Components
import PairIcon from '@/components/PairIcon';
import MiniCalendar from '@/components/mini-calendar';
import { LoadingLogo } from '@/components/LoadingLogo';
import MdScoreCard from '@/components/md-score-card';

// Icons
import { TrendingUp, TrendingDown, Minus, AlertCircle, GitCommitVertical, Clock, DollarSign, Activity, BarChart, Trophy, Brain, Target, ShieldCheck } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, format, startOfMonth, endOfMonth, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { getStatusIcon, getResultBadgeVariant } from '@/lib/trade-helpers';
import MicroEquityChart from '@/components/home/micro-equity-chart';
import { calculateMdScore } from '@/lib/calculations';

const FormattedValue = ({ value, isMonetary = false, suffix = '' }: { value: string | number, isMonetary?: boolean, suffix?: string }) => {
    if (isMonetary) {
        return <FormattedNumber value={Number(value)} />;
    }
    
    let displayValue = String(value);
    const isPercentage = displayValue.endsWith('%');
    if (isPercentage) {
        displayValue = displayValue.slice(0, -1);
        suffix = '%';
    }

    const numValue = parseFloat(displayValue);
    if (isNaN(numValue)) {
        return <div className="font-mono text-sm">{value}{suffix}</div>;
    }

    const parts = displayValue.split('.');
    if (parts.length === 2) {
        return (
            <div className="font-mono text-sm">
                <div>{parts[0]}</div>
                <div className="opacity-50 text-[0.7em]">.{parts[1]}</div>
                {suffix}
            </div>
        );
    }
    
    return <div className="font-mono text-sm">{value}{suffix}</div>;
}

const PerformanceSummaryCard = ({ trades, best, worst }: { trades: Trade[]; best: Trade | null; worst: Trade | null; }) => {
    const calculateStats = (filteredTrades: Trade[]) => {
        if (!filteredTrades || filteredTrades.length === 0) {
            return { totalPl: 0, winRate: 0, totalTrades: 0, profitFactor: 0 };
        }
        const totalTrades = filteredTrades.length;
        const wins = filteredTrades.filter(t => t.auto.outcome === 'Win');
        const grossProfit = wins.reduce((sum, t) => sum + t.auto.pl, 0);
        const grossLoss = Math.abs(filteredTrades.filter(t => t.auto.outcome === 'Loss').reduce((sum, t) => sum + t.auto.pl, 0));
        const totalPl = grossProfit - grossLoss;
        return {
            totalPl,
            winRate: totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0,
            profitFactor: grossLoss > 0 ? grossProfit / grossLoss : Infinity,
            totalTrades,
        };
    };

    const stats = useMemo(() => {
        if (!trades || trades.length === 0) {
            const emptyStats = { totalPl: 0, winRate: 0, totalTrades: 0, profitFactor: 0 };
            return { today: emptyStats, week: emptyStats, month: emptyStats };
        }
        const now = new Date();
        const todayTrades = trades.filter(t => t.openDate === format(now, 'yyyy-MM-dd'));
        const weekTrades = trades.filter(t => isWithinInterval(new Date(t.openDate), { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }));
        const monthTrades = trades.filter(t => isWithinInterval(new Date(t.openDate), { start: startOfMonth(now), end: endOfMonth(now) }));

        return {
            today: calculateStats(todayTrades),
            week: calculateStats(weekTrades),
            month: calculateStats(monthTrades),
        };
    }, [trades]);

    const PerformanceTab = ({ title, data }: { title: string, data: ReturnType<typeof calculateStats> }) => (
        <TabsContent value={title.toLowerCase()} className="mt-0">
            <div className="flex-grow flex flex-col justify-center items-center gap-1 text-center">
                <div className={cn("text-xl font-bold", data.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>
                    <FormattedNumber value={data.totalPl} />
                </div>
                <div className="grid grid-cols-3 gap-1 w-full text-[9px]">
                    <div className="p-1 bg-muted/50 rounded-md">
                        <div className="text-muted-foreground text-[8px] uppercase">Trades</div>
                        <div className="font-bold text-xs">{data.totalTrades}</div>
                    </div>
                    <div className="p-1 bg-muted/50 rounded-md">
                        <div className="text-muted-foreground text-[8px] uppercase">Win Rate</div>
                        <div className="font-bold text-xs"><FormattedValue value={`${data.winRate.toFixed(1)}%`} /></div>
                    </div>
                    <div className="p-1 bg-muted/50 rounded-md">
                        <div className="text-muted-foreground text-[8px] uppercase">P.F.</div>
                        <div className="font-bold text-xs">{isFinite(data.profitFactor) ? data.profitFactor.toFixed(2) : '∞'}</div>
                    </div>
                </div>
            </div>
        </TabsContent>
    );

    const topTrades = [
        best && { ...best, type: 'Best' as const },
        worst && { ...worst, type: 'Worst' as const }
    ].filter(Boolean);


    return (
        <Card className="glassmorphic interactive-card flex flex-col h-full">
            <CardHeader className="p-2">
                <CardTitle className="text-sm">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-1 flex-1 flex flex-col">
                <Tabs defaultValue="today" className="w-full flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 h-6">
                        <TabsTrigger value="today" className="text-[10px] px-1 h-5">Today</TabsTrigger>
                        <TabsTrigger value="week" className="text-[10px] px-1 h-5">This Week</TabsTrigger>
                        <TabsTrigger value="month" className="text-[10px] px-1 h-5">This Month</TabsTrigger>
                    </TabsList>
                    <div className="pt-2 flex-1">
                        <PerformanceTab title="Today" data={stats.today} />
                        <PerformanceTab title="Week" data={stats.week} />
                        <PerformanceTab title="Month" data={stats.month} />
                    </div>
                </Tabs>
                {topTrades.length > 0 && (
                     <Card className="glassmorphic mt-2">
                        <CardHeader className="p-2"><CardTitle className="text-xs text-center">Top Trades</CardTitle></CardHeader>
                        <CardContent className="p-1">
                            <Table>
                                <TableBody>
                                    {topTrades.map((trade, index) => trade && (
                                        <TableRow key={trade.type} className="border-none">
                                            <TableCell className="p-1">
                                                <Badge variant={trade.type === 'Best' ? 'default' : 'destructive'} className={cn("text-[9px] h-auto", trade.type === 'Best' && 'bg-green-500/20 text-green-500')}>{trade.type}</Badge>
                                            </TableCell>
                                            <TableCell className="p-1"><div className="flex items-center gap-1"><PairIcon pair={trade.pair} className="h-4 w-4" /><span className="text-[10px]">{trade.pair}</span></div></TableCell>
                                            <TableCell className={cn('font-semibold text-[10px] p-1', trade.auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={trade.auto.pl} showPercentage /></TableCell>
                                            <TableCell className="p-1 text-[10px]">{trade.auto.rr.toFixed(1)}R</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
};


const AnalyticsCard = ({ title, icon: Icon, children, className }: { title: string; icon: React.ElementType; children: React.ReactNode, className?: string }) => (
  <Card className={cn("glassmorphic interactive-card group h-full flex flex-col", className)}>
    <CardHeader className="pb-2 p-2">
      <CardTitle className="text-xs flex items-center gap-2">
        <Icon className="text-primary h-3 w-3 transition-transform duration-300 group-hover:scale-125"/>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-2 flex-1">
        {children}
    </CardContent>
  </Card>
);

const DetailRow = ({ label, value, valueClassName, isMonetary, isString }: { label: string; value: number | string; valueClassName?: string, isMonetary?: boolean, isString?: boolean }) => (
    <div className="flex justify-between items-center py-0.5 border-b border-border/50 text-[10px] last:border-b-0">
        <div className="text-muted-foreground">{label}</div>
        <div className={cn("font-semibold", valueClassName)}>
            {isString ? value : <FormattedValue value={value} isMonetary={isMonetary} />}
        </div>
    </div>
);

const FinancialSummaryCard = ({ trades, appSettings, capital }: { trades: Trade[], appSettings: any, capital: number }) => {
    const summary = useMemo(() => {
        if (!appSettings) return null;
        const metrics = calculateGroupMetrics(trades, appSettings, capital);
        const totalSpread = trades.reduce((sum, t) => sum + (t.auto.spreadCost || 0), 0);
        const totalCommission = trades.reduce((sum, t) => sum + (t.auto.commissionCost || 0), 0);
        const wins = trades.filter(t=>t.auto.outcome === 'Win');
        const losses = trades.filter(t=>t.auto.outcome === 'Loss');
        return {
            grossProfit: metrics.profit,
            grossLoss: metrics.loss,
            winCount: wins.length,
            lossCount: losses.length,
            winRate: metrics.winRate,
            lossRate: 100 - metrics.winRate,
            avgPl: metrics.avgPl,
            totalSpread,
            totalCommission,
            avgWin: wins.length > 0 ? metrics.profit / wins.length : 0,
            avgLoss: losses.length > 0 ? metrics.loss / losses.length : 0,
        };

    }, [trades, appSettings, capital]);

    if (!summary) return null;

    return (
        <AnalyticsCard title="Financial Summary" icon={DollarSign}>
            <div className="space-y-0.5">
                <DetailRow label={`Win Rate (${summary.winCount})`} value={`${summary.winRate.toFixed(1)}%`} valueClassName="text-green-500" />
                <DetailRow label={`Loss Rate (${summary.lossCount})`} value={`${summary.lossRate.toFixed(1)}%`} valueClassName="text-red-500" />
                <DetailRow label={`Gross Profit`} value={summary.grossProfit} isMonetary valueClassName="text-green-500" />
                <DetailRow label={`Gross Loss`} value={-summary.grossLoss} isMonetary valueClassName="text-red-500" />
                <DetailRow label="Average P/L" value={summary.avgPl} isMonetary valueClassName={summary.avgPl >= 0 ? 'text-green-500' : 'text-red-500'} />
                <DetailRow label="Average Win" value={summary.avgWin} isMonetary valueClassName="text-green-500" />
                <DetailRow label="Average Loss" value={-summary.avgLoss} isMonetary valueClassName="text-red-500" />
                <DetailRow label="Spread Paid" value={summary.totalSpread} isMonetary />
                <DetailRow label="Commission" value={summary.totalCommission} isMonetary />
            </div>
        </AnalyticsCard>
    );
};

const TimeAnalysisCard = ({ timeStats }: { timeStats: any }) => {
    if (!timeStats) return null;
    return (
        <AnalyticsCard title="Time Analysis" icon={Clock} className="h-full">
            <div className="space-y-0.5">
                <DetailRow label="Avg. Duration" value={timeStats.avgDuration} isString />
                <DetailRow label="Avg. Gap B/W Trades" value={timeStats.avgGapTime} isString />
                <DetailRow label="Longest Duration" value={timeStats.longestDuration} isString />
                <DetailRow label="Shortest Duration" value={timeStats.shortestDuration} isString />
                <DetailRow label="Longest Gap" value={timeStats.longestGap} isString />
                <DetailRow label="Shortest Gap" value={timeStats.shortestGap} isString />
                <DetailRow label="Best Time" value={timeStats.bestTime} isString valueClassName="text-green-500" />
                <DetailRow label="Worst Time" value={timeStats.worstTime} isString valueClassName="text-red-500" />
            </div>
        </AnalyticsCard>
    );
}
const TimeBasedIncomeCard = ({ incomeStats }: { incomeStats: any }) => {
    if (!incomeStats) return null;
    return (
        <AnalyticsCard title="Time-Based Income" icon={Clock} className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 h-full">
                <Card className="glassmorphic h-full">
                    <CardHeader className="p-2"><CardTitle className="text-xs text-center">Avg-Based</CardTitle></CardHeader>
                    <CardContent className="p-2 space-y-0.5">
                        <DetailRow label="Hourly" value={incomeStats.avgHourlyIncome} isMonetary valueClassName={incomeStats.avgHourlyIncome >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Daily" value={incomeStats.avgDailyIncome} isMonetary valueClassName={incomeStats.avgDailyIncome >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Weekly" value={incomeStats.avgWeeklyIncome} isMonetary valueClassName={incomeStats.avgWeeklyIncome >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Monthly" value={incomeStats.avgMonthlyIncome} isMonetary valueClassName={incomeStats.avgMonthlyIncome >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Yearly" value={incomeStats.avgYearlyIncome} isMonetary valueClassName={incomeStats.avgYearlyIncome >= 0 ? 'text-green-500' : 'text-red-500'} />
                    </CardContent>
                </Card>
                <Card className="glassmorphic h-full">
                    <CardHeader className="p-2"><CardTitle className="text-xs text-center">Real-Time Rate</CardTitle></CardHeader>
                    <CardContent className="p-2 space-y-0.5">
                        <DetailRow label="Per Hour" value={incomeStats.realtime.perHour} isMonetary valueClassName={incomeStats.realtime.perHour >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Per Day" value={incomeStats.realtime.perDay} isMonetary valueClassName={incomeStats.realtime.perDay >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Per Week" value={incomeStats.realtime.perWeek} isMonetary valueClassName={incomeStats.realtime.perWeek >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Per Month" value={incomeStats.realtime.perMonth} isMonetary valueClassName={incomeStats.realtime.perMonth >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <DetailRow label="Per Year" value={incomeStats.realtime.perYear} isMonetary valueClassName={incomeStats.realtime.perYear >= 0 ? 'text-green-500' : 'text-red-500'} />
                    </CardContent>
                </Card>
            </div>
        </AnalyticsCard>
    );
}

export default function HomePage() {
    const hasHydrated = useHasHydrated();
    
    const { journals, activeJournalId, appSettings, filters } = useJournalStore(state => ({
      journals: state.journals,
      activeJournalId: state.activeJournalId,
      appSettings: state.appSettings,
      filters: state.filters
    }));

    const activeJournal = useMemo(() => {
        if (!hasHydrated) return null;
        return journals.find(j => j.id === activeJournalId);
    }, [journals, activeJournalId, hasHydrated]);
    
    const allTrades = useMemo(() => activeJournal?.trades || [], [activeJournal]);

    const filteredTrades = useMemo(() => {
        if (!activeJournal) return [];
        if (!filters || Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
            return allTrades;
        }
        return allTrades.filter(trade => {
            if (filters.pair && filters.pair.length > 0 && !filters.pair.includes(trade.pair)) {
                return false;
            }
             if (filters.direction && filters.direction.length > 0 && !filters.direction.includes(trade.direction)) {
                return false;
            }
            return true;
        });
    }, [allTrades, filters, activeJournal]);
    
    const analytics = useMemo(() => {
        if (!activeJournal || !filteredTrades || !appSettings || !appSettings.pairsConfig || filteredTrades.length === 0) {
            return null;
        }
        
        const metrics = calculateGroupMetrics(filteredTrades, appSettings, activeJournal.capital);
        const totalTrades = filteredTrades.length;

        const sortedTrades = [...filteredTrades].sort((a, b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        const formatDuration = (minutes: number) => {
            if (minutes < 1) return '&lt;1m';
            if (minutes < 60) return `${minutes.toFixed(0)}m`;
            if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
            return `${(minutes / 1440).toFixed(1)}d`;
        }
    
        const durations = filteredTrades.map(t => t.auto.durationMinutes);
        const longestDuration = formatDuration(Math.max(0, ...durations));
        const shortestDuration = formatDuration(durations.length > 0 ? Math.min(...durations.filter(d => d > 0)) : 0);
    
        const gaps: number[] = [];
        for (let i = 1; i < sortedTrades.length; i++) {
            const prevTradeClose = new Date(`${sortedTrades[i - 1].closeDate}T${sortedTrades[i - 1].closeTime}`);
            const currentTradeOpen = new Date(`${sortedTrades[i].openDate}T${sortedTrades[i].openTime}`);
            const gapInMinutes = (currentTradeOpen.getTime() - prevTradeClose.getTime()) / (1000 * 60);
            if (gapInMinutes > 0 && gapInMinutes < 2 * 1440) {
                gaps.push(gapInMinutes);
            }
        }
        const avgGapTimeMinutes = gaps.length > 0 ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;
        const avgGapTime = formatDuration(avgGapTimeMinutes);
        const longestGap = formatDuration(Math.max(0, ...gaps));
        const shortestGap = formatDuration(gaps.length > 0 ? Math.min(...gaps.filter(g => g > 0)) : 0);
    
        const tradesByHour = filteredTrades.reduce((acc, trade) => {
            const hour = String(new Date(trade.openDate + 'T' + trade.openTime).getHours()).padStart(2, '0');
            acc[hour] = (acc[hour] || 0) + trade.auto.pl;
            return acc;
        }, {} as Record<string, number>);
        const sortedHours = Object.entries(tradesByHour).sort((a, b) => b[1] - a[1]);
        const bestTime = sortedHours.length > 0 ? `${sortedHours[0][0]}:00` : 'N/A';
        const worstTime = sortedHours.length > 0 ? `${sortedHours[sortedHours.length - 1][0]}:00` : 'N/A';
    
        const streaks = {
            currentStreak: { type: 'N/A' as const, count: 0 },
            currentStreakPl: 0,
            maxWinStreak: 0,
            maxLossStreak: 0,
            maxWinStreakPl: 0,
            maxLossStreakPl: 0,
        };

        if (sortedTrades.length > 0) {
            let currentWinStreak = 0;
            let currentLossStreak = 0;
            let currentWinStreakPl = 0;
            let currentLossStreakPl = 0;

            sortedTrades.forEach(trade => {
                if (trade.auto.outcome === 'Win') {
                    currentWinStreak++;
                    currentWinStreakPl += trade.auto.pl;
                    streaks.maxWinStreak = Math.max(streaks.maxWinStreak, currentWinStreak);
                    streaks.maxWinStreakPl = Math.max(streaks.maxWinStreakPl, currentWinStreakPl);
                    currentLossStreak = 0;
                    currentLossStreakPl = 0;
                } else if (trade.auto.outcome === 'Loss') {
                    currentLossStreak++;
                    currentLossStreakPl += trade.auto.pl;
                    streaks.maxLossStreak = Math.max(streaks.maxLossStreak, currentLossStreak);
                    streaks.maxLossStreakPl = Math.min(streaks.maxLossStreakPl, currentLossStreakPl);
                    currentWinStreak = 0;
                    currentWinStreakPl = 0;
                } else {
                    currentWinStreak = 0;
                    currentWinStreakPl = 0;
                    currentLossStreak = 0;
                    currentLossStreakPl = 0;
                }
            });

            const lastTradeOutcome = sortedTrades[sortedTrades.length - 1].auto.outcome;
            if (lastTradeOutcome !== 'Neutral') {
                let count = 0;
                let plSum = 0;
                for (let i = sortedTrades.length - 1; i >= 0; i--) {
                    if (sortedTrades[i].auto.outcome === lastTradeOutcome) {
                        count++;
                        plSum += sortedTrades[i].auto.pl;
                    } else break;
                }
                streaks.currentStreak = { type: lastTradeOutcome, count };
                streaks.currentStreakPl = plSum;
            }
        }

        const timeStats = {
            avgDuration: metrics.avgDuration,
            avgGapTime,
            longestDuration,
            shortestDuration,
            longestGap,
            shortestGap,
            bestTime,
            worstTime,
        };
        
        const firstTrade = sortedTrades[0];
        const journeyStart = new Date(firstTrade.openDate + 'T' + firstTrade.openTime).getTime();
        const now = new Date().getTime();
        const totalJourneyMinutes = Math.max(1, (now - journeyStart) / (1000 * 60));
        
        const tradesByDay = filteredTrades.reduce((acc, t) => {
            const day = startOfDay(new Date(t.openDate)).toISOString();
            if (!acc[day]) acc[day] = 0;
            acc[day] += t.auto.pl;
            return acc;
        }, {} as Record<string, number>);

        const daysTraded = Object.keys(tradesByDay).length;
        const totalDurationDays = Math.max(1, differenceInDays(now, journeyStart));
        
        const incomeStats = {
            avgHourlyIncome: totalJourneyMinutes > 0 ? metrics.totalPl / (totalJourneyMinutes / 60) : 0,
            avgDailyIncome: daysTraded > 0 ? metrics.totalPl / daysTraded : 0,
            avgWeeklyIncome: (totalDurationDays > 0 ? metrics.totalPl / totalDurationDays : 0) * 7,
            avgMonthlyIncome: (totalDurationDays > 0 ? metrics.totalPl / totalDurationDays : 0) * 30.44,
            avgYearlyIncome: (totalDurationDays > 0 ? metrics.totalPl / totalDurationDays : 0) * 365.25,
            realtime: {
                perHour: metrics.totalPl / (totalJourneyMinutes / 60),
                perDay: (metrics.totalPl / (totalJourneyMinutes / 60)) * 24,
                perWeek: (metrics.totalPl / (totalJourneyMinutes / 60)) * 24 * 7,
                perMonth: (metrics.totalPl / (totalJourneyMinutes / 60)) * 24 * 30.44,
                perYear: (metrics.totalPl / (totalJourneyMinutes / 60)) * 24 * 365.25,
            },
        };


        return {
            ...metrics,
            streaks,
            timeStats,
            incomeStats,
            highestMark: Math.max(0, ...filteredTrades.map(t => t.auto.score.value)),
            lowestMark: Math.min(100, ...filteredTrades.map(t => t.auto.score.value)),
        };

      }, [activeJournal, filteredTrades, appSettings]);
      
    const bestTrade = useMemo(() => (filteredTrades && filteredTrades.length > 0) ? filteredTrades.reduce((best, current) => current.auto.pl > best.auto.pl ? current : best, filteredTrades[0]) : null, [filteredTrades]);
    const worstTrade = useMemo(() => (filteredTrades && filteredTrades.length > 0) ? filteredTrades.reduce((worst, current) => current.auto.pl < worst.auto.pl ? current : worst, filteredTrades[0]) : null, [filteredTrades]);
  
    if (!hasHydrated || !activeJournal) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingLogo />
            </div>
        );
    }
  
    if (!analytics) {
     return (
         <div className="space-y-6">
            <h1 className="text-xl">Dashboard</h1>
            <div className="text-muted-foreground text-center py-12 text-sm">
                {activeJournal.trades.length === 0 ? "Log some trades to see the dashboard." : "No trades match the current filter. Try adjusting your filter settings."}
            </div>
         </div>
     )
    }
  
    const { streaks } = analytics;
  
  return (
    <div className="space-y-4">
      <h1 className="text-xl">Dashboard</h1>
    
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 h-full">
                <MicroEquityChart activeJournal={activeJournal} filteredTrades={filteredTrades}/>
            </div>
            <div className="lg:col-span-1 h-full">
                <MiniCalendar filteredTrades={filteredTrades}/>
            </div>
             <div className="lg:col-span-1 h-full">
                <PerformanceSummaryCard trades={filteredTrades} best={bestTrade} worst={worstTrade} />
            </div>
            <div className="lg:col-span-1 h-full">
                <AnalyticsCard title="Score Analysis" icon={Brain}>
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-1 rounded-md bg-muted/50">
                            <div className="text-[10px] text-muted-foreground">Avg Score</div>
                            <div className="text-sm font-bold">{analytics.avgScore.toFixed(1)}</div>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50">
                            <div className="text-[10px] text-muted-foreground">Avg Win Score</div>
                            <div className="text-sm font-bold text-green-500">{analytics.avgWinScore.toFixed(1)}</div>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50">
                            <div className="text-[10px] text-muted-foreground">Avg Loss Score</div>
                            <div className="text-sm font-bold text-red-500">{analytics.avgLossScore.toFixed(1)}</div>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50">
                            <div className="text-[10px] text-muted-foreground">Highest Score</div>
                            <div className="text-sm font-bold text-green-500">{analytics.highestMark.toFixed(0)}</div>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50 col-span-2">
                            <div className="text-[10px] text-muted-foreground">Lowest Score</div>
                            <div className="text-sm font-bold text-red-500">{analytics.lowestMark.toFixed(0)}</div>
                        </div>
                    </div>
                    {streaks && (
                        <Card className="glassmorphic mt-2">
                            <CardHeader className="p-2"><CardTitle className="text-xs flex items-center gap-2"><GitCommitVertical className="h-3 w-3 text-primary"/> Streaks</CardTitle></CardHeader>
                            <CardContent className="p-1">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-1 rounded-md bg-muted/50">
                                        <div className="text-[10px] text-muted-foreground">Current</div>
                                        <div className={cn("text-sm font-bold flex items-baseline justify-center gap-1", streaks.currentStreak.type === 'Win' ? 'text-green-500' : 'text-red-500')}>
                                            {streaks.currentStreak.count}
                                            <span className="text-[9px] font-semibold">{streaks.currentStreak.type === 'Win' ? 'win' : 'loss'}</span>
                                        </div>
                                        <div className={cn("text-[9px] font-semibold", streaks.currentStreak.type === 'Win' ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={streaks.currentStreakPl} showPercentage /></div>
                                    </div>
                                    <div className="p-1 rounded-md bg-muted/50">
                                        <div className="text-[10px] text-muted-foreground">Win</div>
                                        <div className="text-sm font-bold text-green-500">{streaks.maxWinStreak}</div>
                                        <div className="text-[9px] font-semibold text-green-500"><FormattedNumber value={streaks.maxWinStreakPl} showPercentage /></div>
                                    </div>
                                    <div className="p-1 rounded-md bg-muted/50">
                                        <div className="text-[10px] text-muted-foreground">Loss</div>
                                        <div className="text-sm font-bold text-red-500">{streaks.maxLossStreak}</div>
                                        <div className="text-[9px] font-semibold text-red-500"><FormattedNumber value={streaks.maxLossStreakPl} showPercentage /></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </AnalyticsCard>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
             <div className="lg:col-span-1 h-full">
                 <FinancialSummaryCard trades={filteredTrades} appSettings={appSettings} capital={activeJournal.capital} />
             </div>
             <div className="lg:col-span-1 h-full">
                 <TimeAnalysisCard timeStats={analytics.timeStats} />
             </div>
             <div className="lg:col-span-2 h-full">
                 <TimeBasedIncomeCard incomeStats={analytics.incomeStats} />
             </div>
        </div>
    </div>
    );
}



    


