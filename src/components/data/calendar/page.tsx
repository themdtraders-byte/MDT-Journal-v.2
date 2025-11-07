'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import type { Trade, AppSettings } from '@/types';
import PerformanceBarChart from './performance-bar-chart';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getWeekOfMonth, eachDayOfInterval, startOfDay, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import PerformanceByTimeframeCoach from './performance-by-timeframe-coach';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/ui/stat-card';
import { calculateGroupMetrics } from '@/lib/analytics';
import { useJournalStore } from '@/hooks/use-journal-store';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import FormattedNumber from '@/components/ui/formatted-number';

type BarChartData = {
  name: string;
  profit: number;
  loss: number;
  trades: number;
  winRate: number;
  totalR: number;
  avgR: number;
  profitFactor: number;
  totalPl: number;
  gainPercent: number;
  expectancy: number;
  avgPl: number;
  avgLotSize: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgDuration: string;
  avgScore: number;
};

export const DailyStatGrid = ({ data }: { data: BarChartData[] }) => {
    const dailyStats = useMemo(() => {
        if (data.length === 0) {
            return {
                avgWinningDay: 0, avgLosingDay: 0, biggestWinningDay: 0,
                biggestLosingDay: 0, winningDays: 0, losingDays: 0,
            };
        }
        
        const winningDays = data.filter(d => d.totalPl > 0);
        const losingDays = data.filter(d => d.totalPl < 0);

        const avgWinningDay = winningDays.length > 0 ? winningDays.reduce((sum, d) => sum + d.totalPl, 0) / winningDays.length : 0;
        const avgLosingDay = losingDays.length > 0 ? losingDays.reduce((sum, d) => sum + d.totalPl, 0) / losingDays.length : 0;

        const biggestWinningDay = Math.max(0, ...data.map(d => d.totalPl));
        const biggestLosingDay = Math.min(0, ...data.map(d => d.totalPl));
        
        return {
            avgWinningDay, avgLosingDay, biggestWinningDay, biggestLosingDay,
            winningDays: winningDays.length, losingDays: losingDays.length,
        }
    }, [data]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
            <StatCard positive={dailyStats.avgWinningDay >= 0} label="Avg. Winning Day" value={<FormattedNumber value={dailyStats.avgWinningDay} />} />
            <StatCard positive={dailyStats.avgLosingDay >= 0} label="Avg. Losing Day" value={<FormattedNumber value={dailyStats.avgLosingDay} />} />
            <StatCard positive={dailyStats.biggestWinningDay >= 0} label="Biggest Winning Day" value={<FormattedNumber value={dailyStats.biggestWinningDay} />} />
            <StatCard positive={dailyStats.biggestLosingDay >= 0} label="Biggest Losing Day" value={<FormattedNumber value={dailyStats.biggestLosingDay} />} />
            <StatCard positive={true} label="Winning Days" value={dailyStats.winningDays} />
            <StatCard positive={false} label="Losing Days" value={dailyStats.losingDays} />
        </div>
    )
}

