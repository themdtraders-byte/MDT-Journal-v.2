
'use client';

import { useState, useMemo } from 'react';
import type { Trade, AnalysisCategory, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { PlusCircle, ChevronRight, ChevronDown, GripVertical, Trash2, ArrowRight } from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, getWeekOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import FormattedNumber from './ui/formatted-number';
import { Badge } from './ui/badge';
import { useJournalStore } from '@/hooks/use-journal-store';

type AnalysisRow = {
    key: string;
    level: number;
    label: string;
    subRows?: AnalysisRow[];
    criteria: { key: string, value: string }[];
} & ReturnType<typeof calculateMetrics>;


const getRrRange = (trade: Trade, appSettings: AppSettings): string => {
    if (!trade.stopLoss || trade.stopLoss === 0 || !appSettings.pairsConfig) return '0R';
    const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
    if (!pairInfo) return '0R';

    const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
    if (riskPips === 0) return '0R';

    const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
    if (riskAmount === 0) return '0R';
    
    const realizedR = trade.auto.pl / riskAmount;

    const roundedR = Math.round(realizedR);
    if (roundedR < -5) return '< -5R';
    if (roundedR > 10) return '> 10R';
    return `${roundedR}R`;
};

const getScoreRange = (score: number): string => {
    if (score >= 90) return 'A+ (90-100)';
    if (score >= 80) return 'A (80-89)';
    if (score >= 70) return 'B (70-79)';
    if (score >= 60) return 'C (60-69)';
    if (score >= 50) return 'D (50-59)';
    return 'F (< 50)';
};

const getLotSizeRange = (lot: number) => {
    if (lot <= 0.05) return 'Micro (<=0.05)';
    if (lot <= 0.1) return 'Mini (0.06-0.10)';
    if (lot <= 0.5) return 'Small (0.11-0.50)';
    if (lot <= 1.0) return 'Standard (0.51-1.00)';
    return 'Heavy (>1.00)';
};

const getPercentageRange = (percent: number) => {
    if (percent <= 0.5) return '0 - 0.5%';
    if (percent <= 1) return '0.51 - 1%';
    if (percent <= 2) return '1.01 - 2%';
    if (percent <= 5) return '2.01 - 5%';
    return '> 5%';
}

const getHoldingTimeRange = (minutes: number): string => {
    if (minutes < 5) return '< 5 min';
    if (minutes <= 15) return '5-15 min';
    if (minutes <= 30) return '15-30 min';
    if (minutes <= 60) return '30-60 min';
    if (minutes <= 240) return '1-4 hr';
    if (minutes <= 1440) return '4-24 hr';
    return '> 1 day';
}


export const getCriterionValue = (trade: Trade, criterion: string, analysisConfigs: AnalysisCategory[], appSettings: AppSettings): string | string[] => {
    
    if (criterion.startsWith('custom-')) {
        const customFieldId = criterion.replace('custom-', '');
        const value = trade.customStats?.[customFieldId];
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) return 'N/A';
        return Array.isArray(value) ? value.map(String) : String(value);
    }
    
    const analysisCat = analysisConfigs.find(c => c.title === criterion);
    if(analysisCat) {
        const values = new Set<string>();
        if (trade.analysisSelections) {
            Object.entries(trade.analysisSelections).forEach(([timeframe, selections]) => {
                analysisCat.subCategories.forEach(subCat => {
                    if (selections[subCat.id]) {
                        selections[subCat.id].forEach((item: any) => {
                            const optionId = typeof item === 'string' ? item : item.value;
                            const option = subCat.options.find(o => o.id === optionId);
                            if(option) {
                                const modifiersText = typeof item === 'object' && item !== null 
                                ? Object.entries(item).filter(([key]) => key !== 'value').map(([,modValue]) => modValue).join(', ')
                                : '';
                                values.add(`${timeframe}: ${option.value}${modifiersText ? ` (${modifiersText})` : ''}`);
                            }
                        });
                    }
                });
            });
        }
        return values.size > 0 ? Array.from(values) : 'N/A';
    }

    switch (criterion) {
        case 'Outcome': return trade.auto.outcome;
        case 'Result': return trade.auto.result;
        case 'Direction': return trade.direction;
        case 'Pair': return trade.pair;
        case 'Tag': return trade.tag || 'Untagged';
        case 'Month': return format(new Date(trade.openDate), 'MMMM');
        case 'Week of Month': return `Week ${getWeekOfMonth(new Date(trade.openDate + 'T00:00:00'))}`;
        case 'Day of Week': return format(new Date(trade.openDate + 'T00:00:00'), 'EEEE');
        case 'Day of Month': return String(new Date(trade.openDate + 'T00:00:00').getDate());
        case 'Hour of Day': return `${new Date(`${trade.openDate}T${trade.openTime}`).getHours()}:00`;
        case 'Session': return trade.auto.session;
        case 'IPDA Zone': return trade.auto.ipdaZone || 'N/A';
        case 'Strategy': return trade.strategy || 'Unspecified';
        case 'Setup': return trade.auto.matchedSetups && trade.auto.matchedSetups.length > 0 ? trade.auto.matchedSetups : 'No Setup';
        case 'News': return trade.newsEvents && trade.newsEvents.length > 0 ? trade.newsEvents.map(n => n.name) : 'No News';
        case 'Sentiments': {
            const sentiments = new Set<string>();
            if (trade.sentiment?.Before) trade.sentiment.Before.forEach(s => sentiments.add(s));
            if (trade.sentiment?.During) trade.sentiment.During.forEach(s => sentiments.add(s));
            if (trade.sentiment?.After) trade.sentiment.After.forEach(s => sentiments.add(s));
            return sentiments.size > 0 ? Array.from(sentiments) : 'N/A';
        }
        case 'Plan Adherence': return trade.auto.score.value >= 80 ? 'Compliant' : 'Non-Compliant';
        case 'RR': return getRrRange(trade, appSettings);
        case 'Score': return getScoreRange(trade.auto.score.value);
        case 'LotSize': return getLotSizeRange(trade.lotSize);
        case 'Risk %': return getPercentageRange(trade.auto.riskPercent);
        case 'Holding Time': return getHoldingTimeRange(trade.auto.durationMinutes);
        case 'Alignment': {
            const values = new Set<string>();
            const biasSubCat = analysisConfigs?.flatMap(c => c.subCategories).find(sc => sc.id === 'bias');
            if (trade.analysisSelections && biasSubCat) {
                Object.entries(trade.analysisSelections).forEach(([timeframe, selections]) => {
                    const biasSelection = selections['bias'];
                    if (biasSelection && biasSelection.length > 0) {
                        const option = biasSubCat.options.find(o => o.id === biasSelection[0]);
                        if (option) {
                            const biasValue = option.value;
                            const isAligned = (trade.direction === 'Buy' && biasValue === 'Bullish') || (trade.direction === 'Sell' && biasValue === 'Bearish');
                            values.add(`${timeframe}: ${isAligned ? 'Aligned' : 'Misaligned'}`);
                        }
                    }
                });
            }
            return values.size > 0 ? Array.from(values) : 'N/A';
        }
        default:
             return 'N/A';
    }
};

