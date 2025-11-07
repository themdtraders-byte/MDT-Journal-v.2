
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Trade } from '@/types';
import FormattedNumber from './ui/formatted-number';
import { useJournalStore } from '@/hooks/use-journal-store';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type DailyStats = { totalPl: number; trades: number };

export default function MiniCalendar({ filteredTrades }: { filteredTrades: Trade[] }) {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const { appSettings } = useJournalStore();

    const monthlyStats = useMemo(() => {
        if (!filteredTrades || filteredTrades.length === 0 || !appSettings) return {}; // Definitive guard clause
        return filteredTrades.reduce((acc, trade) => {
            if (!trade.openDate) return acc;
            const date = new Date(trade.openDate + 'T00:00:00');
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            
            if(year === currentDate.getFullYear() && month === currentDate.getMonth()) {
                const key = `${year}-${month}-${day}`;
                if (!acc[key]) {
                    acc[key] = { totalPl: 0, trades: 0 };
                }
                acc[key].totalPl += trade.auto.pl;
                acc[key].trades += 1;
            }
            return acc;
        }, {} as Record<string, DailyStats>);
    }, [filteredTrades, currentDate, appSettings]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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
        calendarGrid.push(<div key={`empty-${i}`} />);
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
                                "aspect-square rounded-sm flex items-center justify-center p-0 text-[9px] transition-all",
                                dayData ? "cursor-pointer " + getDayColor(dayData.totalPl) : "bg-muted/20"
                            )}
                        >
                            <span className="font-bold">{day}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-bold">{monthNames[month]} {day}, {year}</p>
                        {dayData ? (
                            <div>
                                <div className={cn("flex items-center gap-1", dayData.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}>P/L: <FormattedNumber value={dayData.totalPl} /></div>
                                <p>Trades: {dayData.trades}</p>
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
            <Card className="h-full glassmorphic interactive-card w-full flex flex-col p-2">
                <CardHeader className="p-1.5">
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handlePrevMonth}><ChevronLeft className="h-3 w-3"/></Button>
                        <CardTitle className="text-xs">{monthNames[month]} {year}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleNextMonth}><ChevronRight className="h-3 w-3"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0.5 pt-0 flex-1 flex flex-col">
                    <div className="grid grid-cols-7 gap-px text-center font-bold text-[7px] text-muted-foreground mb-0.5">
                        {weekdays.map((day, index) => <div key={index}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-px flex-1">
                        {calendarGrid}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