export default function PerformanceByTimeframeChart({ trades, children, showZoomSlider }: { trades: Trade[], children?: React.ReactNode, showZoomSlider?: boolean }) {
    const [groupBy, setGroupBy] = useState('timeOfDay');
    const [interval, setInterval] = useState('60');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const { appSettings, journals, activeJournalId } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemWidth = 40; // Approx width of a bar + gap

    const { chartData, dateOptions } = useMemo(() => {
        const getGroupedData = (
            getCategory: (trade: Trade) => string, 
            allCategories?: string[]
        ): BarChartData[] => {
            if (!activeJournal || !appSettings) return [];
            const grouped = trades.reduce((acc, trade) => {
                const category = getCategory(trade);
                if (category) {
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(trade);
                }
                return acc;
            }, {} as Record<string, Trade[]>);

            const categoriesToMap = allCategories || Object.keys(grouped).sort();

            return categoriesToMap.map(categoryName => {
                const tradesInGroup = grouped[categoryName] || [];
                const metrics = calculateGroupMetrics(tradesInGroup, appSettings, activeJournal.capital);
                return { name: categoryName, ...metrics };
            });
        }

        switch (groupBy) {
            case 'timeOfDay': {
                const intervalMinutes = parseInt(interval);
                const numBuckets = 1440 / intervalMinutes;
                const allTimeBuckets = Array.from({ length: numBuckets }, (_, i) => {
                    const startMinutes = i * intervalMinutes;
                    const endMinutes = startMinutes + intervalMinutes - 1;
                    const formatTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
                    return `${formatTime(startMinutes)}-${formatTime(endMinutes)}`;
                });
                 const getCategory = (trade: Trade) => {
                    const date = new Date(`${trade.openDate}T${trade.openTime}`);
                    const minutesOfDay = date.getHours() * 60 + date.getMinutes();
                    const bucketIndex = Math.floor(minutesOfDay / intervalMinutes);
                    return allTimeBuckets[bucketIndex];
                };
                return { chartData: getGroupedData(getCategory, allTimeBuckets), dateOptions: null };
            }
            case 'dayOfWeek': {
                const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return { chartData: getGroupedData(t => format(new Date(t.openDate + 'T00:00:00'), 'EEEE'), allDays), dateOptions: null };
            }
            case 'weekOfMonth': {
                 const allWeeks = ['1st Week', '2nd Week', '3rd Week', '4th Week', '5th Week'];
                 const getCategory = (trade: Trade) => {
                    const date = new Date(trade.openDate + 'T00:00:00');
                    const weekNum = getWeekOfMonth(date);
                    const suffixes = ['st', 'nd', 'rd', 'th', 'th'];
                    return `${weekNum}${suffixes[weekNum - 1]} Week`;
                };
                return { chartData: getGroupedData(getCategory, allWeeks), dateOptions: null };
            }
            case 'dayOfMonth': {
                const allDays = Array.from({ length: 31 }, (_, i) => String(i + 1));
                return { chartData: getGroupedData(t => String(new Date(t.openDate + 'T00:00:00').getDate()), allDays), dateOptions: null };
            }
            case 'monthOfYear': {
                const allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                return { chartData: getGroupedData(t => format(new Date(t.openDate + 'T00:00:00'), 'MMMM'), allMonths), dateOptions: null };
            }
            case 'byDate': {
                if (trades.length === 0 || !activeJournal) return { chartData: [], dateOptions: { years: [], months: [] } };
    
                const data = getGroupedData(t => {
                    if (!t.openDate) return 'N/A'; // Should not happen but good practice
                    return format(new Date(t.openDate + 'T00:00:00'), 'yyyy-MM-dd');
                });
    
                // Ensure only days with trades are included
                const filteredData = data.filter(d => d.trades > 0);
                
                const years = [...new Set(filteredData.map(d => d.name.substring(0,4)))].sort((a,b) => parseInt(b) - parseInt(a));
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                
                return { chartData: filteredData, dateOptions: { years, months } };
            }
            default:
                return { chartData: [], dateOptions: null };
        }

    }, [groupBy, interval, trades, appSettings, activeJournal]);

     useEffect(() => {
        if (groupBy === 'byDate' && selectedYear !== 'all' && selectedMonth !== 'all' && chartData && scrollRef.current) {
            const firstDateInChart = new Date(chartData[0].name);
            const firstDayOfMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);

            const dayIndex = differenceInDays(firstDayOfMonth, firstDateInChart);
            
            if (dayIndex >= 0) {
                const scrollPosition = dayIndex * itemWidth;
                scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            }
        }
    }, [selectedYear, selectedMonth, groupBy, chartData, itemWidth]);

    return (
        <PerformanceBarChart
            title="Performance by Time"
            description="Analyzes profitability based on the time trades are opened."
            data={chartData}
            showZoomSlider={groupBy !== 'byDate'}
            yAxisLabel="Performance"
            isScrollable={groupBy === 'byDate'}
            scrollRef={scrollRef}
            chartWidth={groupBy === 'byDate' ? chartData.length * itemWidth : undefined}
            controls={
                <div className="flex items-end gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">Group By</Label>
                        <Select value={groupBy} onValueChange={setGroupBy}>
                            <SelectTrigger className="w-[150px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="timeOfDay">Time of Day</SelectItem>
                                <SelectItem value="dayOfWeek">Day of Week</SelectItem>
                                <SelectItem value="weekOfMonth">Week of Month</SelectItem>
                                <SelectItem value="dayOfMonth">Day of Month</SelectItem>
                                <SelectItem value="monthOfYear">Month of Year</SelectItem>
                                <SelectItem value="byDate">By Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {groupBy === 'timeOfDay' && (
                         <div className="space-y-1">
                            <Label className="text-xs">Interval</Label>
                            <Select value={interval} onValueChange={setInterval}>
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="60">1 Hour</SelectItem>
                                    <SelectItem value="30">30 Min</SelectItem>
                                    <SelectItem value="15">15 Min</SelectItem>
                                    <SelectItem value="10">10 Min</SelectItem>
                                    <SelectItem value="5">5 Min</SelectItem>
                                    <SelectItem value="1">1 Min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {groupBy === 'byDate' && dateOptions && (
                        <>
                            <div className="space-y-1">
                                <Label className="text-xs">Year</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[90px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {dateOptions.years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Month</Label>
                                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[110px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {dateOptions.months.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
            }
        >
          {children}
        </PerformanceBarChart>
    );
}