const calculateMetrics = (trades: Trade[], appSettings: AppSettings, capital: number) => {
    if (trades.length === 0) {
        return { 
            profit: 0, loss: 0, trades: 0, winRate: 0, totalR: 0, avgR: 0, profitFactor: 0, totalPl: 0, gainPercent: 0,
            expectancy: 0, avgPl: 0, avgWin: 0, avgLoss: 0, avgLotSize: 0, maxWinStreak: 0, maxLossStreak: 0, avgDuration: '0m', avgScore: 0,
            winCount: 0, lossCount: 0,
        };
    }
    const wins = trades.filter(t => t.auto.outcome === 'Win');
    const losses = trades.filter(t => t.auto.outcome === 'Loss');
    const grossProfit = wins.reduce((sum, t) => sum + t.auto.pl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.auto.pl, 0));
    const totalPl = grossProfit - grossLoss;
    const gainPercent = capital > 0 ? (totalPl / capital) * 100 : 0;
    const winRate = (wins.length / trades.length);
    const lossRate = (losses.length / trades.length);

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    let totalR = 0;
    trades.forEach(trade => {
        if (!appSettings) return;
        const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        if (trade.stopLoss && trade.stopLoss > 0 && pairInfo) {
            const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            if (riskAmount > 0) {
                totalR += trade.auto.pl / riskAmount;
            }
        }
    });

    let maxWinStreak = 0, maxLossStreak = 0, currentWin = 0, currentLoss = 0;
    trades.forEach(t => {
        if (t.auto.outcome === 'Win') { currentWin++; currentLoss = 0; }
        else if (t.auto.outcome === 'Loss') { currentLoss++; currentWin = 0; }
        else { currentWin = 0; currentLoss = 0; }
        maxWinStreak = Math.max(maxWinStreak, currentWin);
        maxLossStreak = Math.max(maxLossStreak, currentLoss);
    });

    const formatDuration = (minutes: number) => {
        if (minutes < 1) return '<1m';
        if (minutes < 60) return `${minutes.toFixed(0)}m`;
        return `${(minutes / 60).toFixed(1)}h`;
    }
    
    return {
        profit: grossProfit,
        loss: -grossLoss,
        trades: trades.length,
        winRate: winRate * 100,
        totalR,
        avgR: trades.length > 0 ? totalR / trades.length : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : Infinity,
        totalPl: totalPl,
        expectancy,
        avgPl: trades.length > 0 ? totalPl / trades.length : 0,
        avgLotSize: trades.reduce((sum, t) => sum + t.lotSize, 0) / trades.length,
        maxWinStreak,
        maxLossStreak,
        avgDuration: formatDuration(trades.reduce((sum, t) => sum + t.auto.durationMinutes, 0) / trades.length),
        avgScore: trades.reduce((sum, t) => sum + (t.auto.score?.value || 0), 0) / trades.length,
    };
};

