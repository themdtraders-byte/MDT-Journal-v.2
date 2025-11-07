
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJournalStore } from '@/hooks/use-journal-store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Line, Bar, Cell } from 'recharts';
import { Calculator, RefreshCw, TrendingUp, DollarSign, BarChart as BarChartIcon, Wallet } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { pairsConfig } from '@/lib/data';
import FormattedNumber from '../ui/formatted-number';
import { calculateGroupMetrics } from '@/lib/analytics';
import { differenceInMinutes } from 'date-fns';


const compoundingSchema = z.object({
    startingBalance: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Starting balance must be positive." }),
    monthlyContribution: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, { message: "Contribution can't be negative." }),
    winRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, { message: "Win rate must be between 0 and 100." }),
    riskRewardRatio: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "R:R must be positive." }),
    riskPerTrade: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0.1 && parseFloat(val) <= 100, { message: "Risk per trade must be between 0.1 and 100." }),
    tradesPerMonth: z.string().refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, { message: "Trades per month must be a positive integer." }),
    monthsToProject: z.string().refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 120, { message: "Months must be between 1 and 120." }),
});

type CompoundingFormValues = z.infer<typeof compoundingSchema>;

type SimulationPoint = {
    month: number;
    balance: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-sm text-xs">
          <p className="font-bold">Month: {label}</p>
          <div className="text-primary flex items-center gap-1">
            Balance: <FormattedNumber value={payload[0].value} />
          </div>
        </div>
      );
    }
    return null;
  };


const CompoundingCalculator = () => {
    const { journals, activeJournalId, appSettings, filters } = useJournalStore(state => ({
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        appSettings: state.appSettings,
        filters: state.filters
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
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
    
    const [simulationResult, setSimulationResult] = useState<SimulationPoint[]>([]);

    const defaultValues = useMemo(() => {
        const tradesToUse = filteredTrades;
        if (!activeJournal || !tradesToUse || tradesToUse.length < 10 || !appSettings) { // Require at least 10 trades for meaningful stats
            return {
                startingBalance: String(parseFloat((activeJournal?.balance || 10000).toFixed(2))),
                monthlyContribution: '500.00',
                winRate: '50.00',
                riskRewardRatio: '2.00',
                riskPerTrade: '1.00',
                tradesPerMonth: '20',
                monthsToProject: '24',
            };
        }

        const metrics = calculateGroupMetrics(tradesToUse, appSettings, activeJournal.capital);
        
        return {
            startingBalance: String(parseFloat(activeJournal.balance.toFixed(2))),
            monthlyContribution: '500.00',
            winRate: metrics.winRate.toFixed(2),
            riskRewardRatio: (metrics.avgWin > 0 && metrics.avgLoss > 0 ? metrics.avgWin / metrics.avgLoss : 2).toFixed(2),
            riskPerTrade: '1.00',
            tradesPerMonth: '20',
            monthsToProject: '24',
        };
    }, [activeJournal, filteredTrades, appSettings]);

    const form = useForm<CompoundingFormValues>({
        resolver: zodResolver(compoundingSchema),
        defaultValues,
    });
    
    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);


    const runSimulation = (data: CompoundingFormValues) => {
        const numericData = {
            startingBalance: parseFloat(data.startingBalance),
            monthlyContribution: parseFloat(data.monthlyContribution),
            winRate: parseFloat(data.winRate),
            riskRewardRatio: parseFloat(data.riskRewardRatio),
            riskPerTrade: parseFloat(data.riskPerTrade),
            tradesPerMonth: parseInt(data.tradesPerMonth, 10),
            monthsToProject: parseInt(data.monthsToProject, 10),
        };
        
        let currentBalance = numericData.startingBalance;
        const results: SimulationPoint[] = [{ month: 0, balance: currentBalance }];
        
        for (let month = 1; month <= numericData.monthsToProject; month++) {
            currentBalance += numericData.monthlyContribution;
            
            for (let i = 0; i < numericData.tradesPerMonth; i++) {
                const riskAmount = currentBalance * (numericData.riskPerTrade / 100);
                if (Math.random() < (numericData.winRate / 100)) {
                    currentBalance += riskAmount * numericData.riskRewardRatio;
                } else {
                    currentBalance -= riskAmount;
                }

                if (currentBalance <= 0) {
                    currentBalance = 0;
                    break;
                }
            }
             results.push({ month, balance: currentBalance });
             if (currentBalance <= 0) break;
        }

        setSimulationResult(results);
    };

    const yAxisTickFormatter = (value: number) => {
      const numValue = Number(value);
      if (Math.abs(numValue) >= 1000000) {
        return `$${(numValue / 1000000).toFixed(1)}M`;
      }
      if (Math.abs(numValue) >= 10000) {
        return `$${(numValue / 1000).toFixed(0)}k`;
      }
      return `$${numValue.toFixed(0)}`;
    };

    const finalBalance = simulationResult.length > 0 ? simulationResult[simulationResult.length - 1].balance : 0;
    const totalContributions = (parseFloat(form.getValues('monthlyContribution')) || 0) * (parseInt(form.getValues('monthsToProject'), 10) || 0);
    const totalGrowth = finalBalance - (parseFloat(form.getValues('startingBalance')) || 0) - totalContributions;

    if (!activeJournal) {
      return (
        <Card className="glassmorphic bg-glass-green">
            <CardHeader><CardTitle>Loading...</CardTitle></CardHeader>
        </Card>
      )
    }

    return (
        <Card className="glassmorphic bg-glass-green">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Calculator /> Compounding Calculator</CardTitle>
                <CardDescription>Project potential account growth over time based on your historical performance or custom inputs.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(runSimulation)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="startingBalance" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Starting Balance</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="monthlyContribution" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Monthly Contribution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                <FormField control={form.control} name="winRate" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Win Rate (%)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                <FormField control={form.control} name="riskRewardRatio" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Average R:R</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                <FormField control={form.control} name="riskPerTrade" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Risk Per Trade (%)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="tradesPerMonth" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Trades Per Month</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                                <FormField control={form.control} name="monthsToProject" render={({ field }) => (
                                    <FormItem className="col-span-2"><FormLabel className="text-xs">Months to Project</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage className="text-xs" /></FormItem>
                                )}/>
                            </div>
                            <div className="flex justify-between">
                                <Button type="submit">Calculate</Button>
                                <Button type="button" variant="ghost" onClick={() => {
                                    form.reset(defaultValues);
                                    setSimulationResult([]);
                                }}><RefreshCw className="mr-2 h-4 w-4" /> Reset</Button>
                            </div>
                        </form>
                    </Form>
                    <div className="space-y-4">
                        <Card className="glassmorphic bg-glass-teal">
                            <CardHeader><CardTitle className="text-xl">Projected Growth</CardTitle></CardHeader>
                            <CardContent>
                                {simulationResult.length > 1 ? (
                                    <>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={simulationResult}>
                                                    <defs>
                                                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} label={{ value: 'Months', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                                                    <YAxis tickFormatter={yAxisTickFormatter} tick={{ fontSize: 12 }}/>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Area type="monotone" dataKey="balance" name="Balance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                                                    <Brush dataKey="month" height={20} stroke="hsl(var(--primary))" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Final Balance</p>
                                                <div className="text-xl font-bold text-green-500"><FormattedNumber value={finalBalance} /></div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Total Growth</p>
                                                <div className="text-xl font-bold text-green-500"><FormattedNumber value={totalGrowth} /></div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[340px] flex items-center justify-center text-muted-foreground">
                                        <p>Run a simulation to see the growth chart.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default CompoundingCalculator;

    