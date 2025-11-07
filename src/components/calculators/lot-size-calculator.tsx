

'use client';

import { useMemo, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Calculator, RefreshCw } from 'lucide-react';
import FormattedNumber from '../ui/formatted-number';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { pairsConfig } from '@/lib/data';
import { Combobox } from '@/components/ui/combobox';
import AddNewPairDialog from '../add-new-pair-dialog';
import { useToast } from '@/hooks/use-toast';

const calculatorSchema = z.object({
  accountBalance: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Balance must be positive" }),
  pair: z.string().nonempty("Please select a pair"),
  openPrice: z.string().optional(),
  stopLossPrice: z.string().optional(),
  riskType: z.enum(['percent', 'money']),
  riskValue: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Risk value must be positive" }),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const StatCard = ({ title, value, suffix = '', className = '', isMonetary = false }: { title: string; value: string | number; suffix?: string, className?: string, isMonetary?: boolean }) => (
    <div className={cn("flex-1 rounded-lg p-3 text-center glassmorphic bg-glass-teal", className)}>
        <p className="text-xs text-muted-foreground">{title}</p>
        <div className={cn("text-xl font-bold font-headline", className)}>
            {isMonetary ? <FormattedNumber value={Number(value)} /> : `${value}${suffix}`}
        </div>
    </div>
);

const FormattedValue = ({ value, isMonetary = false, suffix = '' }: { value: string | number, isMonetary?: boolean, suffix?: string }) => {
    if (isMonetary) {
        return <FormattedNumber value={Number(value)} />;
    }
    
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return <span className="font-mono">{value}{suffix}</span>;
        }
        value = value.toFixed(2);
    }

    const parts = String(value).split('.');
    if (parts.length === 2 && !String(value).endsWith('%')) {
        return (
            <span className="font-mono">
                <span>{parts[0]}</span>
                <span className="opacity-50">.{parts[1]}</span>
                {suffix}
            </span>
        );
    }
    return <span className="font-mono">{value}{suffix}</span>;
}