const groupTradesRecursively = (trades: Trade[], criteria: string[], analysisConfigs: AnalysisCategory[], appSettings: AppSettings, capital: number, level = 0, parentCriteria: {key: string, value: string}[] = []): AnalysisRow[] => {
    if (criteria.length === 0) return [];
    
    const [currentCriterion, ...nextCriteria] = criteria;
    const grouped = trades.reduce((acc, trade) => {
        const value = getCriterionValue(trade, currentCriterion, analysisConfigs, appSettings);
        (Array.isArray(value) ? value : [value]).forEach(v => {
            if (!acc[v]) acc[v] = [];
            acc[v].push(trade);
        });
        return acc;
    }, {} as Record<string, Trade[]>);

    return Object.entries(grouped).map(([key, tradesInGroup]) => {
        const metrics = calculateMetrics(tradesInGroup, appSettings, capital);
        const currentCriteria = [...parentCriteria, { key: currentCriterion, value: key }];
        const subRows = nextCriteria.length > 0 ? groupTradesRecursively(tradesInGroup, nextCriteria, analysisConfigs, appSettings, capital, level + 1, currentCriteria) : [];
        return { key: `${level}-${key}`, level, label: key, ...metrics, criteria: currentCriteria, subRows };
    });
};


const SortableItem = ({ id, label, onRemove }: { id: string, label: string, onRemove: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-1.5 touch-none bg-background rounded-md border">
            <span {...attributes} {...listeners} className="cursor-grab p-1"><GripVertical className="h-4 w-4" /></span>
            <span className="flex-grow text-sm font-semibold">{label}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}><Trash2 className="h-3 w-3 text-destructive" /></Button>
        </div>
    );
}

