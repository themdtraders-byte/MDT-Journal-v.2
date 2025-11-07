
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle, Trophy, RotateCw, DollarSign, Percent, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Journal, JournalRules as RulesType, MinDaysRule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertDialogFooterComponent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import FormattedNumber from './ui/formatted-number';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { initialJournalRules } from '@/hooks/use-journal-store';
import { ScrollArea } from './ui/scroll-area';


const RuleInput = ({
  label,
  value,
  onValueChange,
  type,
  onTypeChange,
  isEnabled,
  onToggle
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  type: 'amount' | 'percentage';
  onTypeChange: (type: 'amount' | 'percentage') => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}) => (
  <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
    <div className="flex items-center justify-between">
      <Label className="font-semibold text-sm">{label}</Label>
      <Switch checked={isEnabled} onCheckedChange={onToggle} />
    </div>
    {isEnabled && (
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="flex-grow h-8"
          placeholder={type === 'amount' ? 'e.g. 2000' : 'e.g. 5'}
        />
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Amount ($)</SelectItem>
            <SelectItem value="percentage">Percentage (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </div>
);

const SimpleRuleInput = ({
    label,
    value,
    onValueChange,
    unit,
    isEnabled,
    onToggle
}: {
    label: string;
    value: number;
    onValueChange: (value: number) => void;
    unit: string;
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}) => (
     <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
        <div className="flex items-center justify-between">
            <Label className="font-semibold text-sm">{label}</Label>
            <Switch checked={isEnabled} onCheckedChange={onToggle} />
        </div>
        {isEnabled && (
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    value={String(value)}
                    onChange={(e) => onValueChange(parseInt(e.target.value, 10) || 0)}
                    className="h-8"
                />
                 <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
        )}
    </div>
);


const RuleProgress = ({ title, value, max, format, status, higherIsBetter = false }: { title: string, value: number, max: number, format: 'currency' | 'percentage' | 'number', status: 'normal' | 'warning' | 'breached' | 'passed', higherIsBetter?: boolean }) => {
    const progress = max > 0 ? (value / max) * 100 : 0;
    
    const formattedValue = format === 'currency' ? <FormattedNumber value={value} /> : (format === 'percentage' ? `${value.toFixed(2)}%` : Math.floor(value));
    const formattedMax = format === 'currency' ? <FormattedNumber value={max} /> : format === 'percentage' ? `${max.toFixed(2)}%` : max;

    const percentage = max > 0 ? (value / max) * 100 : 0;

    let colorClass = 'bg-red-500'; 
    let textColorClass = 'text-red-500';

    if (higherIsBetter) { // For Profit Target & Min Days
        if (status === 'passed') { colorClass = 'bg-green-500'; textColorClass = 'text-green-500'; }
        else if (percentage >= 75) { colorClass = 'bg-blue-500'; textColorClass = 'text-blue-500'; }
        else if (percentage >= 50) { colorClass = 'bg-green-500'; textColorClass = 'text-green-500'; }
        else if (percentage >= 25) { colorClass = 'bg-yellow-500'; textColorClass = 'text-yellow-500'; }
        else { colorClass = 'bg-orange-500'; textColorClass = 'text-orange-500'; }
    } else { // For Drawdowns
        if (status === 'breached') { colorClass = 'bg-red-500'; textColorClass = 'text-red-500'; }
        else if (percentage >= 85) { colorClass = 'bg-orange-500'; textColorClass = 'text-orange-500'; }
        else if (percentage >= 60) { colorClass = 'bg-yellow-500'; textColorClass = 'text-yellow-500'; }
        else if (percentage >= 30) { colorClass = 'bg-green-500'; textColorClass = 'text-green-500'; }
        else { colorClass = 'bg-blue-500'; textColorClass = 'text-blue-500'; }
    }


    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span>{title}</span>
                <span className={cn("font-medium flex items-center gap-1", textColorClass)}>
                    {formattedValue} / {formattedMax}
                </span>
            </div>
            <Progress value={progress} className="h-2" colorClassName={colorClass} />
        </div>
    )
};


const JournalRules = ({ journal }: { journal: Journal }) => {
    const { updateJournalRules, resetJournalRules } = useJournalStore();
    
    const [rules, setRules] = useState<RulesType | null>(null);
    
    const { toast } = useToast();

    useEffect(() => {
        if (journal?.rules) {
            const defaultRules = JSON.parse(JSON.stringify(initialJournalRules));
            Object.keys(defaultRules).forEach(key => {
                if ((journal.rules as any)[key] !== undefined) {
                    if (typeof (defaultRules as any)[key] === 'object' && (defaultRules as any)[key] !== null) {
                        (defaultRules as any)[key] = { ...(defaultRules as any)[key], ...(journal.rules as any)[key] };
                    } else {
                        (defaultRules as any)[key] = (journal.rules as any)[key];
                    }
                }
            });
            setRules(defaultRules);
        } else if(journal) {
            setRules(initialJournalRules);
        }
    }, [journal]);

    if (!journal || !rules) return null;

    const handleRuleChange = <T extends keyof RulesType>(ruleName: T, field: keyof RulesType[T], value: any) => {
        setRules(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [ruleName]: {
                    ...prev[ruleName],
                    [field]: value,
                }
            } as RulesType;
        });
    };
    
    const handleSimpleRuleChange = (ruleName: keyof Pick<RulesType, 'minTradingDays' | 'stackingTrades' | 'inactivityLimit' | 'stopLossRequirement' | 'minHoldingTime' | 'bestDayRule' | 'profitableDays' | 'withdrawalTimingDays' | 'weekendHolding'>, field: string, value: any) => {
         setRules(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [ruleName]: {
                    ...prev[ruleName],
                    [field]: value,
                }
            } as RulesType;
        });
    }

    const handleSave = () => {
        if(rules) {
            const sanitizedRules = JSON.parse(JSON.stringify(rules));
            for (const key in sanitizedRules) {
                if (typeof sanitizedRules[key] === 'object' && sanitizedRules[key] !== null && 'value' in sanitizedRules[key]) {
                    sanitizedRules[key].value = parseFloat(String(sanitizedRules[key].value)) || 0;
                }
            }
            updateJournalRules(sanitizedRules);
            toast({
                title: "Rules Saved",
                description: "Your journal rules have been updated.",
            });
        }
    };
    
    const handleReset = () => {
        setRules(initialJournalRules);
    }

    const profitTargetValue = rules.profitTarget.type === 'amount' ? rules.profitTarget.value : (journal.capital * rules.profitTarget.value / 100);
    const profitTargetPhase2Value = rules.profitTargetPhase2?.type === 'amount' ? rules.profitTargetPhase2.value : (journal.capital * (rules.profitTargetPhase2?.value || 0) / 100);
    const maxDrawdownLimit = rules.maxDrawdown.type === 'amount' ? rules.maxDrawdown.value : (journal.capital * rules.maxDrawdown.value / 100);
    const dailyDrawdownLimit = rules.dailyDrawdown.type === 'amount' ? rules.dailyDrawdown.value : (journal.capital * rules.dailyDrawdown.value / 100);
    const trailingDrawdownLimit = rules.trailingDrawdown?.type === 'amount' ? rules.trailingDrawdown.value : (journal.trailingHighWaterMark * (rules.trailingDrawdown?.value || 0) / 100);
    const trailingDailyDrawdownLimit = rules.trailingDailyDrawdown?.type === 'amount' ? rules.trailingDailyDrawdown.value : (journal.peakBalance * (rules.trailingDailyDrawdown?.value || 0) / 100);


    const getMinTradingDaysStatus = () => {
        if (!rules.minTradingDays.enabled) return 'normal';
        if (journal.uniqueTradingDays >= rules.minTradingDays.value) return 'passed';
        return 'normal';
    }
    const getProfitTargetStatus = () => {
        if (!rules.profitTarget.enabled) return 'normal';
        if(journal.currentProfit >= profitTargetValue && getMinTradingDaysStatus() === 'passed') return 'passed';
        return 'normal';
    }
    const getMaxDrawdownStatus = () => {
        if (!rules.maxDrawdown.enabled) return 'normal';
        if (journal.currentMaxDrawdown >= maxDrawdownLimit) return 'breached';
        if (journal.currentMaxDrawdown / maxDrawdownLimit >= 0.8) return 'warning';
        return 'normal';
    }
    const getDailyDrawdownStatus = () => {
        if (!rules.dailyDrawdown.enabled) return 'normal';
        if (journal.currentDailyDrawdown >= dailyDrawdownLimit) return 'breached';
        if (journal.currentDailyDrawdown / dailyDrawdownLimit >= 0.8) return 'warning';
        return 'normal';
    }
    const getTrailingDrawdownStatus = () => {
        if (!rules.trailingDrawdown?.enabled) return 'normal';
        const currentTrailingDD = journal.trailingHighWaterMark - journal.balance;
        if(currentTrailingDD >= trailingDrawdownLimit) return 'breached';
        if(trailingDrawdownLimit > 0 && currentTrailingDD / trailingDrawdownLimit >= 0.8) return 'warning';
        return 'normal';
    }
    const getProfitableDaysStatus = () => {
        if(!rules.profitableDays?.enabled) return 'normal';
        if (journal.profitableDaysCount >= rules.profitableDays.count) return 'passed';
        return 'normal';
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div className="h-full flex flex-col">
                <ScrollArea className="h-full">
                    <Card className="glassmorphic">
                        <CardHeader>
                            <CardTitle className="text-xl">Rule Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="breach">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="breach">Breach Rules</TabsTrigger>
                                    <TabsTrigger value="general">General Rules</TabsTrigger>
                                    <TabsTrigger value="funded">Funded Payout</TabsTrigger>
                                </TabsList>
                                <TabsContent value="breach" className="space-y-4 mt-4">
                                    <RuleInput label="Maximum Drawdown" value={String(rules.maxDrawdown.value)} onValueChange={(v) => handleRuleChange('maxDrawdown', 'value', v)} type={rules.maxDrawdown.type} onTypeChange={(t) => handleRuleChange('maxDrawdown', 'type', t)} isEnabled={rules.maxDrawdown.enabled} onToggle={(e) => handleRuleChange('maxDrawdown', 'enabled', e)} />
                                    <RuleInput label="Daily Drawdown" value={String(rules.dailyDrawdown.value)} onValueChange={(v) => handleRuleChange('dailyDrawdown', 'value', v)} type={rules.dailyDrawdown.type} onTypeChange={(t) => handleRuleChange('dailyDrawdown', 'type', t)} isEnabled={rules.dailyDrawdown.enabled} onToggle={(e) => handleRuleChange('dailyDrawdown', 'enabled', e)} />
                                    <RuleInput label="Trailing Drawdown" value={String(rules.trailingDrawdown?.value || 10)} onValueChange={(v) => handleRuleChange('trailingDrawdown', 'value', v)} type={rules.trailingDrawdown?.type || 'percentage'} onTypeChange={(t) => handleRuleChange('trailingDrawdown', 'type', t)} isEnabled={rules.trailingDrawdown?.enabled || false} onToggle={(e) => handleRuleChange('trailingDrawdown', 'enabled', e)} />
                                    <RuleInput label="Trailing Daily Drawdown" value={String(rules.trailingDailyDrawdown?.value || 7)} onValueChange={(v) => handleRuleChange('trailingDailyDrawdown', 'value', v)} type={rules.trailingDailyDrawdown?.type || 'percentage'} onTypeChange={(t) => handleRuleChange('trailingDailyDrawdown', 'type', t)} isEnabled={rules.trailingDailyDrawdown?.enabled || false} onToggle={(e) => handleRuleChange('trailingDailyDrawdown', 'enabled', e)} />
                                </TabsContent>
                                <TabsContent value="general" className="space-y-4 mt-4">
                                    <RuleInput label="Profit Target (Phase 1)" value={String(rules.profitTarget.value)} onValueChange={(v) => handleRuleChange('profitTarget', 'value', v)} type={rules.profitTarget.type} onTypeChange={(t) => handleRuleChange('profitTarget', 'type', t)} isEnabled={rules.profitTarget.enabled} onToggle={(e) => handleRuleChange('profitTarget', 'enabled', e)} />
                                    {rules.profitTargetPhase2 && <RuleInput label="Profit Target (Phase 2)" value={String(rules.profitTargetPhase2.value)} onValueChange={(v) => handleRuleChange('profitTargetPhase2', 'value', v)} type={rules.profitTargetPhase2.type} onTypeChange={(t) => handleRuleChange('profitTargetPhase2', 'type', t)} isEnabled={rules.profitTargetPhase2.enabled} onToggle={(e) => handleRuleChange('profitTargetPhase2', 'enabled', e)} />}
                                    <SimpleRuleInput label="Minimum Trading Days" value={rules.minTradingDays.value} onValueChange={(v) => handleSimpleRuleChange('minTradingDays', 'value', v)} unit="days" isEnabled={rules.minTradingDays.enabled} onToggle={(e) => handleSimpleRuleChange('minTradingDays', 'enabled', e)} />
                                    <SimpleRuleInput label="Profitable Days Count" value={rules.profitableDays?.count || 0} onValueChange={(v) => handleSimpleRuleChange('profitableDays', 'count', v)} unit="days" isEnabled={rules.profitableDays?.enabled || false} onToggle={(e) => handleSimpleRuleChange('profitableDays', 'enabled', e)} />
                                    <SimpleRuleInput label="Stacking Trades Limit" value={rules.stackingTrades?.limit || 5} onValueChange={(v) => handleSimpleRuleChange('stackingTrades', 'limit', v)} unit="trades" isEnabled={rules.stackingTrades?.enabled || false} onToggle={(e) => handleSimpleRuleChange('stackingTrades', 'enabled', e)} />
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"><Label className="font-semibold text-sm">Weekend Holding</Label><Switch checked={rules.weekendHolding?.enabled || false} onCheckedChange={(e) => handleSimpleRuleChange('weekendHolding', 'enabled', e)} /></div>
                                </TabsContent>
                                <TabsContent value="funded" className="space-y-4 mt-4">
                                    <RuleInput label="Profit Split" value={String(rules.profitSplit?.value || 90)} onValueChange={(v) => handleRuleChange('profitSplit', 'value', v)} type={rules.profitSplit?.type || 'percentage'} onTypeChange={(t) => handleRuleChange('profitSplit', 'type', t)} isEnabled={rules.profitSplit?.enabled || false} onToggle={(e) => handleRuleChange('profitSplit', 'enabled', e)} />
                                    <RuleInput label="Minimum Withdrawal" value={String(rules.minWithdrawal?.value || 5)} onValueChange={(v) => handleRuleChange('minWithdrawal', 'value', v)} type={rules.minWithdrawal?.type || 'percentage'} onTypeChange={(t) => handleRuleChange('minWithdrawal', 'type', t)} isEnabled={rules.minWithdrawal?.enabled || false} onToggle={(e) => handleRuleChange('minWithdrawal', 'enabled', e)} />
                                    <RuleInput label="Max First Payout" value={String(rules.maxFirstPayout?.value || 20)} onValueChange={(v) => handleRuleChange('maxFirstPayout', 'value', v)} type={rules.maxFirstPayout?.type || 'percentage'} onTypeChange={(t) => handleRuleChange('maxFirstPayout', 'type', t)} isEnabled={rules.maxFirstPayout?.enabled || false} onToggle={(e) => handleRuleChange('maxFirstPayout', 'enabled', e)} />
                                    <SimpleRuleInput label="First Withdrawal Timing" value={rules.withdrawalTimingDays?.days || 7} onValueChange={(v) => handleSimpleRuleChange('withdrawalTimingDays', 'days', v)} unit="days" isEnabled={rules.withdrawalTimingDays?.enabled || false} onToggle={(e) => handleSimpleRuleChange('withdrawalTimingDays', 'enabled', e)} />
                                    <SimpleRuleInput label="Best Day Rule" value={rules.bestDayRule?.percentage || 35} onValueChange={(v) => handleSimpleRuleChange('bestDayRule', 'percentage', v)} unit="%" isEnabled={rules.bestDayRule?.enabled || false} onToggle={(e) => handleSimpleRuleChange('bestDayRule', 'enabled', e)} />
                                </TabsContent>
                            </Tabs>
                            <div className="flex justify-between items-center pt-4 border-t">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="text-destructive hover:text-destructive"><RotateCw className="mr-2 h-4 w-4"/> Reset to Defaults</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will reset all rules to their original default values.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooterComponent>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
                                        </AlertDialogFooterComponent>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button className="w-full max-w-xs" onClick={handleSave}>Save Rules</Button>
                            </div>
                        </CardContent>
                    </Card>
                </ScrollArea>
            </div>
             <div className="h-full flex flex-col">
                <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                        <Card className="glassmorphic">
                            <CardHeader>
                                <CardTitle className="text-xl flex justify-between items-center">
                                    Journal Status
                                    <span className={cn(
                                        "text-lg font-bold px-3 py-1 rounded-full",
                                        journal.status === 'Active' && "bg-blue-500/20 text-blue-400",
                                        journal.status === 'Passed' && "bg-green-500/20 text-green-500",
                                        journal.status === 'Failed' && "bg-red-500/20 text-red-500",
                                    )}>{journal.status}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {rules.profitTarget.enabled && (
                                    <RuleProgress title="Profit Target (P1)" value={journal.currentProfit} max={profitTargetValue} format="currency" status={getProfitTargetStatus()} higherIsBetter={true} />
                                )}
                                {rules.profitTargetPhase2?.enabled && (
                                    <RuleProgress title="Profit Target (P2)" value={journal.currentProfit} max={profitTargetPhase2Value} format="currency" status={getProfitTargetStatus()} higherIsBetter={true} />
                                )}
                                {rules.maxDrawdown.enabled && (
                                    <RuleProgress title="Max Drawdown" value={journal.currentMaxDrawdown} max={maxDrawdownLimit} format="currency" status={getMaxDrawdownStatus()} />
                                )}
                                {rules.dailyDrawdown.enabled && (
                                    <RuleProgress title="Daily Drawdown" value={journal.currentDailyDrawdown} max={dailyDrawdownLimit} format="currency" status={getDailyDrawdownStatus()} />
                                )}
                                {rules.trailingDrawdown?.enabled && (
                                    <RuleProgress title="Trailing Drawdown" value={journal.trailingHighWaterMark - journal.balance} max={trailingDrawdownLimit} format="currency" status={getTrailingDrawdownStatus()} />
                                )}
                                {rules.minTradingDays.enabled && (
                                    <RuleProgress title="Min Trading Days" value={journal.uniqueTradingDays} max={rules.minTradingDays.value} format="number" status={getMinTradingDaysStatus()} higherIsBetter={true} />
                                )}
                                {rules.profitableDays?.enabled && (
                                    <RuleProgress title="Profitable Days" value={journal.profitableDaysCount || 0} max={rules.profitableDays.count} format="number" status={getProfitableDaysStatus()} higherIsBetter={true} />
                                )}
                                {rules.stackingTrades?.enabled && (
                                    <div className="text-sm">
                                        <Label>Soft Breaches:</Label>
                                        <span className="font-bold ml-2">{journal.softBreaches || 0} / 3</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                    <Button variant="secondary" className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Restart Challenge
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will reset your challenge progress (P/L, drawdown, trading days) but will keep all your trades and overall account balance. Your journal status will be set to 'Active' to start a new challenge.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooterComponent>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => resetJournalRules()}>Confirm & Restart</AlertDialogAction>
                                </AlertDialogFooterComponent>
                            </AlertDialogContent>
                        </AlertDialog>

                        {journal.status === 'Failed' && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Account Glitch: Rule Breached</AlertTitle>
                                <AlertDescription>
                                    You have breached the <strong>{journal.breachedRule}</strong> rule. Your simulated account has been terminated. Review your trades to understand what went wrong.
                                </AlertDescription>
                            </Alert>
                        )}
                        {journal.status === 'Passed' && (
                            <Alert className="border-green-500/50 text-green-500">
                                <Trophy className="h-4 w-4 text-green-500" />
                                <AlertTitle>Congratulations! Target Reached!</AlertTitle>
                                <AlertDescription>
                                You have successfully reached your profit target and met all other conditions. Well done!
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </ScrollArea>
             </div>
        </div>
    )
}

export default JournalRules;
