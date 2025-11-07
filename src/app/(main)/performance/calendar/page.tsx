

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, EyeIcon, Pencil, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Trade } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TradeDetailDialog from '@/components/trade-detail-dialog';
import PairIcon from '@/components/PairIcon';
import FormattedNumber from '@/components/ui/formatted-number';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/ui/stat-card';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getStatusIcon = (status: 'Win' | 'Loss' | 'Neutral') => {
    if (status === 'Win') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (status === 'Loss') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
};

const getResultBadgeVariant = (result: 'TP' | 'SL' | 'BE' | 'Stop') => {
    switch (result) {
        case 'TP': return 'bg-green-500/20 text-green-500';
        case 'SL': return 'bg-red-500/20 text-red-500';
        case 'BE': return 'bg-blue-500/20 text-blue-400';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

const DailyTradesTable = ({ trades, onOpenTradeDetail, onOpenTradeEdit }: { trades: Trade[], onOpenTradeDetail: (trade: Trade) => void, onOpenTradeEdit: (trade: Trade) => void }) => {
    if (trades.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No trades for this day.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pair</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>P/L ($)</TableHead>
                        <TableHead>R:R</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trades.map(trade => (
                        <TableRow key={trade.id}>
                            <TableCell><div className="flex items-center gap-2"><PairIcon pair={trade.pair} /><span>{trade.pair}</span></div></TableCell>
                            <TableCell><div className="flex items-center gap-2">{getStatusIcon(trade.auto.status)}<span>{trade.auto.status}</span></div></TableCell>
                            <TableCell><Badge className={getResultBadgeVariant(trade.auto.result)}>{trade.auto.result}</Badge></TableCell>
                            <TableCell className={trade.auto.pl >= 0 ? 'text-green-500' : 'text-red-500'}><FormattedNumber value={trade.auto.pl} /></TableCell>
                            <TableCell>{trade.auto.rr.toFixed(2)}</TableCell>
                            <TableCell>{trade.auto.score.value}/100</TableCell>
                            <TableCell>{trade.auto.holdingTime}</TableCell>
                            <TableCell>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => onOpenTradeDetail(trade)}><EyeIcon className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => onOpenTradeEdit(trade)}><Pencil className="h-5 w-5" /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

const MiniMonthCalendar = ({ year, month, dailyStats, maxMonthlyAbsPl, onDateClick }: { year: number, month: number, dailyStats: Record<string, {pl: number, trades: number, totalR: number }>, maxMonthlyAbsPl: number, onDateClick: (date: Date) => void }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const calendarGrid = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.push(<div key={`empty-${i}`} className="w-full aspect-square" />);
    }

    let monthlyPl = 0;
    let monthlyR = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${month}-${day}`;
        const dayData = dailyStats[key];
        
        if (dayData) {
            monthlyPl += dayData.pl;
            monthlyR += dayData.totalR;
        }

        const getDayColor = (pl: number) => {
            if (pl > 100) return 'bg-green-600/80 hover:bg-green-600 text-white';
            if (pl > 0) return 'bg-green-500/60 hover:bg-green-500 text-white';
            if (pl < -100) return 'bg-red-600/80 hover:bg-red-600 text-white';
            if (pl < 0) return 'bg-red-500/60 hover:bg-red-500 text-white';
            return 'bg-muted/50 hover:bg-muted text-muted-foreground';
        };

        calendarGrid.push(
            <TooltipProvider key={day} delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                "w-full aspect-square rounded-sm flex items-center justify-center p-0.5 text-xs transition-all",
                                dayData ? "cursor-pointer " + getDayColor(dayData.pl) : "bg-muted/20"
                            )}
                            onClick={() => dayData && onDateClick(new Date(year, month, day))}
                        >
                             <span className="font-bold text-xs">{day}</span>
                        </div>
                    </TooltipTrigger>
                    {dayData && (
                        <TooltipContent>
                            <p className="font-bold">{monthNames[month]} {day}, {year}</p>
                            <div className={cn("flex items-center gap-1", dayData.pl >= 0 ? 'text-green-500' : 'text-red-500')}>P/L: <FormattedNumber value={dayData.pl} /></div>
                            <p>Trades: {dayData.trades}</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
        );
    }

    const plPercentage = maxMonthlyAbsPl > 0 ? (Math.abs(monthlyPl) / maxMonthlyAbsPl) * 100 : 0;

    return (
        <Card className="glassmorphic flex-1 min-w-[180px] flex flex-col">
            <CardHeader className="p-2 text-center">
                <CardTitle className="text-sm font-semibold">{monthNames[month]}</CardTitle>
            </CardHeader>
            <CardContent className="p-1 flex-grow">
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted-foreground mb-1">
                    {weekdays.map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-px">
                    {calendarGrid}
                </div>
            </CardContent>
            <div className="p-2 border-t mt-auto">
                <Progress value={plPercentage} colorClassName={monthlyPl > 0 ? 'bg-green-500' : 'bg-red-500'} className="h-1"/>
                <div className="flex justify-between items-center mt-1 text-xs">
                     <span className={cn("font-bold", monthlyPl > 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={monthlyPl} /></span>
                     <span className={cn("font-bold", monthlyR > 0 ? 'text-green-500' : 'text-red-500')}>{monthlyR.toFixed(1)}R</span>
                </div>
            </div>
        </Card>
    );
};

export default function YearlyCalendarPage() {
    const router = useRouter();
    const { openAddTradeDialog, appSettings, activeJournalId, journals } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
    
    const calculateR = (trade: Trade): number => {
        if (!appSettings || !trade.stopLoss || trade.stopLoss === 0) return 0;
        const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
        const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
        return riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
    };

    const yearlyStats = useMemo(() => {
        if (!activeJournal) return { dailyStats: {}, summary: { totalPl: 0, winningDays: 0, losingDays: 0, totalDays: 0, avgMonthlyPl: 0, avgDailyPl: 0 }, maxMonthlyAbsPl: 0 };

        const dailyStats = activeJournal.trades.reduce((acc, trade) => {
            if (!trade.openDate) return acc;
            const date = new Date(trade.openDate + 'T00:00:00');
            const year = date.getFullYear();
            if (year !== currentYear) return acc;

            const dayKey = `${year}-${date.getMonth()}-${date.getDate()}`;

            if (!acc[dayKey]) {
                acc[dayKey] = { pl: 0, trades: 0, totalR: 0 };
            }
            acc[dayKey].pl += trade.auto.pl;
            acc[dayKey].trades += 1;
            acc[dayKey].totalR += calculateR(trade);
            return acc;
        }, {} as Record<string, { pl: number, trades: number, totalR: number }>);

        const monthlyPls = Object.entries(dailyStats).reduce((acc, [key, day]) => {
            const monthKey = key.split('-').slice(0, 2).join('-');
            acc[monthKey] = (acc[monthKey] || 0) + day.pl;
            return acc;
        }, {} as Record<string, number>);

        const yearlySummary = Object.values(dailyStats).reduce((acc, day) => {
            acc.totalPl += day.pl;
            if (day.pl > 0) acc.winningDays++;
            else if (day.pl < 0) acc.losingDays++;
            acc.totalDays++;
            return acc;
        }, { totalPl: 0, winningDays: 0, losingDays: 0, totalDays: 0, avgMonthlyPl: 0, avgDailyPl: 0 });

        const totalMonths = Object.keys(monthlyPls).length;
        yearlySummary.avgMonthlyPl = totalMonths > 0 ? yearlySummary.totalPl / totalMonths : 0;
        yearlySummary.avgDailyPl = yearlySummary.totalDays > 0 ? yearlySummary.totalPl / yearlySummary.totalDays : 0;

        const maxMonthlyAbsPl = Math.max(0, ...Object.values(monthlyPls).map(Math.abs));

        return { dailyStats, summary: yearlySummary, maxMonthlyAbsPl };

    }, [activeJournal?.trades, currentYear, appSettings]);

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    }
    
    const selectedDayTrades = useMemo(() => {
        if (!selectedDate || !activeJournal) return [];
        
        const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
        const dayTrades = activeJournal.trades.filter(t => `${t.openDate.split('-')[0]}-${new Date(t.openDate+'T00:00:00').getMonth()}-${new Date(t.openDate+'T00:00:00').getDate()}` === key);
        return dayTrades;
    }, [selectedDate, activeJournal?.trades]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">Yearly Heatmap</h1>
                <div className="flex items-center gap-2">
                     <Button variant="outline" onClick={() => router.push('/data/calendar')}>Monthly Calendar</Button>
                     <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y - 1)}><ChevronLeft /></Button>
                     <span className="font-bold text-lg">{currentYear}</span>
                     <Button variant="ghost" size="icon" onClick={() => setCurrentYear(y => y + 1)} disabled={currentYear === new Date().getFullYear()}><ChevronRight /></Button>
                </div>
            </div>
            
             <Card className="glassmorphic">
                <CardContent className="p-3 grid grid-cols-2 md:grid-cols-5 gap-3">
                    <StatCard label="Total P/L" value={<FormattedNumber value={yearlyStats.summary.totalPl} />} subValue={`${currentYear}`} positive={yearlyStats.summary.totalPl >= 0} />
                    <StatCard label="Winning Days" value={yearlyStats.summary.winningDays} subValue={`${(yearlyStats.summary.totalDays > 0 ? (yearlyStats.summary.winningDays / yearlyStats.summary.totalDays) * 100 : 0).toFixed(1)}%`} positive={true}/>
                    <StatCard label="Losing Days" value={yearlyStats.summary.losingDays} subValue={`${(yearlyStats.summary.totalDays > 0 ? (yearlyStats.summary.losingDays / yearlyStats.summary.totalDays) * 100 : 0).toFixed(1)}%`} positive={false}/>
                    <StatCard label="Avg P/L Per Month" value={<FormattedNumber value={yearlyStats.summary.avgMonthlyPl} />} positive={yearlyStats.summary.avgMonthlyPl >= 0}/>
                    <StatCard label="Avg P/L Per Day" value={<FormattedNumber value={yearlyStats.summary.avgDailyPl} />} positive={yearlyStats.summary.avgDailyPl >= 0}/>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {monthNames.map((_, index) => (
                    <MiniMonthCalendar 
                        key={index}
                        year={currentYear}
                        month={index}
                        dailyStats={yearlyStats.dailyStats}
                        maxMonthlyAbsPl={yearlyStats.maxMonthlyAbsPl}
                        onDateClick={handleDateClick}
                    />
                ))}
            </div>

            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="glassmorphic sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Trades for {selectedDate?.toLocaleDateString('en-US', { timeZone: 'UTC' })}</DialogTitle>
                        <DialogDescription>
                            A summary of all trades opened on this day.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <DailyTradesTable 
                            trades={selectedDayTrades} 
                            onOpenTradeDetail={setViewingTrade}
                            onOpenTradeEdit={openAddTradeDialog}
                        />
                    </div>
                </DialogContent>
            </Dialog>

             <TradeDetailDialog
                trade={viewingTrade}
                isOpen={!!viewingTrade}
                onOpenChange={(open) => !open && setViewingTrade(null)}
            />
        </div>
    );
}