export default function LotSizeCalculator() {
    const { journals, activeJournalId, appSettings, updateAppSettings } = useJournalStore();
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const [newPairDialog, setNewPairDialog] = useState({ isOpen: false, name: '' });
    const { toast } = useToast();
    
    const form = useForm<CalculatorFormValues>({
        resolver: zodResolver(calculatorSchema),
        defaultValues: {
            accountBalance: String(activeJournal?.balance || 10000),
            pair: 'XAUUSD',
            openPrice: '',
            stopLossPrice: '',
            riskType: 'percent',
            riskValue: '1',
        },
    });
    
    const { control, reset, getValues, setValue } = form;
    
    const { accountBalance, pair, openPrice, stopLossPrice, riskType, riskValue } = useWatch({ control });

    useEffect(() => {
        if (activeJournal) {
            reset({
                ...getValues(),
                accountBalance: String(activeJournal.balance)
            });
        }
    }, [activeJournal, reset, getValues]);
    
     const calculatedValues = useMemo(() => {
        const numAccountBalance = parseFloat(accountBalance);
        const numOpenPrice = parseFloat(openPrice || '0');
        const numStopLossPrice = parseFloat(stopLossPrice || '0');
        const numRiskValue = parseFloat(riskValue);

        if (!appSettings || !appSettings.pairsConfig || !pair || isNaN(numAccountBalance) || numOpenPrice <= 0 || numStopLossPrice <= 0 || isNaN(numRiskValue) || numRiskValue <= 0) {
            return { lotSize: '0.00', riskInCurrency: 0, riskInPips: 0, riskInPercent: 0 };
        }
        
        const pairData = appSettings.pairsConfig[pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        if (!pairData) {
            return { lotSize: '0.00', riskInCurrency: 0, riskInPips: 0, riskInPercent: 0 };
        }

        const riskInCurrency = riskType === 'money'
            ? numRiskValue
            : numAccountBalance * (numRiskValue / 100);

        const riskInPips = Math.abs(numOpenPrice - numStopLossPrice) / pairData.pipSize;
        if (riskInPips === 0) {
            return { lotSize: '0.00', riskInCurrency, riskInPips: 0, riskInPercent: 0 };
        }
        
        const valueOfOnePipPerLot = pairData.pipValue;
        
        const valueOfPipsForTrade = riskInPips * valueOfOnePipPerLot;
        if (valueOfPipsForTrade <= 0) {
             return { lotSize: '0.00', riskInCurrency, riskInPips, riskInPercent: 0 };
        }
        
        const lotSize = riskInCurrency / valueOfPipsForTrade;

        const riskInPercent = numAccountBalance > 0 ? (riskInCurrency / numAccountBalance) * 100 : 0;

        return {
            lotSize: lotSize.toFixed(2),
            riskInCurrency: riskInCurrency,
            riskInPips: riskInPips,
            riskInPercent: riskInPercent,
        };
    }, [
        accountBalance,
        pair,
        openPrice,
        stopLossPrice,
        riskType,
        riskValue,
        appSettings
    ]);

    const resetCalculator = () => {
        reset({
            accountBalance: String(activeJournal?.balance || 10000),
            pair: 'XAUUSD',
            riskType: 'percent',
            riskValue: '1',
            openPrice: '',
            stopLossPrice: '',
        });
    };

    const handleAddNewPair = (name: string) => {
        setValue('pair', name.toUpperCase());
        setNewPairDialog({ isOpen: true, name: name.toUpperCase() });
    };

    const saveNewPair = (name: string, config: { pipSize: string; pipValue: string; spread: string }) => {
        if (!appSettings) return;
        const newPairsConfig = {
            ...appSettings.pairsConfig,
            [name]: {
                pipSize: parseFloat(config.pipSize),
                pipValue: parseFloat(config.pipValue),
                spread: parseFloat(config.spread || '0'),
                iconName: 'Component',
            },
        };
        updateAppSettings({ pairsConfig: newPairsConfig });
        toast({ title: 'Pair Saved', description: `${name} has been saved to your pairs database.` });
    };
    
    if (!appSettings) {
        return <Card className="glassmorphic bg-glass-blue"><CardHeader><CardTitle>Loading...</CardTitle></CardHeader></Card>;
    }

    return (
        <Card className="glassmorphic bg-transparent border-0 shadow-none">
            <CardContent className="p-2">
                <div className="flex flex-col gap-4">
                    <Form {...form}>
                        <form className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={control}
                                    name="accountBalance"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Account Balance</FormLabel>
                                            <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={control}
                                    name="pair"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Pair</FormLabel>
                                            <Combobox
                                                options={Object.keys(appSettings.pairsConfig).map(p => ({ value: p, label: p }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select or create a pair..."
                                                onAddNew={handleAddNewPair}
                                                className="h-8 text-xs"
                                            />
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name="openPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Open Price</FormLabel>
                                            <FormControl><Input placeholder="e.g., 1.07500" {...field} className="h-8 text-xs" /></FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={control}
                                    name="stopLossPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Stop Loss Price</FormLabel>
                                            <FormControl><Input placeholder="e.g., 1.07400" {...field} className="h-8 text-xs" /></FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Risk</Label>
                                <div className="flex gap-2 mt-1">
                                    <FormField
                                        control={form.control}
                                        name="riskType"
                                        render={({ field }) => (
                                            <ToggleGroup 
                                                type="single"
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                className="bg-muted p-0.5 rounded-md"
                                            >
                                                <ToggleGroupItem value="percent" className="text-xs h-7 px-2 data-[state=on]:bg-background">Percent (%)</ToggleGroupItem>
                                                <ToggleGroupItem value="money" className="text-xs h-7 px-2 data-[state=on]:bg-background">Money ($)</ToggleGroupItem>
                                            </ToggleGroup>
                                        )}
                                    />
                                     <FormField
                                        control={control}
                                        name="riskValue"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl><Input {...field} className="h-8 text-xs" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField control={control} name="riskValue" render={() => <FormMessage className="text-xs" />} />
                            </div>
                             <div className="flex justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={resetCalculator}><RefreshCw className="mr-2 h-4 w-4"/>Reset</Button>
                            </div>
                        </form>
                    </Form>
                    <div className="space-y-4">
                         <Card className="glassmorphic text-center bg-glass-purple">
                            <CardHeader className="p-2">
                                <CardTitle className="text-sm">Lot Size</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2">
                                <p className="text-4xl font-bold text-primary"><FormattedValue value={calculatedValues.lotSize} /></p>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard title="Risk in $" value={calculatedValues.riskInCurrency} isMonetary />
                            <StatCard title="Risk in Pips" value={calculatedValues.riskInPips.toFixed(1)} />
                            <StatCard title="Risk in %" value={calculatedValues.riskInPercent.toFixed(2)} suffix="%" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <AddNewPairDialog
                isOpen={newPairDialog.isOpen}
                onClose={() => setNewPairDialog({ isOpen: false, name: '' })}
                onSave={saveNewPair}
                pairName={newPairDialog.name}
            />
        </Card>
    );
}
