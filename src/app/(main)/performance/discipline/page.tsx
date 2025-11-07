
'use client';

import { useMemo } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Trade, Journal, AppSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Ban, BarChart2, Brain, CheckCircle, Heart, XCircle, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type DailyFinding = {
    type: 'Sentiment' | 'Rule Breach' | 'Risk' | 'Strategy';
    message: string;
    tradeId: string;
    level: 'warning' | 'critical';
};

type DailyAudit = {
    date: string;
    followedPlan: boolean;
    findings: DailyFinding[];
    tradeCount: number;
    totalPl: number;
};

const getFindingConfig = (finding: DailyFinding) => {
    switch (finding.type) {
        case 'Sentiment': return { icon: Heart, color: 'text-yellow-500' };
        case 'Rule Breach': return { icon: Ban, color: 'text-orange-500' };
        case 'Risk': return { icon: AlertCircle, color: 'text-red-500' };
        case 'Strategy': return { icon: Brain, color: 'text-blue-500' };
        default: return { icon: Info, color: 'text-muted-foreground' };
    }
}

const DailyAuditCard = ({ audit }: { audit: DailyAudit }) => {
    const { followedPlan, findings, date, tradeCount, totalPl } = audit;
    const Icon = followedPlan ? CheckCircle : XCircle;

    return (
        <Card className="glassmorphic">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</CardTitle>
                <div className={`flex items-center gap-2 font-semibold ${followedPlan ? 'text-green-500' : 'text-red-500'}`}>
                    <Icon className="h-5 w-5" />
                    <span>{followedPlan ? 'Plan Followed' : 'Plan Deviated'}</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                    {tradeCount} trades | Total P/L: ${totalPl.toFixed(2)}
                </div>
                {findings.length > 0 ? (
                    <div className="space-y-3">
                        {findings.map((finding, index) => {
                             const { icon: FindingIcon, color } = getFindingConfig(finding);
                            return (
                                <div key={index} className="flex items-start gap-3 text-xs">
                                    <FindingIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                                    <p className="text-muted-foreground">{finding.message} <Badge variant="outline" className="text-xs">{finding.tradeId}</Badge></p>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-4 text-sm text-green-500">
                        <CheckCircle className="mx-auto h-8 w-8 mb-2"/>
                        <p>Excellent Discipline! No issues found for this day.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function DisciplinePage() {
    const { journals, activeJournalId, appSettings } = useJournalStore(state => ({
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        appSettings: state.appSettings
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);


    const dailyAudits = useMemo(() => {
        if (!activeJournal || !appSettings) return [];

        const tradesByDay: Record<string, Trade[]> = {};
        activeJournal.trades.forEach(trade => {
            if (!tradesByDay[trade.openDate]) {
                tradesByDay[trade.openDate] = [];
            }
            tradesByDay[trade.openDate].push(trade);
        });

        return Object.entries(tradesByDay)
            .map(([date, trades]): DailyAudit => {
                let overallPlanFollowed = true;
                const findings: DailyFinding[] = [];

                trades.forEach(trade => {
                    const isPlanFollowedForTrade = trade.auto.score.value >= 80;
                    if (!isPlanFollowedForTrade) {
                        overallPlanFollowed = false;
                    }

                    // 1. Sentiments
                    const negativeSentiments = appSettings.keywordScores
                        .filter(ks => ks.effect === 'Negative' && ks.type === 'Sentiment')
                        .map(ks => ks.keyword);
                    
                    const tradeSentiments = new Set([...(trade.sentiment?.Before || []), ...(trade.sentiment?.During || []), ...(trade.sentiment?.After || [])]);
                    
                    tradeSentiments.forEach(sentiment => {
                        if (negativeSentiments.includes(sentiment)) {
                            findings.push({ type: 'Sentiment', message: `Negative sentiment recorded: "${sentiment}"`, tradeId: trade.id, level: 'warning' });
                        }
                    });

                    // 2. Rule Breaches
                    const remarks = trade.auto.score.remark.split('. ').filter(r => r && r !== 'Excellent discipline!');
                    remarks.forEach(remark => {
                         findings.push({ type: 'Rule Breach', message: remark, tradeId: trade.id, level: 'critical' });
                    });
                    
                    // 3. Risk Management
                    const maxRisk = activeJournal.plan.riskUnit === '%' ? activeJournal.capital * (activeJournal.plan.riskPerTrade / 100) : activeJournal.plan.riskPerTrade;
                    const tradeRisk = (trade.auto.riskPercent / 100) * activeJournal.capital;
                    if (tradeRisk > maxRisk * 1.1) { // 10% tolerance
                         findings.push({ type: 'Risk', message: `Exceeded max risk per trade. Risked ${trade.auto.riskPercent.toFixed(1)}% vs planned ${activeJournal.plan.riskPerTrade}%.`, tradeId: trade.id, level: 'critical' });
                    }
                    
                    // 4. Strategy Fulfillment
                    if (trade.selectedRuleIds && trade.selectedRuleIds.length === 0 && trade.strategy) {
                        findings.push({ type: 'Strategy', message: `No strategy rules were selected for the "${trade.strategy}" strategy.`, tradeId: trade.id, level: 'warning' });
                    }

                });

                return {
                    date,
                    findings,
                    followedPlan: overallPlanFollowed,
                    tradeCount: trades.length,
                    totalPl: trades.reduce((sum, t) => sum + t.auto.pl, 0),
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [activeJournal, appSettings]);

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 /> Daily Discipline Audit</h1>
             <p className="text-muted-foreground">
                A day-by-day breakdown of your adherence to your trading plan. Each card highlights negative sentiments, rule breaches, and risk management issues to help you pinpoint areas for improvement.
            </p>
            <ScrollArea className="h-[70vh] pr-4 -mr-4">
                <div className="space-y-4">
                    {dailyAudits.length > 0 ? (
                        dailyAudits.map(audit => <DailyAuditCard key={audit.date} audit={audit} />)
                    ) : (
                         <div className="text-center py-24 border-2 border-dashed rounded-lg glassmorphic">
                             <p className="text-muted-foreground">
                                Log some trades to see your daily discipline audit.
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
