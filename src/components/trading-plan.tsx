
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { TradingPlanData, Trade } from '@/types';
import TradingPlanEditor from './trading-plan-editor';
import { cn } from '@/lib/utils';
import FormattedNumber from './ui/formatted-number';
import { startOfWeek, startOfMonth, format } from 'date-fns';


const RuleProgressDisplay = ({ label, value, unit, percentage, dollarValue }: { label: string | number; value: React.ReactNode; unit?: string; percentage: number, dollarValue?: number }) => {
    const getProgressColorClasses = (percent: number): string => {
        const p = Math.max(0, Math.min(100, percent));
        if (p >= 90) return 'bg-green-500';
        if (p >= 75) return 'bg-blue-500';
        if (p >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    const barColor = getProgressColorClasses(percentage);
    const valueColor = getProgressColorClasses(percentage).replace('bg-','text-');


    return (
        <div className="p-2 rounded-lg bg-muted/30 relative overflow-hidden h-[50px] flex flex-col justify-between">
             <div className={cn("absolute left-0 top-0 bottom-0 w-1", barColor)} />
            <div className="relative z-10 text-left pl-2">
                <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
                 <span className="text-base font-bold text-foreground/90 block">{value} {unit}</span>
            </div>
             <div className="relative z-10 text-right text-xs font-bold h-4">
                 <div className="absolute inset-x-0 bottom-0 text-right pr-2 flex items-baseline justify-end gap-1">
                    {dollarValue !== undefined && (
                        <span className={cn("text-[9px] font-mono", valueColor)}>
                            (<FormattedNumber value={dollarValue} />)
                        </span>
                    )}
                     <span className={cn("text-[10px] font-bold text-primary-foreground mix-blend-hard-light [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]", barColor.replace('bg-','text-'))}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
};


export default function TradingPlan() {
  const { journals, activeJournalId, updateTradingPlan } = useJournalStore();
  const [isEditing, setIsEditing] = useState(false);

  const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);

  const adherenceStats = useMemo(() => {
    if (!activeJournal || !activeJournal.plan || !activeJournal.trades) {
      return { 
          riskAdherence: 100, 
          instrumentAdherence: 100,
          dailyTradeLimitAdherence: 100,
          dailyLossLimitAdherence: 100,
          weeklyLossLimitAdherence: 100,
          monthlyLossLimitAdherence: 100,
          maxOpenPositionsAdherence: 100,
          minRRAdherence: 100,
          timeAdherence: 100,
          dailyTargetProgress: 0,
          weeklyProfitProgress: 0,
          monthlyProfitProgress: 0,
      };
    }
    const { plan, trades, capital } = activeJournal;
    const realTrades = trades.filter(t => !t.isMissing);
    if (realTrades.length === 0) {
        return { 
          riskAdherence: 100, 
          instrumentAdherence: 100,
          dailyTradeLimitAdherence: 100,
          dailyLossLimitAdherence: 100,
          weeklyLossLimitAdherence: 100,
          monthlyLossLimitAdherence: 100,
          maxOpenPositionsAdherence: 100,
          minRRAdherence: 100,
          timeAdherence: 100,
          dailyTargetProgress: 0,
          weeklyProfitProgress: 0,
          monthlyProfitProgress: 0,
        };
    }
    const totalTrades = realTrades.length;

    // --- Time, Pair, Risk per trade ---
    const riskCompliantTrades = realTrades.filter(t => !t.isMissing && t.auto && t.auto.riskPercent <= plan.riskPerTrade).length;
    const instrumentCompliantTrades = realTrades.filter(t => plan.instruments.includes(t.pair)).length;
    const rrCompliantTrades = realTrades.filter(t => t.auto.rr >= plan.minRiskToReward).length;

    const timeToMinutes = (time: string) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    const timeCompliantTrades = realTrades.filter(t => {
        if (!t.openTime) return true; // Cannot determine compliance without time
        const tradeTimeInMinutes = timeToMinutes(t.openTime);
        const activeHours = plan.activeHours || [];
        const noTradeZones = plan.noTradeZones || [];

        const isInActiveHours = activeHours.length === 0 || activeHours.some(zone => {
            const startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return tradeTimeInMinutes >= startMins || tradeTimeInMinutes <= endMins;
            return tradeTimeInMinutes >= startMins && tradeTimeInMinutes <= endMins;
        });

        if (!isInActiveHours) return false;
        
        const isInNoTradeZone = noTradeZones.some(zone => {
            const startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return tradeTimeInMinutes >= startMins || tradeTimeInMinutes <= endMins;
            return tradeTimeInMinutes >= startMins && tradeTimeInMinutes <= endMins;
        });

        if(isInNoTradeZone) return false;

        return true;
    }).length;

    // --- Group trades by periods ---
    const tradesByDay: { [key: string]: { pl: number, count: number } } = {};
    const tradesByWeek: { [key: string]: { pl: number } } = {};
    const tradesByMonth: { [key: string]: { pl: number } } = {};
    realTrades.forEach(t => {
        if (t.openDate) {
            const date = new Date(t.openDate + "T00:00:00");
            const dayKey = format(date, 'yyyy-MM-dd');
            const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const monthKey = format(startOfMonth(date), 'yyyy-MM');

            tradesByDay[dayKey] = tradesByDay[dayKey] || { pl: 0, count: 0 };
            tradesByDay[dayKey].pl += t.auto.pl;
            tradesByDay[dayKey].count++;
            
            tradesByWeek[weekKey] = tradesByWeek[weekKey] || { pl: 0 };
            tradesByWeek[weekKey].pl += t.auto.pl;

            tradesByMonth[monthKey] = tradesByMonth[monthKey] || { pl: 0 };
            tradesByMonth[monthKey].pl += t.auto.pl;
        }
    });

    const totalDaysTraded = Object.keys(tradesByDay).length;
    const totalWeeksTraded = Object.keys(tradesByWeek).length;
    const totalMonthsTraded = Object.keys(tradesByMonth).length;

    // --- Daily/Weekly/Monthly Limits Adherence ---
    const dailyTradeLimitCompliantDays = Object.values(tradesByDay).filter(d => plan.maxTradesPerDay > 0 && d.count <= plan.maxTradesPerDay).length;
    const dailyLossLimitCompliantDays = Object.values(tradesByDay).filter(d => plan.dailyLossLimit > 0 && -d.pl <= (plan.dailyLossLimit / 100 * capital)).length;
    const weeklyLossLimitCompliantWeeks = Object.values(tradesByWeek).filter(w => plan.weeklyLossLimit > 0 && -w.pl <= (plan.weeklyLossLimit / 100 * capital)).length;
    const monthlyLossLimitCompliantMonths = Object.values(tradesByMonth).filter(m => plan.monthlyLossLimit > 0 && -m.pl <= (plan.monthlyLossLimit / 100 * capital)).length;

    // --- Profit Target Progress ---
    const now = new Date();
    const currentDayKey = format(now, 'yyyy-MM-dd');
    const currentWeekKey = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const currentMonthKey = format(startOfMonth(now), 'yyyy-MM');
    
    const dailyTargetAmount = plan.dailyTargetUnit === '$' ? plan.dailyTarget : (plan.dailyTarget / 100) * activeJournal.balance;
    const weeklyTargetAmount = plan.weeklyProfitLimitUnit === '$' ? plan.weeklyProfitLimit : (plan.weeklyProfitLimit / 100) * activeJournal.balance;
    const monthlyTargetAmount = plan.monthlyProfitLimitUnit === '$' ? plan.monthlyProfitLimit : (plan.monthlyProfitLimit / 100) * activeJournal.balance;

    return {
        riskAdherence: totalTrades > 0 ? (riskCompliantTrades / totalTrades) * 100 : 100,
        instrumentAdherence: totalTrades > 0 ? (instrumentCompliantTrades / totalTrades) * 100 : 100,
        dailyTradeLimitAdherence: totalDaysTraded > 0 ? (dailyTradeLimitCompliantDays / totalDaysTraded) * 100 : 100,
        dailyLossLimitAdherence: totalDaysTraded > 0 ? (dailyLossLimitCompliantDays / totalDaysTraded) * 100 : 100,
        weeklyLossLimitAdherence: totalWeeksTraded > 0 ? (weeklyLossLimitCompliantWeeks / totalWeeksTraded) * 100 : 100,
        monthlyLossLimitAdherence: totalMonthsTraded > 0 ? (monthlyLossLimitCompliantMonths / totalMonthsTraded) * 100 : 100,
        maxOpenPositionsAdherence: 100, // Placeholder
        minRRAdherence: totalTrades > 0 ? (rrCompliantTrades / totalTrades) * 100 : 100,
        timeAdherence: totalTrades > 0 ? (timeCompliantTrades / totalTrades) * 100 : 100,
        dailyTargetProgress: dailyTargetAmount > 0 ? ((tradesByDay[currentDayKey]?.pl || 0) / dailyTargetAmount) * 100 : 0,
        weeklyProfitProgress: weeklyTargetAmount > 0 ? ((tradesByWeek[currentWeekKey]?.pl || 0) / weeklyTargetAmount) * 100 : 0,
        monthlyProfitProgress: monthlyTargetAmount > 0 ? ((tradesByMonth[currentMonthKey]?.pl || 0) / monthlyTargetAmount) * 100 : 0,
    };
  }, [activeJournal]);

  if (!activeJournal || !activeJournal.plan) {
    return null;
  }
  
  const handleSave = (newPlan: TradingPlanData) => {
      updateTradingPlan(newPlan);
      setIsEditing(false);
  }

  const riskPerTradeAmount = activeJournal.plan.riskUnit === '$' ? activeJournal.plan.riskPerTrade : (activeJournal.plan.riskPerTrade / 100) * activeJournal.balance;
  const dailyLossLimitAmount = (activeJournal.plan.dailyLossLimit / 100) * activeJournal.balance;
  const weeklyLossLimitAmount = (activeJournal.plan.weeklyLossLimit / 100) * activeJournal.balance;
  const monthlyLossLimitAmount = (activeJournal.plan.monthlyLossLimit / 100) * activeJournal.balance;

  const dailyTargetAmount = activeJournal.plan.dailyTargetUnit === '$' ? activeJournal.plan.dailyTarget : (activeJournal.plan.dailyTarget / 100) * activeJournal.balance;
  const weeklyTargetAmount = activeJournal.plan.weeklyProfitLimitUnit === '$' ? activeJournal.plan.weeklyProfitLimit : (activeJournal.plan.weeklyProfitLimit / 100) * activeJournal.balance;
  const monthlyTargetAmount = activeJournal.plan.monthlyProfitLimitUnit === '$' ? activeJournal.plan.monthlyProfitLimit : (activeJournal.plan.monthlyProfitLimit / 100) * activeJournal.balance;


  return (
    <div className="space-y-6">
        <Card className="glassmorphic">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Main Plan & Risk Management</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Edit Plan Rules</Button>
                    </div>
                </div>
                <CardDescription>
                    Your core trading rules and risk parameters. These rules directly impact your discipline score.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="glassmorphic">
                    <CardHeader><CardTitle className="text-lg">Tradable Instruments</CardTitle></CardHeader>
                    <CardContent>
                        <RuleProgressDisplay
                            label="Allowed Instruments"
                            value={`${activeJournal.plan.instruments.length} selected`}
                            percentage={adherenceStats.instrumentAdherence}
                        />
                         <div className="flex flex-wrap gap-1 mt-2">
                            {activeJournal.plan.instruments.map(inst => <div key={inst} className="p-1 px-2 bg-muted/50 rounded text-xs">{inst}</div>)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="glassmorphic">
                    <CardHeader><CardTitle className="text-lg">Risk & Accountability</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <RuleProgressDisplay label="Risk Per Trade" value={<FormattedNumber value={activeJournal.plan.riskPerTrade} />} unit={activeJournal.plan.riskUnit} percentage={adherenceStats.riskAdherence} dollarValue={activeJournal.plan.riskUnit === '%' ? riskPerTradeAmount : undefined} />
                        <RuleProgressDisplay label="Daily Loss Limit" value={activeJournal.plan.dailyLossLimit} unit="%" percentage={adherenceStats.dailyLossLimitAdherence} dollarValue={dailyLossLimitAmount}/>
                        <RuleProgressDisplay label="Weekly Loss Limit" value={activeJournal.plan.weeklyLossLimit} unit="%" percentage={adherenceStats.weeklyLossLimitAdherence} dollarValue={weeklyLossLimitAmount} />
                        <RuleProgressDisplay label="Monthly Loss Limit" value={activeJournal.plan.monthlyLossLimit} unit="%" percentage={adherenceStats.monthlyLossLimitAdherence} dollarValue={monthlyLossLimitAmount}/>
                        <RuleProgressDisplay label="Max Trades/Day" value={activeJournal.plan.maxTradesPerDay} unit="trades" percentage={adherenceStats.dailyTradeLimitAdherence} />
                        <RuleProgressDisplay label="Max Open Positions" value={activeJournal.plan.maxOpenPositions} unit="trades" percentage={adherenceStats.maxOpenPositionsAdherence} />
                        <RuleProgressDisplay label="Min R:R" value={`${activeJournal.plan.minRiskToReward}:1`} percentage={adherenceStats.minRRAdherence} />
                        <RuleProgressDisplay label="Daily Target" value={<FormattedNumber value={activeJournal.plan.dailyTarget} />} unit={activeJournal.plan.dailyTargetUnit} percentage={adherenceStats.dailyTargetProgress} dollarValue={dailyTargetAmount} />
                        <RuleProgressDisplay label="Weekly Profit Limit" value={<FormattedNumber value={activeJournal.plan.weeklyProfitLimit} />} unit={activeJournal.plan.weeklyProfitLimitUnit} percentage={adherenceStats.weeklyProfitProgress} dollarValue={weeklyTargetAmount} />
                        <RuleProgressDisplay label="Monthly Profit Limit" value={<FormattedNumber value={activeJournal.plan.monthlyProfitLimit} />} unit={activeJournal.plan.monthlyProfitLimitUnit} percentage={adherenceStats.monthlyProfitProgress} dollarValue={monthlyTargetAmount} />
                    </CardContent>
                </Card>
                 <Card className="glassmorphic">
                    <CardHeader><CardTitle className="text-lg">Trading Hours (NY Time)</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RuleProgressDisplay
                            label="Active Hours Adherence"
                            value={
                                <div>
                                    {(activeJournal.plan.activeHours || []).map((zone, i) => (
                                        <p key={i} className="text-sm text-green-500">{zone.start} - {zone.end}</p>
                                    ))}
                                </div>
                            }
                            percentage={adherenceStats.timeAdherence}
                        />
                        <RuleProgressDisplay
                            label="No-Trade Zone Adherence"
                            value={
                                <div>
                                    {(activeJournal.plan.noTradeZones || []).map((zone, i) => (
                                        <p key={i} className="text-sm text-red-500">{zone.start} - {zone.end}</p>
                                    ))}
                                </div>
                            }
                            percentage={adherenceStats.timeAdherence}
                        />
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
        {activeJournal.plan && (
             <TradingPlanEditor
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                initialPlan={activeJournal.plan}
                onSave={handleSave}
            />
        )}
    </div>
  );
}

    