const AnalysisTableRow = ({ row, expandedRows, onToggle, onViewTrades }: { row: AnalysisRow; expandedRows: Set<string>; onToggle: (key: string) => void; onViewTrades: (criteria: {key: string, value: string}[]) => void; }) => (
    <>
        <TableRow 
            className="hover:bg-muted/50 cursor-pointer"
            onClick={() => onViewTrades(row.criteria)}
        >
             <TableCell className="sticky left-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-1" style={{ paddingLeft: `${row.level * 1.5 + (row.subRows && row.subRows.length > 0 ? 0 : 1.5)}rem` }}>
                    {row.subRows && row.subRows.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); onToggle(row.key); }}>
                            {expandedRows.has(row.key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    )}
                    <span className="font-semibold">{row.label}</span>
                </div>
            </TableCell>
            <TableCell>{row.trades}</TableCell>
            <TableCell>{row.winRate.toFixed(1)}%</TableCell>
            <TableCell>{isFinite(row.profitFactor) ? row.profitFactor.toFixed(2) : '∞'}</TableCell>
            <TableCell className={cn(row.totalPl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={row.totalPl} /></TableCell>
            <TableCell className={cn(row.expectancy >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={row.expectancy} /></TableCell>
            <TableCell className={cn(row.avgR >= 0 ? 'text-green-500' : 'text-red-500')}>{row.avgR.toFixed(2)}</TableCell>
            <TableCell className={cn(row.totalR >= 0 ? 'text-green-500' : 'text-red-500')}>{row.totalR.toFixed(2)}</TableCell>
            <TableCell>{row.avgLotSize.toFixed(2)}</TableCell>
            <TableCell>{row.maxWinStreak}</TableCell>
            <TableCell>{row.maxLossStreak}</TableCell>
            <TableCell>{row.avgDuration}</TableCell>
            <TableCell>{row.avgScore.toFixed(1)}</TableCell>
        </TableRow>
        {row.subRows && expandedRows.has(row.key) && (
             row.subRows.map(subRow => (
                <AnalysisTableRow key={subRow.key} row={subRow} expandedRows={expandedRows} onToggle={onToggle} onViewTrades={onViewTrades} />
            ))
        )}
    </>
);


interface CustomReportBuilderProps {
  trades: Trade[];
}

const CustomReportBuilder = ({ trades }: CustomReportBuilderProps) => {
    const router = useRouter();
    const { appSettings, activeJournalId, journals } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const [ordering, setOrdering] = useState<string[]>(['Day of Week', 'Session']);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['overall']));

    const orderingCriteriaOptions = useMemo(() => {
        if (!appSettings) return [];
        const baseOptions = [
            { value: 'Day of Week', label: 'Day of Week' },
            { value: 'Month', label: 'Month' },
            { value: 'Session', label: 'Session' },
            { value: 'IPDA Zone', label: 'IPDA Zone' },
            { value: 'Pair', label: 'Pair' },
            { value: 'Direction', label: 'Direction' },
            { value: 'Result', label: 'Result' },
            { value: 'Outcome', label: 'Outcome' },
            { value: 'Strategy', label: 'Strategy' },
            { value: 'Tag', label: 'Tag' },
            { value: 'News', label: 'News Event' },
            { value: 'Sentiments', label: 'Sentiments' },
            { value: 'Plan Adherence', label: 'Plan Adherence' },
            { value: 'Setup', label: 'Matched Setups' },
            { value: 'RR', label: 'R-Multiple' },
            { value: 'Score', label: 'Discipline Score' },
            { value: 'LotSize', label: 'Lot Size' },
            { value: 'Risk %', label: 'Risk %' },
            { value: 'Holding Time', label: 'Holding Time' },
            { value: 'Alignment', label: 'Bias Alignment'}
        ];
        
        const analysisOptions = (appSettings.analysisConfigurations || []).map(cat => ({
            value: cat.title,
            label: `Analysis: ${cat.title}`
        }));

        const customFieldOptions = (appSettings.customFields || []).map(field => ({
            value: `custom-${field.id}`,
            label: `CF: ${field.title}`
        }));

        return [...baseOptions, ...analysisOptions, ...customFieldOptions];
    }, [appSettings]);
  
    const analysisData = useMemo(() => {
        if (!activeJournal || !appSettings) return null;
        const overallMetrics = calculateMetrics(trades, appSettings, activeJournal.capital);
        const topLevelRows = ordering.length > 0 ? groupTradesRecursively(trades, ordering, appSettings.analysisConfigurations, appSettings, activeJournal.capital) : [];
        return {
            key: 'overall',
            level: -1,
            label: 'Overall',
            ...overallMetrics,
            criteria: [],
            subRows: topLevelRows
        };
    }, [trades, ordering, appSettings, activeJournal]);

    const handleAddCriteria = (criteria: string) => {
        if(!ordering.includes(criteria)) {
            setOrdering(prev => [...prev, criteria]);
        }
    }
    
    const handleRemoveCriteria = (criteria: string) => {
        setOrdering(prev => prev.filter(c => c !== criteria));
    }
    
    const handleToggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOrdering((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleViewTrades = (criteria: {key: string, value: string}[]) => {
        const query = new URLSearchParams();
        const title = criteria.length > 0 ? criteria.map(c => c.value).join(' / ') : 'All Filtered Trades';
        query.set('title', title);
        query.set('criteria', JSON.stringify(criteria));
        
        const url = `/data/view?${query.toString()}`;
        window.open(url, '_blank');
    }
    
    const metricsColumns = [
        { key: 'trades', label: 'Trades' },
        { key: 'winRate', label: 'Win Rate' },
        { key: 'profitFactor', label: 'PF' },
        { key: 'totalPl', label: 'Total P/L' },
        { key: 'expectancy', label: 'Expectancy' },
        { key: 'avgR', label: 'Avg R' },
        { key: 'totalR', label: 'Sum R' },
        { key: 'avgLotSize', label: 'Avg Lot' },
        { key: 'maxWinStreak', label: 'W Streak' },
        { key: 'maxLossStreak', label: 'L Streak' },
        { key: 'avgDuration', label: 'Avg. Duration' },
        { key: 'avgScore', label: 'Avg. Score' },
    ];

    if (!analysisData || !activeJournal || !appSettings) {
        return (
            <Card className="glassmorphic"><CardContent><p className="p-4 text-center">Loading report data...</p></CardContent></Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6 sticky top-4">
                <Card className="glassmorphic">
                    <CardHeader className="p-4"><CardTitle className="text-base">Ordering Criteria</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 min-h-[100px]">
                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={ordering} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                {ordering.map((item, index) => (
                                    <div key={item} className="flex items-center">
                                         <span className="text-xs font-bold text-muted-foreground mr-2">{index + 1}.</span>
                                        <SortableItem 
                                            id={item} 
                                            label={orderingCriteriaOptions.find(o => o.value === item)?.label || item}
                                            onRemove={() => handleRemoveCriteria(item)}
                                        />
                                    </div>
                                ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </CardContent>
                </Card>
                <Card className="glassmorphic">
                    <CardHeader className="p-4"><CardTitle className="text-base">Add Grouping Criteria</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                         <div className="flex flex-wrap gap-2">
                            {orderingCriteriaOptions.map(opt => (
                                <Badge 
                                    key={opt.value}
                                    variant={ordering.includes(opt.value) ? 'default' : 'secondary'}
                                    onClick={() => handleAddCriteria(opt.value)}
                                    className="cursor-pointer"
                                >
                                    {opt.label}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3">
                 <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle>Pivot Table</CardTitle>
                        <CardDescription>Click on a row to see the filtered trades in a new tab.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background/90 backdrop-blur-sm z-10 w-48">Group</TableHead>
                                        {metricsColumns.map(m => <TableHead key={m.key} className="whitespace-nowrap">{m.label}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnalysisTableRow row={analysisData} expandedRows={expandedRows} onToggle={handleToggleRow} onViewTrades={handleViewTrades} />
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
    )
}

export default CustomReportBuilder;
