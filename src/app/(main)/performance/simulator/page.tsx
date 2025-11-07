
'use client';

import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJournalStore } from '@/hooks/use-journal-store';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Line, Bar, Cell } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Calendar as CalendarIcon, Search, X, RefreshCw, Filter } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import type { Trade, StrategyRule, Strategy, AnalysisCategory, AnalysisOption, RuleCombination, Setup, Filters } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pairsConfig } from '@/lib/data';
import RuleBuilder from '@/components/rule-builder';
import type { RuleBuilderHandle } from '@/components/rule-builder';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import EquityCurveChart from '@/components/charts/equity-curve';
import { ChartConfig } from '@/components/ui/chart';
import { Beaker, ListFilter, Activity, BarChart, Brain, Clock, ShieldCheck, Target } from '@/components/icons';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import MultiSelect from '@/components/ui/multi-select';
import FormattedNumber from '@/components/ui/formatted-number';
import { calculateGroupMetrics } from '@/lib/analytics';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import GlobalFilterDialog from '@/components/global-filter-dialog';
import { getCriterionValue } from '@/components/custom-report-builder';

const BAR_COLORS = ["#87CEEB", "#22C55E", "#EF4444", "#FBBF24", "#EC4899", "#F97316", "#8B5CF6", "#14B8A6", "#6366F1", "#84CC16"];

