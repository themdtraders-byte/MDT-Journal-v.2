
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, EyeIcon, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Trade } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import TradeDetailDialog from './trade-detail-dialog';
import PairIcon from './PairIcon';
import FormattedNumber from './ui/formatted-number';
import { getStatusIcon, getResultBadgeVariant } from '@/lib/trade-helpers';
import { format, parseISO } from 'date-fns';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DailyStats = { totalR: number; totalPl: number; trades: Trade[] };

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

export default function HeatmapCalendar() {
    const { openAddTradeDialog, journals, activeJournalId, appSettings } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const filteredTrades = activeJournal?.trades || [];

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);

    const calculateR = (trade: Trade): number => {
        if (!appSettings || !trade.stopLoss || trade.stopLoss === 0) return 0;
        const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
        const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
        return riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
    };

    const monthlyStats = useMemo(() => {
        if (!filteredTrades) return {};
        return filteredTrades.reduce((acc, trade) => {
            if (!trade.openDate) return acc;
            const date = new Date(trade.openDate + 'T00:00:00');
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            
            if(year === currentDate.getFullYear() && month === currentDate.getMonth()) {
                const key = `${year}-${month}-${day}`;
                if (!acc[key]) {
                    acc[key] = { totalR: 0, totalPl: 0, trades: [] };
                }
                acc[key].totalR += calculateR(trade);
                acc[key].totalPl += trade.auto.pl;
                acc[key].trades.push(trade);
            }
            return acc;
        }, {} as Record<string, DailyStats>);
    }, [filteredTrades, appSettings, currentDate]);
  
    const selectedDayTrades = useMemo(() => {
        if (!selectedDate) return [];
        const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
        return monthlyStats[key]?.trades || [];
    }, [selectedDate, monthlyStats]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    
    const handleDateClick = (day: number) => {
        const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
        if (monthlyStats[key] && monthlyStats[key].trades.length > 0) {
            setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const getDayColor = (totalPl: number) => {
        if (totalPl > 100) return 'bg-green-600/80 hover:bg-green-600 text-white';
        if (totalPl > 0) return 'bg-green-500/60 hover:bg-green-500 text-white';
        if (totalPl < -100) return 'bg-red-600/80 hover:bg-red-600 text-white';
        if (totalPl < 0) return 'bg-red-500/60 hover:bg-red-500 text-white';
        return 'bg-muted/50 hover:bg-muted text-muted-foreground';
    };
    
    const calendarGrid = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarGrid.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${month}-${day}`;
        const dayData = monthlyStats[key];
        calendarGrid.push(
            <TooltipProvider key={day} delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div 
                            className={cn(
                                "aspect-square rounded-sm flex items-center justify-center p-0.5 text-xs transition-all",
                                dayData ? "cursor-pointer " + getDayColor(dayData.totalPl) : "bg-muted/20"
                            )}
                            onClick={() => handleDateClick(day)}
                        >
                            <span className="font-bold text-[10px]">{day}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-bold">{monthNames[month]} {day}, {year}</p>
                        {dayData ? (
                            <div>
                                <div className={cn("flex items-center gap-1", dayData.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>P/L: <FormattedNumber value={dayData.totalPl} /></div>
                                <p>Trades: {dayData.trades.length}</p>
                            </div>
                        ) : (
                            <p>No trades</p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <>
            <Card className="glassmorphic interactive-card w-full h-full flex flex-col">
                <CardHeader className="p-1.5">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handlePrevMonth}><ChevronLeft className="h-3 w-3"/></Button>
                        <CardTitle className="text-xs">{monthNames[month]} {year}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleNextMonth}><ChevronRight className="h-3 w-3"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0.5 pt-0 flex-1 flex flex-col">
                    <div className="grid grid-cols-7 gap-px text-center font-bold text-[8px] text-muted-foreground mb-0.5">
                        {weekdays.map((day, index) => <div key={index}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-px flex-1">
                        {calendarGrid}
                    </div>
                </CardContent>
            </Card>
            <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
                <DialogContent className="glassmorphic sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Trades for {selectedDate?.toLocaleDateString('en-US', { timeZone: 'UTC' })}</DialogTitle>
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
        </>
    );
}

    