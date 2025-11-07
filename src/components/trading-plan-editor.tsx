
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, XCircle, Edit, RotateCw } from 'lucide-react';
import { pairsConfig } from '@/lib/data';
import MultiSelect from './ui/multi-select';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import type { TradingPlanData } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { initialPlan } from '@/hooks/use-journal-store';
import CircularTimeSelector from './ui/circular-time-selector';

interface TradingPlanEditorProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan: TradingPlanData;
    onSave: (newPlan: TradingPlanData) => void;
}

export default function TradingPlanEditor({ isOpen, onClose, initialPlan: initialPlanFromProps, onSave }: TradingPlanEditorProps) {
    const [editablePlan, setEditablePlan] = useState<TradingPlanData>(initialPlanFromProps);

    useEffect(() => {
        setEditablePlan(initialPlanFromProps);
    }, [initialPlanFromProps, isOpen]);

    const handleValueChange = (key: keyof TradingPlanData, value: any) => {
        setEditablePlan(prev => ({...prev, [key]: value}));
    };

    const handleNumericValueChange = (key: keyof TradingPlanData, value: string) => {
        // Allow only numbers and a single decimal point
        const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\\..*)\\./g, '$1');
        handleValueChange(key, sanitizedValue);
    };
    
    const handleInternalSave = () => {
        const planToSave: TradingPlanData = {
            ...editablePlan,
            riskPerTrade: Number(editablePlan.riskPerTrade) || 0,
            dailyLossLimit: Number(editablePlan.dailyLossLimit) || 0,
            weeklyLossLimit: Number(editablePlan.weeklyLossLimit) || 0,
            monthlyLossLimit: Number(editablePlan.monthlyLossLimit) || 0,
            maxTradesPerDay: Number(editablePlan.maxTradesPerDay) || 0,
            maxOpenPositions: Number(editablePlan.maxOpenPositions) || 0,
            dailyTarget: Number(editablePlan.dailyTarget) || 0,
            weeklyProfitLimit: Number(editablePlan.weeklyProfitLimit) || 0,
            monthlyProfitLimit: Number(editablePlan.monthlyProfitLimit) || 0,
            minRiskToReward: Number(editablePlan.minRiskToReward) || 0,
        };
        onSave(planToSave);
    };

    const handleReset = () => {
        setEditablePlan(initialPlan);
    }
    
    if (!editablePlan) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Edit Trading Plan</DialogTitle>
                     <DialogDescription>
                        Set your core trading rules and risk parameters. These rules directly impact your discipline score. All currency values are in USD.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-6 pr-1">
                        <Card className="glassmorphic">
                            <CardHeader><CardTitle className="text-lg">Tradable Instruments</CardTitle></CardHeader>
                            <CardContent>
                                    <MultiSelect
                                    options={Object.keys(pairsConfig).map(pair => ({ value: pair, label: pair }))}
                                    selectedValues={editablePlan.instruments}
                                    onValueChange={(v) => handleValueChange('instruments', v)}
                                    placeholder="Select instruments..."
                                    className="w-full"
                                    />
                            </CardContent>
                        </Card>
                         <Card className="glassmorphic">
                            <CardHeader><CardTitle className="text-lg">Trading Hours (NY Time)</CardTitle></CardHeader>
                            <CardContent>
                                <CircularTimeSelector
                                    sessions={[]} // Not needed for this editor instance
                                    activeHours={editablePlan.activeHours || []}
                                    noTradeZones={editablePlan.noTradeZones || []}
                                    onActiveHoursChange={(hours) => handleValueChange('activeHours', hours)}
                                    onNoTradeZonesChange={(zones) => handleValueChange('noTradeZones', zones)}
                                    masterSessionTimings={editablePlan.sessionTimings}
                                />
                            </CardContent>
                        </Card>
                        <Card className="glassmorphic">
                            <CardHeader><CardTitle className="text-lg">Risk & Accountability</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label>Risk Per Trade</Label>
                                    <div className="flex">
                                        <Input type="text" value={String(editablePlan.riskPerTrade)} onChange={(e) => handleNumericValueChange('riskPerTrade', e.target.value)} />
                                        <Select value={editablePlan.riskUnit} onValueChange={(v) => handleValueChange('riskUnit', v)}>
                                            <SelectTrigger className="w-[80px]"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="%">%</SelectItem><SelectItem value="$">$</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Daily Loss Limit (%)</Label>
                                    <Input type="text" value={String(editablePlan.dailyLossLimit)} onChange={(e) => handleNumericValueChange('dailyLossLimit', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Weekly Loss Limit (%)</Label>
                                    <Input type="text" value={String(editablePlan.weeklyLossLimit)} onChange={(e) => handleNumericValueChange('weeklyLossLimit', e.target.value)} />
                                </div>
                                 <div className="space-y-1">
                                    <Label>Monthly Loss Limit (%)</Label>
                                    <Input type="text" value={String(editablePlan.monthlyLossLimit)} onChange={(e) => handleNumericValueChange('monthlyLossLimit', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Max Trades/Day</Label>
                                    <Input type="text" value={String(editablePlan.maxTradesPerDay)} onChange={(e) => handleNumericValueChange('maxTradesPerDay', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Max Open Positions</Label>
                                    <Input type="text" value={String(editablePlan.maxOpenPositions)} onChange={(e) => handleNumericValueChange('maxOpenPositions', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label>Daily Target</Label>
                                    <div className="flex">
                                        <Input type="text" value={String(editablePlan.dailyTarget)} onChange={(e) => handleNumericValueChange('dailyTarget', e.target.value)} />
                                        <Select value={editablePlan.dailyTargetUnit} onValueChange={(v) => handleValueChange('dailyTargetUnit', v)}>
                                            <SelectTrigger className="w-[80px]"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="%">%</SelectItem><SelectItem value="$">$</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Weekly Profit Limit</Label>
                                    <div className="flex">
                                        <Input type="text" value={String(editablePlan.weeklyProfitLimit)} onChange={(e) => handleNumericValueChange('weeklyProfitLimit', e.target.value)} />
                                        <Select value={editablePlan.weeklyProfitLimitUnit} onValueChange={(v) => handleValueChange('weeklyProfitLimitUnit', v)}>
                                            <SelectTrigger className="w-[80px]"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="%">%</SelectItem><SelectItem value="$">$</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>Monthly Profit Limit</Label>
                                    <div className="flex">
                                        <Input type="text" value={String(editablePlan.monthlyProfitLimit)} onChange={(e) => handleNumericValueChange('monthlyProfitLimit', e.target.value)} />
                                        <Select value={editablePlan.monthlyProfitLimitUnit} onValueChange={(v) => handleValueChange('monthlyProfitLimitUnit', v)}>
                                            <SelectTrigger className="w-[80px]"><SelectValue/></SelectTrigger>
                                            <SelectContent><SelectItem value="%">%</SelectItem><SelectItem value="$">$</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                 <div className="space-y-1">
                                    <Label>Minimum R:R</Label>
                                    <Input type="text" value={String(editablePlan.minRiskToReward)} onChange={(e) => handleNumericValueChange('minRiskToReward', e.target.value)} placeholder="e.g., 1.5"/>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                <DialogFooter className="justify-between">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost"><RotateCw className="mr-2 h-4 w-4"/> Reset to Default</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will reset all trading plan settings to their original default values. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex gap-2">
                        <Button onClick={onClose} variant="outline"><XCircle className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button onClick={handleInternalSave}><Save className="mr-2 h-4 w-4" /> Save Plan</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
