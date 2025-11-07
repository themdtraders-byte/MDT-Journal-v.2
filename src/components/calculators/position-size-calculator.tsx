

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Calculator, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormattedNumber from '../ui/formatted-number';

const positionSizerSchema = z.object({
  accountBalance: z.string().refine(val => !isNaN(parseFloat(val))),
  pair: z.string().nonempty({ message: 'Please select a pair.' }),
  entryPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Entry price must be a positive number' }),
  stopLossPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Stop loss price must be a positive number' }),
  takeProfitPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Take profit price must be a positive number' }),
  lotSize: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: 'Lot size must be positive' }),
}).refine(data => parseFloat(data.stopLossPrice) !== parseFloat(data.entryPrice), {
    message: "Stop loss price cannot be the same as entry price.",
    path: ["stopLossPrice"],
});

type PositionSizerFormValues = z.infer<typeof positionSizerSchema>;

const StatCard = ({ title, value, suffix = '', className = '', isMonetary = false }: { title: string; value: string | number; suffix?: string, className?: string, isMonetary?: boolean }) => (
    <div className={cn("flex-1 rounded-lg p-4 text-center glassmorphic bg-glass-teal", className)}>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn("text-2xl font-bold font-headline", className)}>
            {isMonetary ? <FormattedNumber value={Number(value)} /> : `${value}${suffix}`}
        </div>
    </div>
);

export default function PositionSizeCalculator() {
    const { journals, activeJournalId, appSettings } = useJournalStore(state => ({
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        appSettings: state.appSettings
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const form = useForm<PositionSizerFormValues>({
        resolver: zodResolver(positionSizerSchema),
        defaultValues: {
            accountBalance: String(parseFloat((activeJournal?.balance || 10000).toFixed(2))),
            pair: 'EURUSD',
            entryPrice: '',
            stopLossPrice: '',
            takeProfitPrice: '',
            lotSize: '',
        },
    });

    const { watch, reset, setValue } = form;
    const formValues = watch();

    useEffect(() => {
        if (activeJournal) {
            setValue('accountBalance', String(parseFloat(activeJournal.balance.toFixed(2))));
        }
    }, [activeJournal, setValue]);

    const pairData = useMemo(() => {
        if (!appSettings) return null;
        return appSettings.pairsConfig[formValues.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
    }, [formValues.pair, appSettings]);

    const calculatedValues = useMemo(() => {
        const accountBalance = parseFloat(formValues.accountBalance);
        const entryPrice = parseFloat(formValues.entryPrice);
        const stopLossPrice = parseFloat(formValues.stopLossPrice);
        const takeProfitPrice = parseFloat(formValues.takeProfitPrice);
        const lotSize = parseFloat(formValues.lotSize);

        if (isNaN(accountBalance) || isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(takeProfitPrice) || isNaN(lotSize) || !pairData) {
            return {
                potentialLoss: 0,
                potentialGain: 0,
                riskPercentage: '0.00',
                riskRewardRatio: '0.00 : 1',
            };
        }

        const riskInPips = Math.abs(entryPrice - stopLossPrice) / pairData.pipSize;
        const rewardInPips = Math.abs(takeProfitPrice - entryPrice) / pairData.pipSize;
        
        const potentialLoss = riskInPips * lotSize * pairData.pipValue;
        const potentialGain = rewardInPips * lotSize * pairData.pipValue;

        const riskRewardRatio = potentialLoss > 0 ? (potentialGain / potentialLoss).toFixed(2) : '0.00';
        const riskPercentage = ((potentialLoss / accountBalance) * 100).toFixed(2);

        return {
            potentialLoss,
            potentialGain,
            riskPercentage,
            riskRewardRatio: `${riskRewardRatio}:1`,
        };
    }, [formValues, pairData]);
    
    const handleReset = () => {
        reset({
            accountBalance: String(parseFloat((activeJournal?.balance || 10000).toFixed(2))),
            pair: 'EURUSD',
            entryPrice: '',
            stopLossPrice: '',
            takeProfitPrice: '',
            lotSize: '',
        });
    };

    if (!appSettings) {
        return <Card className="glassmorphic bg-glass-purple"><CardHeader><CardTitle>Loading...</CardTitle></CardHeader></Card>;
    }

    return (
        <Card className="glassmorphic bg-glass-purple">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator /> Position & P/L Calculator
                </CardTitle>
                <CardDescription>
                    Calculate your potential profit, loss, and risk profile for a given trade size.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Form {...form}>
                        <form className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="accountBalance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Balance</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pair"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pair</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {Object.keys(appSettings.pairsConfig).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="entryPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entry Price</FormLabel>
                                            <FormControl><Input type="text" placeholder="e.g., 1.0750" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="stopLossPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stop Loss Price</FormLabel>
                                            <FormControl><Input type="text" placeholder="e.g., 1.0700" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="takeProfitPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Take Profit Price</FormLabel>
                                            <FormControl><Input type="text" placeholder="e.g., 1.0850" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lotSize"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lot Size</FormLabel>
                                            <FormControl><Input type="text" placeholder="e.g., 1.00" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                             <div className="flex justify-end">
                                <Button type="button" variant="ghost" onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4"/>Reset</Button>
                            </div>
                        </form>
                    </Form>
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-center mb-4">Calculated Outcomes</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <StatCard title="Potential Loss" value={calculatedValues.potentialLoss} isMonetary className="text-red-500" />
                            <StatCard title="Potential Gain" value={calculatedValues.potentialGain} isMonetary className="text-green-500" />
                            <StatCard title="Risk on Account" value={calculatedValues.riskPercentage} suffix="%" />
                            <StatCard title="Reward:Risk Ratio" value={calculatedValues.riskRewardRatio} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

    
