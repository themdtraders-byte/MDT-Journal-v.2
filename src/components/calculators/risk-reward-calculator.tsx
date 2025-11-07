
'use client';

import { useMemo } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calculator, RefreshCw } from "lucide-react";

const rrSchema = z.object({
  entryPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Entry price must be positive." }),
  stopLossPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Stop loss must be positive." }),
  takeProfitPrice: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, { message: "Take profit must be positive." }),
}).refine(data => {
    const entry = parseFloat(data.entryPrice);
    const sl = parseFloat(data.stopLossPrice);
    const tp = parseFloat(data.takeProfitPrice);
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return true; // Let individual field validation handle this
    if (entry > sl && entry > tp) return false;
    if (entry < sl && entry < tp) return false;
    return true;
}, {
  message: "Entry price must be between stop loss and take profit.",
  path: ["entryPrice"],
});


type RRFormValues = z.infer<typeof rrSchema>;

export default function RiskRewardCalculator() {
    const form = useForm<RRFormValues>({
        resolver: zodResolver(rrSchema),
        defaultValues: {
            entryPrice: '',
            stopLossPrice: '',
            takeProfitPrice: '',
        },
    });

    const { watch, reset } = form;
    const formValues = watch();

    const calculatedRatio = useMemo(() => {
        const entryPrice = parseFloat(formValues.entryPrice);
        const stopLossPrice = parseFloat(formValues.stopLossPrice);
        const takeProfitPrice = parseFloat(formValues.takeProfitPrice);

        if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(takeProfitPrice)) {
            return "0:0";
        }
        
        const risk = Math.abs(entryPrice - stopLossPrice);
        const reward = Math.abs(takeProfitPrice - entryPrice);

        if (risk === 0) {
            return "∞"; // Infinite risk/reward if stop loss is at entry
        }
        
        const ratio = reward / risk;

        return `${ratio.toFixed(2)} : 1`;

    }, [formValues]);

    return (
        <Card className="glassmorphic bg-glass-yellow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Calculator /> Risk:Reward Calculator
                </CardTitle>
                <CardDescription>
                    Calculate the reward to risk ratio of your trade.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <Form {...form}>
                        <form className="space-y-4">
                            <FormField
                                control={form.control}
                                name="entryPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Entry Price</FormLabel>
                                        <FormControl><Input type="text" placeholder="e.g., 1.25000" {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stopLossPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Stop Loss Price</FormLabel>
                                        <FormControl><Input type="text" placeholder="e.g., 1.24500" {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="takeProfitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Take Profit Price</FormLabel>
                                        <FormControl><Input type="text" placeholder="e.g., 1.26500" {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="button" variant="ghost" onClick={() => reset()}><RefreshCw className="mr-2 h-4 w-4"/>Reset</Button>
                            </div>
                        </form>
                    </Form>
                     <div className="space-y-6">
                         <Card className="glassmorphic text-center bg-glass-orange">
                            <CardHeader><CardTitle className="text-xl">Calculated R:R Ratio</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{calculatedRatio}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

    