const initialFilterState: Filters = {
    keywords: [],
    dateRange: { from: undefined, to: undefined },
    dayOfWeek: [],
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


type SimulationResult = {
    paths: { trade: number; balance: number }[][];
    avgFinalBalance: number;
    maxFinalBalance: number;
    minFinalBalance: number;
    probabilityOfProfit: number;
    probabilityOfRuin: number;
    avgMaxWinStreak: number;
    avgMaxLossStreak: number;
    overallMinBalance: number;
    overallMaxBalance: number;
    projectedEndDate: Date;
};

const monteCarloSchema = z.object({
    startingBalance: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Must be > 0" }),
    winRate: z.string().refine(val => { const n = parseFloat(val); return !isNaN(n) && n >= 0 && n <= 100 }, { message: "0-100" }),
    avgWinR: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Must be > 0" }),
    avgLossR: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Must be > 0" }),
    riskPerTrade: z.string().refine(val => { const n = parseFloat(val); return !isNaN(n) && n > 0 && n <= 100 }, { message: "0-100" }),
    numTrades: z.string().refine(val => { const n = parseInt(val); return !isNaN(n) && n > 0 && n <= 5000 }, { message: "1-5000" }),
    numSimulations: z.string().refine(val => { const n = parseInt(val); return !isNaN(n) && n > 0 && n <= 1000 }, { message: "1-1000" }),
    avgHoldingTime: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Must be >= 0" }),
    avgGapTime: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Must be >= 0" }),
    selectedStrategyId: z.string().optional(),
});
type MonteCarloFormValues = z.infer<typeof monteCarloSchema>;

const StatRow = ({ label, value, valueClass }: { label: string, value: React.ReactNode, valueClass?: string }) => (
    <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span >
        <span className={cn("font-semibold", valueClass)}>{value}</span>
    </div>
);


const MonteCarloSimulator = () => {
    const { journals, activeJournalId, appSettings, filters: globalFilters } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const allTrades = useMemo(() => activeJournal?.trades || [], [activeJournal]);

    const filteredTrades = useMemo(() => {
        if (!activeJournal) return [];
        if (!globalFilters || Object.values(globalFilters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
            return allTrades;
        }
        return allTrades.filter(trade => {
            if (globalFilters.pair && globalFilters.pair.length > 0 && !globalFilters.pair.includes(trade.pair)) {
                return false;
            }
             if (globalFilters.direction && globalFilters.direction.length > 0 && !globalFilters.direction.includes(trade.direction)) {
                return false;
            }
            return true;
        });
    }, [allTrades, globalFilters, activeJournal]);

    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<Filters>(initialFilterState);

    const simulatorTrades = useMemo(() => {
        if (!activeJournal || !filteredTrades || !appSettings || !appSettings.analysisConfigurations) return [];
        const {
            keywords, dateRange, dayOfWeek, month, timeRanges, pair, direction, status, outcome, result,
            strategy, session, ipdaZone, plRange, rrRange, scoreRange, lotSizeRange, riskPercentRange, gainPercentRange, holdingTimeRange,
            tag, news, sentiment, matchedSetups, custom, planAdherence, invert, analysis,
        } = localFilters;

        if (Object.values(localFilters).every(val => !val || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && Object.keys(val).length === 0))) {
            return filteredTrades;
        }

        return filteredTrades.filter(trade => {
            let isMatch = true;

             const checkRange = (value: number, range: { min: string, max: string }) => {
                const min = parseFloat(range.min);
                const max = parseFloat(range.max);
                if (!isNaN(min) && value < min) return false;
                if (!isNaN(max) && value > max) return false;
                return true;
            };

            if (isMatch && keywords.length > 0) {
                const searchableText = [trade.pair, trade.direction, trade.strategy, trade.tag, ...(Array.isArray(trade.note) ? trade.note.flatMap(n => [n.title, n.content]) : [trade.note])].join(' ').toLowerCase();
                if (!keywords.every(kw => searchableText.includes(kw.toLowerCase()))) isMatch = false;
            }
            if (isMatch && (dateRange.from || dateRange.to)) {
                const openDateTime = new Date(`${trade.openDate}T${trade.openTime}`);
                if (dateRange.from && openDateTime < dateRange.from) isMatch = false;
                if (isMatch && dateRange.to && openDateTime > dateRange.to) isMatch = false;
            }
            if (isMatch && !checkRange(trade.auto.pl, plRange)) isMatch = false;
            
            const simpleMultiSelects: {key: keyof Filters, tradeKey: string}[] = [
                { key: 'pair', tradeKey: 'pair' }, { key: 'direction', tradeKey: 'direction' }, { key: 'status', tradeKey: 'auto.status' },
                { key: 'outcome', tradeKey: 'auto.outcome' }, { key: 'result', tradeKey: 'auto.result' }, { key: 'strategy', tradeKey: 'strategy' },
                { key: 'session', tradeKey: 'auto.session' }, { key: 'tag', tradeKey: 'tag' }
            ];
            for (const { key, tradeKey } of simpleMultiSelects) {
                if (isMatch && localFilters[key] && localFilters[key]!.length > 0) {
                    const tradeValue = tradeKey.includes('.') ? (trade.auto as any)[tradeKey.split('.')[1]] : (trade as any)[tradeKey];
                    if (!localFilters[key]!.includes(tradeValue)) isMatch = false;
                }
            }

            return invert ? !isMatch : isMatch;
        });

    }, [filteredTrades, localFilters, appSettings, activeJournal]);


    const defaultValues = useMemo(() => {
        const tradesToUse = simulatorTrades;
        if (!activeJournal || !tradesToUse || tradesToUse.length < 5 || !appSettings) {
            return {
                startingBalance: String(parseFloat((activeJournal?.balance || 10000).toFixed(2))),
                winRate: '50.00',
                avgWinR: '1.5',
                avgLossR: '1.0',
                riskPerTrade: '1.00',
                numTrades: '250',
                numSimulations: '100',
                avgHoldingTime: '240', // 4 hours
                avgGapTime: '180', // 3 hours
                selectedStrategyId: 'all'
            };
        }
        
        const metrics = calculateGroupMetrics(tradesToUse, appSettings, activeJournal.initialDeposit);
        
        const sortedTrades = [...tradesToUse].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        let totalGapMinutes = 0;
        for (let i = 1; i < sortedTrades.length; i++) {
             const prevClose = new Date(`${sortedTrades[i - 1].closeDate}T${sortedTrades[i - 1].closeTime}`);
             const currentOpen = new Date(`${sortedTrades[i].openDate}T${sortedTrades[i].openTime}`);
             totalGapMinutes += differenceInMinutes(currentOpen, prevClose);
        }
        const avgGapTime = sortedTrades.length > 1 ? totalGapMinutes / (sortedTrades.length - 1) : 180;

        return {
            startingBalance: String(parseFloat(activeJournal.balance.toFixed(2))),
            winRate: metrics.winRate.toFixed(2),
            avgWinR: (metrics.avgWin > 0 && metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 1.5).toFixed(2),
            avgLossR: '1.00',
            riskPerTrade: '1.00',
            numTrades: '250',
            numSimulations: '100',
            avgHoldingTime: (metrics.avgDuration || '240').replace(/[^0-9.]/g, ''),
            avgGapTime: avgGapTime.toFixed(0),
            selectedStrategyId: 'all'
        };
    }, [activeJournal, simulatorTrades, appSettings]);

    const form = useForm<MonteCarloFormValues>({ resolver: zodResolver(monteCarloSchema), defaultValues });
    
    useEffect(() => { form.reset(defaultValues); }, [defaultValues, form]);

    const runSimulation = (data: MonteCarloFormValues) => {
        const numericData = {
            startingBalance: parseFloat(data.startingBalance),
            winRate: parseFloat(data.winRate) / 100,
            avgWinR: parseFloat(data.avgWinR),
            avgLossR: parseFloat(data.avgLossR),
            riskPerTrade: parseFloat(data.riskPerTrade) / 100,
            numTrades: parseInt(data.numTrades),
            numSimulations: parseInt(data.numSimulations),
            avgHoldingTime: parseFloat(data.avgHoldingTime),
            avgGapTime: parseFloat(data.avgGapTime),
        };

        const allPaths: { trade: number; balance: number }[][] = [];
        let finalBalances: number[] = [];
        let allMaxWinStreaks: number[] = [];
        let allMaxLossStreaks: number[] = [];
        let ruinedCount = 0;
        let overallMinBalance = numericData.startingBalance;
        let overallMaxBalance = numericData.startingBalance;
        let totalMinutesSimulated = 0;

        for (let i = 0; i < numericData.numSimulations; i++) {
            let currentBalance = numericData.startingBalance;
            const path: { trade: number; balance: number }[] = [{ trade: 0, balance: currentBalance }];
            
            let pathMaxWinStreak = 0, pathMaxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
            let pathMinutes = 0;

            for (let j = 1; j <= numericData.numTrades; j++) {
                pathMinutes += numericData.avgHoldingTime + numericData.avgGapTime;
                if (currentBalance <= 0) {
                    path.push({ trade: j, balance: 0 });
                    continue;
                }
                const riskAmount = currentBalance * numericData.riskPerTrade;
                const isWin = Math.random() < numericData.winRate;
                const outcome = isWin 
                    ? riskAmount * numericData.avgWinR 
                    : -riskAmount * numericData.avgLossR;
                
                if (isWin) {
                    currentWinStreak++;
                    currentLossStreak = 0;
                    pathMaxWinStreak = Math.max(pathMaxWinStreak, currentWinStreak);
                } else {
                    currentLossStreak++;
                    currentWinStreak = 0;
                    pathMaxLossStreak = Math.max(pathMaxLossStreak, currentLossStreak);
                }

                currentBalance += outcome;
                path.push({ trade: j, balance: currentBalance });

                if (currentBalance < overallMinBalance) overallMinBalance = currentBalance;
                if (currentBalance > overallMaxBalance) overallMaxBalance = currentBalance;
            }
            if(currentBalance <= 0) ruinedCount++;
            totalMinutesSimulated += pathMinutes;
            finalBalances.push(currentBalance);
            allPaths.push(path);
            allMaxWinStreaks.push(pathMaxWinStreak);
            allMaxLossStreaks.push(pathMaxLossStreak);
        }

        const avgFinalBalance = finalBalances.reduce((a,b) => a + b, 0) / finalBalances.length;
        const maxFinalBalance = Math.max(...finalBalances);
        const minFinalBalance = Math.min(...finalBalances.filter(b => b > 0)); // Min of non-ruined paths
        const probabilityOfProfit = (finalBalances.filter(b => b > numericData.startingBalance).length / numericData.numSimulations) * 100;
        const probabilityOfRuin = (ruinedCount / numericData.numSimulations) * 100;
        const avgMaxWinStreak = allMaxWinStreaks.reduce((a, b) => a + b, 0) / allMaxWinStreaks.length;
        const avgMaxLossStreak = allMaxLossStreaks.reduce((a, b) => a + b, 0) / allMaxLossStreaks.length;
        
        const avgTotalMinutes = totalMinutesSimulated / numericData.numSimulations;
        const projectedEndDate = addMinutes(new Date(), avgTotalMinutes);

        setSimulationResult({ 
            paths: allPaths, 
            avgFinalBalance, maxFinalBalance, minFinalBalance, probabilityOfProfit, 
            probabilityOfRuin, avgMaxWinStreak, avgMaxLossStreak,
            overallMinBalance, overallMaxBalance,
            projectedEndDate
        });
    };
    
    const yAxisTickFormatter = (value: number) => {
        if (simulationResult) {
            const range = simulationResult.overallMaxBalance - simulationResult.overallMinBalance;
            if (range < 10000) {
                return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
            }
        }
        return `$${(value / 1000).toFixed(0)}k`;
    };
    
    return (
        <>
         <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="text-xl">Monte Carlo Simulator</CardTitle>
                <CardDescription>Simulate thousands of possible futures for your strategy to understand its statistical probabilities.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(runSimulation)} className="space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="col-span-4">
                                     <Button type="button" variant="outline" className="w-full" onClick={() => setIsFilterOpen(true)}>
                                        <Filter className="mr-2 h-4 w-4" />
                                        Advanced Filter ({simulatorTrades.length} / {filteredTrades.length} trades)
                                    </Button>
                                </div>
                               <FormField control={form.control} name="startingBalance" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Start Balance</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                               <FormField control={form.control} name="winRate" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Win Rate (%)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="numTrades" render={({ field }) => ( <FormItem><FormLabel className="text-xs"># of Trades</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="numSimulations" render={({ field }) => ( <FormItem><FormLabel className="text-xs"># of Sims</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="avgWinR" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Avg Win (R)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="avgLossR" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Avg Loss (R)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="riskPerTrade" render={({ field }) => ( <FormItem className="col-span-2"><FormLabel className="text-xs">Risk/Trade (%)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="avgHoldingTime" render={({ field }) => ( <FormItem className="col-span-2"><FormLabel className="text-xs">Avg Holding Time (min)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                                <FormField control={form.control} name="avgGapTime" render={({ field }) => ( <FormItem className="col-span-2"><FormLabel className="text-xs">Avg Gap B/W Trades (min)</FormLabel><FormControl><Input {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem> )}/>
                            </div>
                            <Button type="submit">Run Simulation</Button>
                        </form>
                    </Form>
                     <div className="space-y-4">
                        {simulationResult ? (
                            <div className="space-y-3">
                                <Card className="glassmorphic">
                                    <CardHeader className="p-3"><CardTitle className="text-base">Simulation Outcomes</CardTitle></CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                                    <XAxis dataKey="trade" type="number" domain={[0, parseInt(form.getValues('numTrades'), 10)]} tick={{ fontSize: 10 }} label={{ value: 'Trades', position: 'insideBottom', offset: -5 }}/>
                                                    <YAxis 
                                                        tickFormatter={yAxisTickFormatter} 
                                                        tick={{ fontSize: 10 }} 
                                                        label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
                                                        domain={[simulationResult.overallMinBalance, simulationResult.overallMaxBalance]}
                                                        allowDataOverflow={true}
                                                    />
                                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: '12px' }} formatter={(value: number) => <FormattedNumber value={value}/>}/>
                                                    {simulationResult.paths.slice(0, 10).map((path, i) => <Line key={i} type="monotone" data={path} dataKey="balance" stroke={BAR_COLORS[i % BAR_COLORS.length]} strokeWidth={0.5} dot={false}/>)}
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                     <Card className="glassmorphic">
                                        <CardHeader className="p-2"><CardTitle className="text-xs">Balance</CardTitle></CardHeader>
                                        <CardContent className="p-2 pt-0 space-y-1">
                                            <StatRow label="Avg. Final" value={<FormattedNumber value={simulationResult.avgFinalBalance} />} valueClass="text-green-500" />
                                            <StatRow label="Max Final" value={<FormattedNumber value={simulationResult.maxFinalBalance} />} />
                                            <StatRow label="Min Final" value={<FormattedNumber value={simulationResult.minFinalBalance} />} />
                                        </CardContent>
                                    </Card>
                                    <Card className="glassmorphic">
                                        <CardHeader className="p-2"><CardTitle className="text-xs">Probabilities</CardTitle></CardHeader>
                                        <CardContent className="p-2 pt-0 space-y-1">
                                             <StatRow label="Projected End" value={format(simulationResult.projectedEndDate, 'PPP')} />
                                             <StatRow label="Profit %" value={`${simulationResult.probabilityOfProfit.toFixed(1)}%`} />
                                             <StatRow label="Ruin %" value={`${simulationResult.probabilityOfRuin.toFixed(1)}%`} valueClass={simulationResult.probabilityOfRuin > 10 ? 'text-red-500' : ''}/>
                                        </CardContent>
                                    </Card>
                                     <Card className="glassmorphic">
                                        <CardHeader className="p-2"><CardTitle className="text-xs">Streaks</CardTitle></CardHeader>
                                        <CardContent className="p-2 pt-0 space-y-1">
                                              <StatRow label="Avg Max Win" value={simulationResult.avgMaxWinStreak.toFixed(1)} />
                                              <StatRow label="Avg Max Loss" value={simulationResult.avgMaxLossStreak.toFixed(1)} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">Run simulation to see results.</div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        <GlobalFilterDialog 
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            filters={localFilters}
            onApplyFilters={setLocalFilters}
            onClearFilters={() => setLocalFilters(initialFilterState)}
            isLocal={true}
        />
        </>
    );
};

const SimulatorPage = () => {
    return (
        <div className="flex flex-col h-full space-y-6">
            <h1 className="text-lg font-semibold gradient-text">Trading Simulator</h1>
            
            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Enhance Your Trading Skills</AlertTitle>
                <AlertDescription>Use the Monte Carlo simulator to project thousands of potential futures for your strategy based on your historical data.</AlertDescription>
            </Alert>
            
            <div className="flex-1 mt-4">
                 <MonteCarloSimulator />
            </div>
        </div>
    );
};

export default SimulatorPage;

    