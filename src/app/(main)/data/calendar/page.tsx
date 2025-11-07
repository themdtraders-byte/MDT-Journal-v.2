
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, EyeIcon, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Trade } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TradeDetailDialog from '@/components/trade-detail-dialog';
import PairIcon from '@/components/PairIcon';
import { useRouter } from 'next/navigation';
import FormattedNumber from '@/components/ui/formatted-number';
import { getStatusIcon, getResultBadgeVariant } from '@/lib/trade-helpers';
import { format } from 'date-fns';


const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type DailyStats = { totalPl: number; trades: Trade[] };

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
                        <TableHead>Outcome</TableHead>
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
                            <TableCell><div className="flex items-center gap-2">{getStatusIcon(trade.auto.outcome)}<span>{trade.auto.outcome}</span></div></TableCell>
                            <TableCell><Badge className={getResultBadgeVariant(trade.auto.result)}>{trade.auto.result}</Badge></TableCell>
                            <TableCell className={trade.auto.pl >= 0 ? 'text-green-500' : 'text-red-500'}><FormattedNumber value={trade.auto.pl} /></TableCell>
                            <TableCell>{trade.auto.rr.toFixed(2)}</TableCell>
                            <TableCell>{trade.auto.score.value}</TableCell>
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

const WeeklySummaryCard = ({ title, pl, trades }: { title: string, pl: number, trades: number }) => {
    const plColor = pl > 0 ? 'text-green-500' : pl < 0 ? 'text-red-500' : 'text-muted-foreground';
    const bgColor = pl > 0 ? 'bg-green-500/10' : pl < 0 ? 'bg-red-500/10' : 'bg-muted/50';

    return (
        <Card className={cn("glassmorphic flex flex-col h-full", bgColor)}>
            <CardContent className="p-2 flex justify-between items-center flex-grow">
                <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-[10px] text-muted-foreground">{trades} Trade{trades !== 1 && 's'}</p>
                </div>
                <div className={cn("text-base font-bold", plColor)}><FormattedNumber value={pl} /></div>
            </CardContent>
        </Card>
    );
};


