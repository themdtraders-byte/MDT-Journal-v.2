
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import type { Journal, ProfitSplit } from '@/types';
import { cn } from '@/lib/utils';
import FormattedNumber from './ui/formatted-number';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';

export default function ProfitSplitter({ journal }: { journal: Journal }) {
    const { updateProfitSplits, updateActiveJournal } = useJournalStore();
    const { toast } = useToast();
    const [splits, setSplits] = useState<ProfitSplit[]>([]);
    const [fundedSplit, setFundedSplit] = useState(journal?.fundedSplit || { enabled: false, percentage: 80 });

    useEffect(() => {
        let initialSplits = journal?.profitSplits ? JSON.parse(JSON.stringify(journal.profitSplits)) : [];
        
        let charitySplit = initialSplits.find(s => s.name === 'Charity');
        if (!charitySplit) {
            charitySplit = { id: 'default-charity', name: 'Charity', percentage: 5 };
            initialSplits.unshift(charitySplit);
        } else if (charitySplit.percentage < 2.5) {
            charitySplit.percentage = 2.5;
        }

        let reInvestSplit = initialSplits.find(s => s.name === 'Re Invest');
        if (!reInvestSplit) {
            reInvestSplit = { id: 'default-reinvest', name: 'Re Invest', percentage: 50 };
            initialSplits.splice(1, 0, reInvestSplit);
        } else if (reInvestSplit.percentage < 20) {
            reInvestSplit.percentage = 20;
        }

        setSplits(initialSplits);
        setFundedSplit(journal?.fundedSplit || { enabled: false, percentage: 80 });

    }, [journal?.profitSplits, journal?.fundedSplit]);

    const handleAddSplit = () => {
        setSplits(prev => [...prev, { id: crypto.randomUUID(), name: 'New Split', percentage: 10 }]);
    };

    const handleRemoveSplit = (id: string) => {
        setSplits(prev => prev.filter(split => split.id !== id));
    };

    const handleSplitChange = (id: string, field: 'name' | 'percentage', value: string | number) => {
        setSplits(prev => prev.map(split => 
            split.id === id ? { ...split, [field]: value } : split
        ));
    };
    
    const handlePercentageBlur = (id: string, name: string, value: number) => {
        let clampedValue = value;
        if (name === 'Charity' && value < 2.5) {
            clampedValue = 2.5;
            toast({ title: "Minimum Requirement", description: "Charity split cannot be less than 2.5%.", variant: 'destructive' });
        }
        if (name === 'Re Invest' && value < 20) {
            clampedValue = 20;
            toast({ title: "Minimum Requirement", description: "Re Invest split cannot be less than 20%.", variant: 'destructive' });
        }
        if (clampedValue !== value) {
            handleSplitChange(id, 'percentage', clampedValue);
        }
    };


    const handleSave = () => {
        const totalPercentageCheck = splits.reduce((sum, s) => sum + Number(s.percentage), 0);
        if (totalPercentageCheck > 100) {
            toast({
                title: "Invalid Percentage",
                description: "Total split percentage cannot exceed 100%.",
                variant: "destructive",
            });
            return;
        }
        updateProfitSplits(splits);
        updateActiveJournal({ fundedSplit });
        toast({ title: "Success", description: "Profit splitter configuration saved." });
    };

    const monthlyProfit = useMemo(() => {
        if (!journal || !journal.trades) return {};
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        return journal.trades.reduce((acc, trade) => {
            const dateParts = trade.closeDate.split('-').map(Number);
            if(dateParts.length !== 3 || dateParts.some(isNaN)) return acc;
            
            const [year, month] = dateParts;
            const monthYear = `${monthNames[month - 1]} ${year}`;
            
            acc[monthYear] = (acc[monthYear] || 0) + trade.auto.pl;
            return acc;
        }, {} as Record<string, number>);
    }, [journal]);

    const totalPercentage = useMemo(() => splits.reduce((sum, s) => sum + Number(s.percentage), 0), [splits]);
    const months = Object.keys(monthlyProfit).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
    const permanentSplits = splits.filter(s => s.name === 'Charity' || s.name === 'Re Invest');
    const otherSplits = splits.filter(s => s.name !== 'Charity' && s.name !== 'Re Invest');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
             <div className="lg:col-span-1 h-full flex flex-col">
                <ScrollArea className="h-full">
                    <Card className="glassmorphic">
                        <CardHeader className="p-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Configure Splits</CardTitle>
                                <CardDescription className="text-xs">Define how your profits are distributed.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="funded-split-toggle" className="text-sm">Funded Split</Label>
                                <Switch id="funded-split-toggle" checked={fundedSplit.enabled} onCheckedChange={(c) => setFundedSplit(p => ({...p, enabled: c}))} />
                                {fundedSplit.enabled && (
                                    <div className="flex items-center gap-1">
                                        <Input type="number" value={fundedSplit.percentage} onChange={e => setFundedSplit(p => ({...p, percentage: parseFloat(e.target.value) || 0}))} className="h-7 w-16 text-xs"/>
                                        <span className="text-xs">%</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                            {permanentSplits.map(split => (
                                <div key={split.id} className="flex items-center gap-2">
                                    <Input value={split.name} disabled className="h-8 text-xs font-semibold" />
                                    <Input type="number" placeholder="%" value={split.percentage} onChange={e => handleSplitChange(split.id, 'percentage', parseFloat(e.target.value) || 0)} onBlur={e => handlePercentageBlur(split.id, split.name, parseFloat(e.target.value) || 0)} className="w-20 h-8 text-xs" />
                                </div>
                            ))}
                            
                            {otherSplits.map(split => (
                                <div key={split.id} className="flex items-center gap-2">
                                    <Input placeholder="Split Name" value={split.name} onChange={e => handleSplitChange(split.id, 'name', e.target.value)} className="h-8 text-xs" />
                                    <Input type="number" placeholder="%" value={split.percentage} onChange={e => handleSplitChange(split.id, 'percentage', parseFloat(e.target.value) || 0)} className="w-20 h-8 text-xs" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveSplit(split.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-2">
                                <Button variant="outline" size="sm" onClick={handleAddSplit}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                                <Button onClick={handleSave} size="sm"><Save className="mr-2 h-4 w-4" /> Save</Button>
                            </div>
                            <div className="space-y-1 pt-2">
                                <div className="flex justify-between text-xs">
                                    <span>Total Allocated</span>
                                    <span className={totalPercentage > 100 ? 'text-destructive' : ''}>{totalPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={totalPercentage} className="h-1.5" />
                                {totalPercentage > 100 && (
                                    <Alert variant="destructive" className="mt-2 text-xs p-2">
                                        <AlertDescription>Total percentage exceeds 100%.</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </ScrollArea>
             </div>

            <div className="lg:col-span-2 h-full flex flex-col">
                <Card className="glassmorphic h-full flex flex-col">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Monthly Profit Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 min-h-0">
                        <ScrollArea className="h-full">
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="p-2">Month</TableHead>
                                        <TableHead className="p-2">Net P/L</TableHead>
                                        {fundedSplit.enabled && <TableHead className="p-2 font-semibold text-primary">My P/L ({fundedSplit.percentage}%)</TableHead>}
                                        {splits.map(split => (
                                            <TableHead key={split.id} className="p-2">{split.name}</TableHead>
                                        ))}
                                        <TableHead className="p-2">Unallocated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {months.length > 0 ? months.map(month => {
                                        const totalNetPl = monthlyProfit[month];
                                        const profitForSplitting = totalNetPl > 0 
                                            ? (fundedSplit.enabled ? totalNetPl * (fundedSplit.percentage / 100) : totalNetPl)
                                            : 0;
                                        
                                        const myShareAmount = fundedSplit.enabled && totalNetPl > 0 ? profitForSplitting : 0;
                                        const unallocatedAmount = profitForSplitting * (1 - (totalPercentage / 100));

                                        return (
                                        <TableRow key={month}>
                                            <TableCell className="font-medium p-2">{month}</TableCell>
                                            <TableCell className={cn("font-semibold p-2", totalNetPl >= 0 ? 'text-green-500' : 'text-red-500')}><FormattedNumber value={totalNetPl} /></TableCell>
                                            {fundedSplit.enabled && <TableCell className="font-semibold p-2 text-primary"><FormattedNumber value={myShareAmount} /></TableCell>}
                                            {splits.map(split => (
                                                <TableCell key={split.id} className="p-2"><FormattedNumber value={profitForSplitting * (Number(split.percentage) / 100)} /></TableCell>
                                            ))}
                                            <TableCell className="p-2">{unallocatedAmount > 0 ? <FormattedNumber value={unallocatedAmount} /> : <FormattedNumber value={0} />}</TableCell>
                                        </TableRow>
                                        )}) : (
                                            <TableRow>
                                                <TableCell colSpan={splits.length + 3 + (fundedSplit.enabled ? 1 : 0)} className="text-center text-muted-foreground p-4">
                                                    No profitable months found.
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    