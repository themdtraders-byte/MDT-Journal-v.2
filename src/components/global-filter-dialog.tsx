
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar as CalendarIcon, Filter, Search, X, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, subDays, startOfDay, endOfDay, subWeeks, startOfWeek, endOfWeek, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { useJournalStore, type Filters, type Trade } from '@/hooks/use-journal-store';
import MultiSelect from './ui/multi-select';
import { MultiKeywordInput } from './ui/multi-keyword-input';
import { Switch } from './ui/switch';
import type { CustomField, AnalysisCategory } from '@/types';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getCriterionValue } from './custom-report-builder';

const initialFilterState: Filters = {
    keywords: [],
    dateRange: { from: undefined, to: undefined },
    dayOfWeek: [],
    dayOfMonth: [],
    month: [],
    timeRanges: [],
    pair: [],
    direction: [],
    status: [],
    outcome: [],
    result: [],
    strategy: [],
    session: [],
    ipdaZone: [],
    plRange: { min: '', max: '' },
    rrRange: { min: '', max: '' },
    scoreRange: { min: '', max: '' },
    lotSizeRange: { min: '', max: '' },
    riskPercentRange: { min: '', max: '' },
    gainPercentRange: { min: '', max: '' },
    holdingTimeRange: { min: '', max: '' },
    tag: [],
    news: [],
    sentiment: [],
    matchedSetups: [],
    custom: {},
    planAdherence: undefined,
    invert: false,
    analysis: {}
};

const datePresets: { label: string, preset: Preset }[] = [
    { label: 'Today', preset: 'today' },
    { label: 'Yesterday', preset: 'yesterday' },
    { label: 'This Week', preset: 'thisWeek' },
    { label: 'Last Week', preset: 'lastWeek' },
    { label: 'Last 30 Days', preset: 'last30' },
    { label: 'This Month', preset: 'thisMonth' },
    { label: 'Last Month', preset: 'lastMonth' },
    { label: 'This Year', preset: 'thisYear' },
    { label: 'Last Year', preset: 'lastYear' },
]

type Preset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

interface GlobalFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters?: Filters;
    onApplyFilters?: (filters: Filters) => void;
    onClearFilters?: () => void;
    isLocal?: boolean;
}