export default function CalendarPage() {
    const router = useRouter();
    const { openAddTradeDialog, journals, activeJournalId } = useJournalStore(state => ({
        openAddTradeDialog: state.openAddTradeDialog,
        journals: state.journals,
        activeJournalId: state.activeJournalId,
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
    
    const { monthlyStats } = useMemo(() => {
        if (!activeJournal) return { monthlyStats: {} };
        
        const monthlyStats: Record<string, DailyStats> = {};
        
        activeJournal.trades.forEach(trade => {
            const date = new Date(trade.openDate + 'T00:00:00');
            const tradeMonth = date.getMonth();
            const tradeYear = date.getFullYear();

            if (tradeYear === currentDate.getFullYear() && tradeMonth === currentDate.getMonth()) {
                const key = format(date, 'yyyy-MM-dd');
                if (!monthlyStats[key]) {
                    monthlyStats[key] = { totalPl: 0, trades: [] };
                }
                monthlyStats[key].totalPl += trade.auto.pl;
                monthlyStats[key].trades.push(trade);
            }
        });
        
        return { monthlyStats };
    }, [activeJournal, currentDate]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const handleDateClick = (date: Date) => {
        const key = format(date, 'yyyy-MM-dd');
        if (monthlyStats[key]?.trades.length > 0) {
            setSelectedDate(date);
        }
    }
    
    const selectedDayTrades = useMemo(() => {
        if (!selectedDate) return [];
        const key = format(selectedDate, 'yyyy-MM-dd');
        return monthlyStats[key]?.trades || [];
    }, [selectedDate, monthlyStats]);
    

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const calendarGrid = useMemo(() => {
        const grid: ({ year: number, month: number, day: number, isCurrentMonth: boolean })[][] = [];
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let currentDay = 1 - firstDayOfMonth;

        for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
            const week: ({ year: number, month: number, day: number, isCurrentMonth: boolean })[] = [];
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const date = new Date(year, month, currentDay);
                week.push({ 
                    year: date.getFullYear(), 
                    month: date.getMonth(), 
                    day: date.getDate(), 
                    isCurrentMonth: date.getMonth() === month 
                });
                currentDay++;
            }
            grid.push(week);
             if (currentDay > daysInMonth) break;
        }
        return grid;
    }, [year, month]);
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const totalMonthlyPl = Object.values(monthlyStats).reduce((sum, day) => sum + day.totalPl, 0);
    const totalMonthlyTrades = Object.values(monthlyStats).reduce((sum, day) => sum + day.trades.length, 0);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft /></Button>
                    <h1 className="text-xl font-bold">{monthNames[month]} {year}</h1>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight /></Button>
                </div>
                 <Button variant="outline" onClick={() => router.push('/performance/calendar')}>Yearly Heatmap</Button>
            </div>
            
            <div className="flex-1 min-h-0 grid grid-cols-[repeat(7,1fr)_minmax(120px,0.8fr)] gap-1">
                {/* Weekday Headers */}
                {weekdays.map(day => <div key={day} className="text-center font-bold text-xs text-muted-foreground p-1">{day}</div>)}
                <div className="text-center font-bold text-xs text-muted-foreground p-1">Weekly</div>
                
                {/* Calendar Grid & Weekly Summary */}
                {calendarGrid.map((week, weekIndex) => {
                    const weeklyTotalPl = week.reduce((sum, day) => {
                        if (!day.isCurrentMonth) return sum;
                        const key = format(new Date(day.year, day.month, day.day), 'yyyy-MM-dd');
                        return sum + (monthlyStats[key]?.totalPl || 0);
                    }, 0);
                    const weeklyTotalTrades = week.reduce((sum, day) => {
                        if (!day.isCurrentMonth) return sum;
                        const key = format(new Date(day.year, day.month, day.day), 'yyyy-MM-dd');
                        return sum + (monthlyStats[key]?.trades.length || 0);
                    }, 0);

                    return (
                        <React.Fragment key={`week-row-${weekIndex}`}>
                            {week.map((dateInfo, dayIndex) => {
                                const { year, month, day, isCurrentMonth } = dateInfo;
                                const key = format(new Date(year, month, day), 'yyyy-MM-dd');
                                const dayData = isCurrentMonth ? monthlyStats[key] : undefined;
                                return (
                                    <div
                                        key={dayIndex}
                                        className={cn(
                                            "p-1 border rounded-md flex flex-col justify-start text-xs transition-all relative group h-full",
                                            dayData && dayData.trades.length > 0 ? "cursor-pointer" : "",
                                            isCurrentMonth ? "bg-background/30" : "bg-muted/10 text-muted-foreground",
                                            dayData && dayData.totalPl > 0 && "bg-green-500/20",
                                            dayData && dayData.totalPl < 0 && "bg-red-500/20"
                                        )}
                                        onClick={() => isCurrentMonth && dayData && handleDateClick(new Date(year, month, day))}
                                    >
                                        <span className="font-semibold text-[10px]">{day}</span>
                                        {dayData && (
                                            <div className="flex flex-col items-start justify-center flex-1 space-y-0.5 w-full mt-1">
                                                <p className={cn("font-bold text-sm", dayData.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                    <FormattedNumber value={dayData.totalPl} />
                                                </p>
                                                <p className="font-semibold text-muted-foreground text-[9px]">{dayData.trades.length} trade{dayData.trades.length !== 1 && 's'}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                             <WeeklySummaryCard 
                                title={`Week ${weekIndex + 1}`}
                                pl={weeklyTotalPl}
                                trades={weeklyTotalTrades}
                            />
                        </React.Fragment>
                    );
                })}
                {/* Empty cells for the headers row */}
                 <div className="col-span-7"></div> 
                <WeeklySummaryCard 
                    title="Total"
                    pl={totalMonthlyPl}
                    trades={totalMonthlyTrades}
                />
            </div>

            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="glassmorphic sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Trades for {selectedDate ? format(selectedDate, 'PPP') : ''}</DialogTitle>
                        <DialogDescription>A summary of all trades opened on this day.</DialogDescription>
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
