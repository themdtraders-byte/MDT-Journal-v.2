
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type EquityDataPoint = { date: string; balance: number; trade: number };

interface EquityCurveCoachProps {
    journal: Journal;
    equityData: EquityDataPoint[];
}

const calculateSlope = (data: { x: number, y: number }[]): number => {
    if (data.length < 2) return 0;
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.x, 0);
    const sumY = data.reduce((sum, d) => sum + d.y, 0);
    const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = n * sumX2 - sumX * sumX;

    return denominator === 0 ? 0 : numerator / denominator;
};

const EquityCurveCoach = ({ journal, equityData }: EquityCurveCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!journal || !journal.trades || journal.trades.length === 0 || !equityData || equityData.length === 0) {
            return {
                diagnosis: "Awaiting Data",
                reason: "The equity curve coach needs trade data to provide insights.",
                action: "Log your trades to see personalized feedback on your performance trends."
            };
        }

        const { trades, capital, initialDeposit, peakBalance, currentMaxDrawdown, createdAt } = journal;
        const totalTrades = trades.length;
        const currentBalance = equityData[equityData.length - 1]?.balance || initialDeposit;

        // Rule Data
        const last5Trades = trades.slice(-5);
        const last5TradesProfit = last5Trades.length === 5 && last5Trades.every(t => t.auto.pl > 0);
        const last5TradesLoss = last5Trades.length === 5 && last5Trades.every(t => t.auto.pl < 0);
        
        const firstTradeDate = new Date(trades[0]?.openDate || createdAt);
        const accountAgeDays = Math.ceil((new Date().getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const maxDrawdownPercent = journal.peakBalance > 0 ? (journal.currentMaxDrawdown / journal.peakBalance) * 100 : 0;
        const historicalDrawdowns = journal.ruleHistory?.map(h => h.status === 'Failed' ? h.startingCapital || 0 : 0).filter(Boolean) || [];
        const historicalMaxDrawdownPercent = historicalDrawdowns.length > 0 ? Math.max(...historicalDrawdowns) : maxDrawdownPercent;
        
        const slopeData30 = equityData.slice(-30).map((d, i) => ({ x: i, y: d.balance }));
        const equitySlope30Trades = calculateSlope(slopeData30);
        
        const slopeData100 = equityData.slice(-100).map((d, i) => ({ x: i, y: d.balance }));
        const equitySlope100Trades = calculateSlope(slopeData100);

        // --- Start Rule Evaluation ---
        
        // New All-Time High
        if (currentBalance > peakBalance && totalTrades > 50) {
            return {
                diagnosis: "Congratulations! You've just reached a new all-time high.",
                reason: "This is a monumental achievement and confirms your strategy has a clear edge. Your ability to recover from past losses and hit a new peak shows discipline.",
                action: "Take a screenshot of this moment. Go to your Drawdown Chart to review the historical risks of your strategy and prepare for future pullbacks.",
                actionPath: '/performance/chart' // Navigate to drawdown chart (in future)
            };
        }
        if (currentBalance > peakBalance && equitySlope30Trades > 0.5) {
             return {
                diagnosis: "Your recent performance is exceptionally strong.",
                reason: "The sharp upward slope indicates a period of high profitability. Your last 30 trades have been a major growth phase for your account.",
                action: "Review the specific trades from this period. Go to your AI Analyser to find the setups, times, and pairs that contributed to this success. Double down on what's working.",
                actionPath: '/performance/analytics'
            };
        }

        // Drawdown & Loss Rules
        if (currentMaxDrawdown > 0.8 * historicalMaxDrawdownPercent * capital / 100 && currentMaxDrawdown > capital * 0.05) {
             return {
                diagnosis: "Warning: You are in a critical drawdown period.",
                reason: "Your account is approaching or has exceeded its historical worst losing streak. This is a red flag that requires immediate attention. It could be due to a significant change in the market or a series of rule violations.",
                action: "I highly recommend you stop trading immediately and take a break. Do not attempt to make back your losses. Go to the Consecutive Losses Chart to see if this is a statistically normal event for your strategy.",
                actionPath: '/performance/chart' // Navigate to streaks chart
            };
        }
        if (currentMaxDrawdown < capital * 0.05 && totalTrades > 30) {
            return {
                diagnosis: "You are in a normal, statistically expected pullback.",
                reason: "Drawdowns are a regular part of trading. This minor dip is well within your historical norms. There is no cause for concern as long as you stick to your plan.",
                action: "Maintain your discipline. Check the Consecutive Losses Chart to confirm this is a typical losing streak for your strategy.",
                actionPath: '/performance/chart'
            };
        }
        if (equitySlope100Trades < -0.1 && totalTrades > 150) {
             return {
                diagnosis: "Your strategy shows a long-term negative trend.",
                reason: "Your account has been consistently losing money for a significant period. The current system lacks a statistical edge and needs a major overhaul.",
                action: "You must stop trading and begin a full strategy review. Go to the Expectancy Chart to confirm that your system has a negative long-term expectation.",
                actionPath: '/performance/chart'
            };
        }
        if (last5TradesLoss && currentMaxDrawdown > capital * 0.02) {
             return {
                diagnosis: "You are in the middle of a losing streak.",
                reason: "The last five trades were all losses, causing a slight dip in your equity curve. This can be emotionally difficult.",
                action: "Before your next trade, review your last three trade setups. Do not let this streak cause you to break your rules. Go to your PCP/PCR charts to see if you are letting losing trades get out of hand.",
                actionPath: '/performance/chart'
            };
        }
        
        // Default message if no other rules are met
        return {
            diagnosis: "Equity curve is stable.",
            reason: "Your performance is within normal parameters. Continue executing your plan.",
            action: "Use the global filters to drill down into specific pairs or strategies to find micro-edges."
        };

    }, [journal, equityData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Equity Curve Coach
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><Award className="text-yellow-500" /> Diagnosis</h4>
                    <p className="text-sm text-muted-foreground italic">"{analysis.diagnosis}"</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><TrendingUp className="text-green-500" /> Reason</h4>
                    <p className="text-sm text-muted-foreground">{analysis.reason}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-base flex items-center gap-2"><TrendingDown className="text-red-500" /> Actionable Step</h4>
                    <p className="text-sm text-muted-foreground">{analysis.action}</p>
                </div>
                {analysis.actionPath && (
                    <div className="text-right">
                        <Button size="sm" onClick={() => router.push(analysis.actionPath!)}>Go to {analysis.actionPath.split('/').pop()}</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EquityCurveCoach;