export default function GlobalFilterDialog({ 
    open, onOpenChange, 
    filters: propFilters, 
    onApplyFilters: propOnApply, 
    onClearFilters: propOnClear,
    isLocal = false
}: GlobalFilterDialogProps) {
    const { 
        applyFilters: globalApplyFilters, 
        clearFilters: globalClearFilters, 
        filters: globalFilters,
        journals,
        activeJournalId,
        appSettings
    } = useJournalStore();
    
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const allTrades = useMemo(() => activeJournal?.trades || [], [activeJournal]);

    const initialLocalState = useMemo(() => {
        const base = isLocal ? (propFilters || initialFilterState) : globalFilters;
        return { ...initialFilterState, ...base };
    }, [isLocal, propFilters, globalFilters]);

    const [localFilters, setLocalFilters] = useState<Filters>(initialLocalState);

     useEffect(() => {
        if (open) {
            const initialSyncState = isLocal ? (propFilters || initialFilterState) : globalFilters;
            setLocalFilters({ ...initialFilterState, ...initialSyncState });
        }
    }, [open, globalFilters, propFilters, isLocal]);

    const dynamicOptions = useMemo(() => {
        if (!allTrades || !activeJournal) return {
            pairs: [], strategies: [], setups: [], sessions: [], sentiments: [], tags: [], news: [],
            results: [], outcomes: [], statuses: [], directions: [], ipdaZones: []
        };
        const trades = allTrades;
        
        const createOptions = (values: (string | boolean | undefined)[]) => [...new Set(values.filter(v => v !== undefined && v !== null && v !== '').map(String))].map(val => ({ value: val, label: val }));

        return {
            pairs: createOptions(trades.map(t => t.pair)),
            strategies: createOptions(trades.map(t => t.strategy || '')),
            setups: createOptions(trades.flatMap(t => t.auto.matchedSetups || [])),
            sessions: createOptions(trades.map(t => t.auto.session)),
            sentiments: createOptions(trades.flatMap(t => [...(t.sentiment?.Before || []), ...(t.sentiment?.During || []), ...(t.sentiment?.After || [])])),
            tags: createOptions(trades.map(t => t.tag || '')),
            news: createOptions(trades.flatMap(t => t.newsEvents?.map(n => n.name) || [])),
            results: createOptions(trades.map(t => t.auto.result)),
            outcomes: createOptions(trades.map(t => t.auto.outcome)),
            statuses: createOptions(trades.map(t => t.auto.status)),
            directions: createOptions(trades.map(t => t.direction)),
            ipdaZones: createOptions(trades.map(t => t.auto.ipdaZone)),
        };
    }, [allTrades, activeJournal]);

    const dynamicAnalysisOptions = useMemo(() => {
        if (!allTrades || !appSettings.analysisConfigurations) return {};

        const groupedOptions: Record<string, { id: string; label: string }[]> = {};

        allTrades.forEach(trade => {
            if (trade.analysisSelections) {
                Object.entries(trade.analysisSelections).forEach(([timeframe, selections]) => {
                    Object.entries(selections).forEach(([subCatId, options]) => {
                        const subCatDef = appSettings.analysisConfigurations
                            .flatMap(c => c.subCategories)
                            .find(sc => sc.id === subCatId);
                        
                        if (subCatDef) {
                            if (!groupedOptions[subCatDef.title]) {
                                groupedOptions[subCatDef.title] = [];
                            }
                            (options as any[]).forEach(item => {
                                const optionId = typeof item === 'string' ? item : item.value;
                                const optionDef = subCatDef.options.find(o => o.id === optionId);
                                if (optionDef) {
                                    const modifiersText = typeof item === 'object' && item !== null
                                        ? Object.entries(item).filter(([key]) => key !== 'value').map(([, modValue]) => modValue).join(', ')
                                        : '';
                                    const fullLabel = `${timeframe}: ${optionDef.value}${modifiersText ? ` (${modifiersText})` : ''}`;
                                    const uniqueId = `${subCatId}|${timeframe}|${optionDef.id}${modifiersText ? `|${modifiersText}` : ''}`;
                                    
                                    if (!groupedOptions[subCatDef.title].some(o => o.id === uniqueId)) {
                                        groupedOptions[subCatDef.title].push({ id: uniqueId, label: fullLabel });
                                    }
                                }
                            });
                        }
                    });
                });
            }
        });
        return groupedOptions;
    }, [allTrades, appSettings.analysisConfigurations]);
    
    const matchingTradesCount = useMemo(() => {
        if (!allTrades || !appSettings.analysisConfigurations) return 0;
        return allTrades.filter(trade => {
            const {
                keywords, dateRange, dayOfWeek, month, dayOfMonth, timeRanges, pair, direction, status, outcome, result,
                strategy, session, ipdaZone, plRange, rrRange, scoreRange, lotSizeRange, riskPercentRange, gainPercentRange, holdingTimeRange,
                tag, news, sentiment, matchedSetups, custom, planAdherence, invert, analysis,
            } = localFilters;

            let isMatch = true;

             const checkRange = (value: number, range: { min: string, max: string }) => {
                const min = parseFloat(range.min);
                const max = parseFloat(range.max);
                if (!isNaN(min) && value < min) return false;
                if (!isNaN(max) && value > max) return false;
                return true;
            };

            if (isMatch && keywords.length > 0) {
                const searchableText = [
                    trade.pair, trade.direction, trade.strategy, trade.tag,
                    trade.lotSize, trade.entryPrice, trade.closingPrice, trade.stopLoss, trade.takeProfit,
                    trade.auto.pl, trade.auto.pips, trade.auto.rr, trade.auto.score.value,
                    ...(Array.isArray(trade.note) ? trade.note.flatMap(n => [n.title, n.content]) : [trade.note]),
                    ...(trade.sentiment?.Before || []),
                    ...(trade.sentiment?.During || []),
                    ...(trade.sentiment?.After || []),
                    ...(trade.newsEvents || []).map(n => n.name),
                ].join(' ').toLowerCase();
                if (!keywords.every(kw => searchableText.includes(kw.toLowerCase()))) isMatch = false;
            }
            
            if (isMatch && (dateRange.from || dateRange.to)) {
                const openDateTime = new Date(`${trade.openDate}T${trade.openTime}`);
                if (dateRange.from && openDateTime < dateRange.from) isMatch = false;
                if (isMatch && dateRange.to && openDateTime > dateRange.to) isMatch = false;
            }
            if (isMatch && dayOfWeek.length > 0 && !dayOfWeek.includes(format(new Date(trade.openDate + 'T00:00:00'), 'EEEE'))) isMatch = false;
            if (isMatch && month.length > 0 && !month.includes(format(new Date(trade.openDate + 'T00:00:00'), 'MMMM'))) isMatch = false;
            
            const simpleMultiSelects: (keyof Filters)[] = [
                'pair', 'direction', 'status', 'outcome', 'result', 
                'strategy', 'session', 'ipdaZone', 'tag'
            ];
            for (const key of simpleMultiSelects) {
                 const filterValues = localFilters[key] as string[] | undefined;
                if (isMatch && filterValues && filterValues.length > 0) {
                    const tradeValue = key.includes('.') 
                        ? (trade.auto as any)[key.split('.')[1]] 
                        : (trade as any)[key];
                    if (tradeValue === undefined || tradeValue === null || !filterValues.includes(String(tradeValue))) {
                        isMatch = false;
                    }
                }
            }

            return invert ? !isMatch : isMatch;
        }).length;
    }, [localFilters, allTrades, appSettings.analysisConfigurations]);


    const handleApply = () => {
        if (isLocal && propOnApply) {
            propOnApply(localFilters);
        } else {
            globalApplyFilters(localFilters);
        }
        onOpenChange(false);
    };

    const handleClear = () => {
        setLocalFilters(initialFilterState);
        if (isLocal && propOnClear) {
            propOnClear();
        } else {
            globalClearFilters();
        }
        onOpenChange(false);
    }
    
    const handleRangeChange = (field: 'plRange' | 'rrRange' | 'scoreRange' | 'lotSizeRange' | 'riskPercentRange' | 'gainPercentRange' | 'holdingTimeRange', subField: 'min' | 'max', value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            [field]: {
                ...(prev[field] as object),
                [subField]: value
            }
        }))
    }
    
    const handleDatePreset = (preset: Preset) => {
        const now = new Date();
        let from: Date;
        let to: Date = endOfDay(now);
    
        switch (preset) {
            case 'today': from = startOfDay(now); break;
            case 'yesterday': from = startOfDay(subDays(now, 1)); to = endOfDay(subDays(now, 1)); break;
            case 'thisWeek': from = startOfWeek(now, { weekStartsOn: 1 }); break;
            case 'lastWeek': from = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); to = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }); break;
            case 'last30': from = startOfDay(subDays(now, 29)); break;
            case 'thisMonth': from = startOfMonth(now); break;
            case 'lastMonth': from = startOfMonth(subMonths(now, 1)); to = endOfMonth(subMonths(now, 1)); break;
            case 'thisYear': from = startOfYear(now); break;
            case 'lastYear': from = startOfYear(subDays(now, 365)); to = endOfYear(subDays(now, 365)); break;
            default: from = now;
        }
        setLocalFilters(prev => ({ ...prev, dateRange: { from, to } }));
    };
    
    const handleHourToggle = (hour: number) => {
        const fromTime = `${String(hour).padStart(2,'0')}:00`;
        const toTime = `${String(hour).padStart(2, '0')}:59`;
        
        setLocalFilters(prev => {
            const existingRanges = prev.timeRanges || [];
            const isSelected = existingRanges.some(r => r.from === fromTime);
            
            if (isSelected) {
                return { ...prev, timeRanges: existingRanges.filter(r => r.from !== fromTime) };
            } else {
                return { ...prev, timeRanges: [...existingRanges, { from: fromTime, to: toTime }] };
            }
        });
    }

    const handleRemoveFilter = (key: keyof Filters, valueToRemove?: any, subKey?: string) => {
        setLocalFilters(prev => {
            const newFilters = { ...prev };
            const currentValue = newFilters[key];

            if (key === 'dateRange' || ['plRange', 'rrRange', 'scoreRange', 'lotSizeRange', 'riskPercentRange', 'gainPercentRange', 'holdingTimeRange'].includes(key)) {
                (newFilters as any)[key] = initialFilterState[key];
            } else if (key === 'timeRanges') {
                 newFilters.timeRanges = (newFilters.timeRanges || []).filter(range => range.from !== valueToRemove.from);
            } else if (Array.isArray(currentValue)) {
                (newFilters as any)[key] = currentValue.filter(v => v !== valueToRemove);
            } else if (key === 'custom' && subKey) {
                const customFilters = { ...(newFilters.custom || {}) };
                if(customFilters[subKey]) {
                    customFilters[subKey] = customFilters[subKey].filter(v => v !== valueToRemove);
                     if(customFilters[subKey].length === 0) {
                        delete customFilters[subKey];
                    }
                }
                newFilters.custom = customFilters;
            } else if (key === 'analysis' && subKey) {
                const analysisFilters = { ...(newFilters.analysis || {}) };
                 if(analysisFilters[subKey]) {
                    analysisFilters[subKey] = analysisFilters[subKey].filter(v => v !== valueToRemove);
                     if(analysisFilters[subKey].length === 0) {
                        delete analysisFilters[subKey];
                    }
                }
                newFilters.analysis = analysisFilters;
            }

            return newFilters;
        });
    };

    const handleMultiSelectChange = (field: keyof Filters, values: string[]) => {
        setLocalFilters(prev => ({ ...prev, [field]: values } as Filters));
    }
    
    const handleCustomFieldChange = (fieldId: string, values: string[]) => {
        setLocalFilters(prev => ({
            ...prev,
            custom: {
                ...(prev.custom || {}),
                [fieldId]: values
            }
        }));
    }
    
    const handleAnalysisFieldChange = (subCatTitle: string, values: string[]) => {
        setLocalFilters(prev => ({
            ...prev,
            analysis: {
                ...(prev.analysis || {}),
                [subCatTitle]: values,
            }
        }));
    }

    const isHourSelected = (hour: number) => {
        const fromTime = `${String(hour).padStart(2,'0')}:00`;
        return (localFilters.timeRanges || []).some(r => r.from === fromTime);
    }
    
    const dayOfWeekOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => ({ value: d, label: d }));
    const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => ({ value: m, label: m }));

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col p-4">
            <DialogHeader className="p-2">
                <DialogTitle className="flex items-center gap-2 text-base">
                    <Filter /> {isLocal ? 'Local Filter' : 'Global Trade Filter'}
                </DialogTitle>
            </DialogHeader>
            <div className="py-2 flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col min-h-0">
                    <div className="px-2 pb-2">
                        <MultiKeywordInput
                            placeholder="Search by keywords and press Enter..."
                            value={localFilters.keywords || []}
                            onChange={(v) => setLocalFilters(prev => ({...prev, keywords: v}))}
                        />
                         <div className="flex items-center space-x-2 pt-2">
                            <Switch 
                                id="invert-filter" 
                                checked={localFilters.invert}
                                onCheckedChange={(checked) => setLocalFilters(prev => ({...prev, invert: checked}))}
                            />
                            <Label htmlFor="invert-filter">Invert Filter (show trades that DON'T match)</Label>
                        </div>
                    </div>
                    <Tabs defaultValue="date" className="w-full flex-1 flex flex-col min-h-0">
                        <TabsList>
                            <TabsTrigger value="date">Date & Time</TabsTrigger>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                            <TabsTrigger value="technicals">Technicals</TabsTrigger>
                            <TabsTrigger value="custom">Custom</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="flex-1 mt-2">
                            <TabsContent value="date" className="p-1 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Date Range</Label>
                                    <div className="flex gap-2">
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9 text-xs", !localFilters.dateRange && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    {localFilters.dateRange?.from ? (localFilters.dateRange.to ? (<>{format(localFilters.dateRange.from, "LLL dd, y")} - {format(localFilters.dateRange.to, "LLL dd, y")}</>) : (format(localFilters.dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar initialFocus mode="range" defaultMonth={localFilters.dateRange?.from} selected={localFilters.dateRange as any} onSelect={(range) => setLocalFilters(prev => ({...prev, dateRange: range as any}))} numberOfMonths={1} />
                                            </PopoverContent>
                                        </Popover>
                                        <Popover>
                                            <PopoverTrigger asChild><Button variant="ghost" size="sm">Presets</Button></PopoverTrigger>
                                            <PopoverContent className="w-40 p-1">
                                                 {datePresets.map(preset => (<Button key={preset.label} variant="ghost" size="sm" className="w-full justify-start h-7 text-xs" onClick={() => handleDatePreset(preset.preset)}>{preset.label}</Button>))}
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Specific Dates & Sessions</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <MultiSelect options={dayOfWeekOptions} selectedValues={localFilters.dayOfWeek || []} onValueChange={(v) => handleMultiSelectChange('dayOfWeek', v)} placeholder="Day of Week" />
                                        <MultiSelect options={monthOptions} selectedValues={localFilters.month || []} onValueChange={(v) => handleMultiSelectChange('month', v)} placeholder="Month" />
                                        <MultiSelect options={dynamicOptions.sessions} selectedValues={localFilters.session || []} onValueChange={(v) => handleMultiSelectChange('session', v)} placeholder="NY Time Session"/>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Time Range (Select one or more hours to include)</Label>
                                     <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 pt-2">
                                        {Array.from({length: 24}).map((_, hour) => {
                                            return (
                                                <Button key={hour} size="xs" variant={isHourSelected(hour) ? 'default' : 'outline'} onClick={() => handleHourToggle(hour)} className="h-auto py-1 px-1.5 font-mono text-[10px]">
                                                    {`${String(hour).padStart(2, '0')}:00`}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="details" className="p-2 grid grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                                <div className="space-y-1"><Label className="text-xs">Pair</Label><MultiSelect options={dynamicOptions.pairs} selectedValues={localFilters.pair || []} onValueChange={(v) => handleMultiSelectChange('pair', v)} placeholder="Any Pair" /></div>
                                <div className="space-y-1"><Label className="text-xs">Direction</Label><MultiSelect options={dynamicOptions.directions} selectedValues={localFilters.direction || []} onValueChange={(v) => handleMultiSelectChange('direction', v)} placeholder="Any Direction" /></div>
                                <div className="space-y-1"><Label className="text-xs">Strategy</Label><MultiSelect options={dynamicOptions.strategies} selectedValues={localFilters.strategy || []} onValueChange={(v) => handleMultiSelectChange('strategy', v)} placeholder="Any Strategy" /></div>
                                <div className="space-y-1"><Label className="text-xs">Setup</Label><MultiSelect options={dynamicOptions.setups} selectedValues={localFilters.matchedSetups || []} onValueChange={v => handleMultiSelectChange('matchedSetups', v)} placeholder="Any Setup"/></div>
                                <div className="space-y-1"><Label className="text-xs">Tag</Label><MultiSelect options={dynamicOptions.tags} selectedValues={localFilters.tag || []} onValueChange={(v) => handleMultiSelectChange('tag', v)} placeholder="Any Tag" /></div>
                                <div className="space-y-1"><Label className="text-xs">News Event</Label><MultiSelect options={dynamicOptions.news} selectedValues={localFilters.news || []} onValueChange={v => handleMultiSelectChange('news', v)} placeholder="Any News Event"/></div>
                                <div className="space-y-1"><Label className="text-xs">IPDA Zone</Label><MultiSelect options={dynamicOptions.ipdaZones} selectedValues={localFilters.ipdaZone || []} onValueChange={v => handleMultiSelectChange('ipdaZone', v)} placeholder="Any IPDA Zone"/></div>
                            </TabsContent>
                            <TabsContent value="performance" className="p-2 grid grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                                <div className="space-y-1"><Label className="text-xs">Outcome</Label><MultiSelect options={dynamicOptions.outcomes} selectedValues={localFilters.outcome || []} onValueChange={(v) => handleMultiSelectChange('outcome', v as any)} placeholder="Any Outcome" /></div>
                                <div className="space-y-1"><Label className="text-xs">Result</Label><MultiSelect options={dynamicOptions.results} selectedValues={localFilters.result || []} onValueChange={(v) => handleMultiSelectChange('result', v)} placeholder="Any Result" /></div>
                                <div className="space-y-1"><Label className="text-xs">Status</Label><MultiSelect options={dynamicOptions.statuses} selectedValues={localFilters.status || []} onValueChange={(v) => handleMultiSelectChange('status', v)} placeholder="Any Status" /></div>
                                <div className="space-y-1"><Label className="text-xs">P/L Range ($)</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.plRange?.min} onChange={(e) => handleRangeChange('plRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.plRange?.max} onChange={(e) => handleRangeChange('plRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">R:R Range</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.rrRange?.min} onChange={(e) => handleRangeChange('rrRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.rrRange?.max} onChange={(e) => handleRangeChange('rrRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">Score Range</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min (0)" min="0" max="100" value={localFilters.scoreRange?.min} onChange={(e) => handleRangeChange('scoreRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max (100)" min="0" max="100" value={localFilters.scoreRange?.max} onChange={(e) => handleRangeChange('scoreRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">Lot Size Range</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.lotSizeRange?.min} onChange={(e) => handleRangeChange('lotSizeRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.lotSizeRange?.max} onChange={(e) => handleRangeChange('lotSizeRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">Risk % Range</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.riskPercentRange?.min} onChange={(e) => handleRangeChange('riskPercentRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.riskPercentRange?.max} onChange={(e) => handleRangeChange('riskPercentRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">Gain % Range</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.gainPercentRange?.min} onChange={(e) => handleRangeChange('gainPercentRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.gainPercentRange?.max} onChange={(e) => handleRangeChange('gainPercentRange', 'max', e.target.value)} /></div></div>
                                <div className="space-y-1"><Label className="text-xs">Holding Time (minutes)</Label><div className="flex gap-2"><Input className="h-8 text-xs" type="number" placeholder="Min" value={localFilters.holdingTimeRange?.min} onChange={(e) => handleRangeChange('holdingTimeRange', 'min', e.target.value)} /><Input className="h-8 text-xs" type="number" placeholder="Max" value={localFilters.holdingTimeRange?.max} onChange={(e) => handleRangeChange('holdingTimeRange', 'max', e.target.value)} /></div></div>
                            </TabsContent>
                             <TabsContent value="technicals" className="p-2 grid grid-cols-1 gap-4 items-start">
                                {Object.entries(dynamicAnalysisOptions).map(([title, options]) => (
                                    <div key={title} className="space-y-1">
                                        <Label className="text-xs font-semibold">{title}</Label>
                                        <MultiSelect
                                            options={options.map(opt => ({ value: opt.id, label: opt.label }))}
                                            selectedValues={localFilters.analysis?.[title] || []}
                                            onValueChange={(v) => handleAnalysisFieldChange(title, v)}
                                            placeholder={`Any ${title}`}
                                        />
                                    </div>
                                ))}
                            </TabsContent>
                            <TabsContent value="custom" className="p-2 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                                <div className="space-y-1"><Label className="text-xs">Plan Adherence</Label><ToggleGroup type="single" value={localFilters.planAdherence || ''} onValueChange={(v) => setLocalFilters(prev => ({...prev, planAdherence: v as any}))} className="w-full grid grid-cols-3"><ToggleGroupItem value="Compliant">Compliant</ToggleGroupItem><ToggleGroupItem value="Non-Compliant">Non-Compliant</ToggleGroupItem><ToggleGroupItem value="">Any</ToggleGroupItem></ToggleGroup></div>
                                {(appSettings.customFields || []).map((field: CustomField) => {
                                    if (field.type !== 'List' && field.type !== 'Button') return null;
                                    return (
                                        <div key={field.id} className="space-y-1">
                                            <Label className="text-xs">{field.title}</Label>
                                            <MultiSelect
                                                options={(field.options || []).map(opt => ({ value: opt.value, label: opt.value }))}
                                                selectedValues={localFilters.custom?.[field.id] || []}
                                                onValueChange={v => handleCustomFieldChange(field.id, v)}
                                                placeholder={`Any ${field.title}`}
                                            />
                                        </div>
                                    )
                                })}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
                <div className="md:col-span-1 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col bg-muted/30">
                        <CardHeader className="p-2">
                             <CardTitle className="text-base text-center">
                                Active Filters ({Object.values(localFilters).flat().length - (localFilters.invert ? 0 : 1)})
                            </CardTitle>
                             <div className="text-center text-sm font-semibold text-muted-foreground">
                                Matching Trades: {matchingTradesCount} of {allTrades.length}
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 flex-1 min-h-0 overflow-y-auto">
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(localFilters).flatMap(([key, value]) => {
                                    if (!value || (Array.isArray(value) && value.length === 0)) return [];
                                    
                                    const getLabel = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    
                                    const renderBadge = (label: string, onRemove: () => void) => (
                                        <Badge key={label} variant="secondary" className="pl-2 pr-1">
                                            {label}
                                            <button onClick={onRemove} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive"><X className="h-3 w-3" /></button>
                                        </Badge>
                                    );

                                    if (key === 'dateRange' && (value as Filters['dateRange']).from) {
                                        const {from, to} = value as Filters['dateRange'];
                                        const label = `${format(from!, 'PP')} - ${to ? format(to, 'PP') : '...'}`;
                                        return [renderBadge(label, () => handleRemoveFilter('dateRange'))];
                                    }
                                     if (key === 'timeRanges' && Array.isArray(value) && value.length > 0) {
                                        return value.map(v => renderBadge(`Time: ${v.from}`, () => handleRemoveFilter('timeRanges', v)));
                                    }
                                    if (['plRange', 'rrRange', 'scoreRange', 'lotSizeRange', 'riskPercentRange', 'gainPercentRange', 'holdingTimeRange'].includes(key)) {
                                       const range = value as Filters['plRange'];
                                       if(range.min || range.max) {
                                            const label = `${getLabel(key)}: ${range.min || '...'} to ${range.max || '...'}`;
                                            return [renderBadge(label, () => handleRemoveFilter(key as keyof Filters))];
                                       }
                                    }
                                    if (Array.isArray(value) && value.length > 0) {
                                        return value.map(v => renderBadge(`${getLabel(key)}: ${v}`, () => handleRemoveFilter(key as keyof Filters, v)));
                                    }
                                    
                                    return [];

                                }).filter(Boolean)}
                                {localFilters.invert && renderBadge("Inverted", () => setLocalFilters(prev => ({ ...prev, invert: false })))}
                                {!Object.values(localFilters).some(v => v && (Array.isArray(v) ? v.length > 0 : (typeof v === 'object' ? Object.values(v).some(sub => sub && (Array.isArray(sub) ? sub.length > 0 : (sub.min || sub.max))) : v && v !== false) )) && (
                                    <p className="text-xs text-muted-foreground text-center w-full">No filters applied.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DialogFooter className="p-2 flex items-center justify-between w-full">
                <div></div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClear}><X className="mr-2"/> Clear Filters</Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleApply} size="sm">Apply Filters</Button>
                </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}
