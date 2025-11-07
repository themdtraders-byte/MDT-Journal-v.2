
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RDistributionData {
  name: string;
  count: number;
  totalPl: number;
}

interface RDistributionCoachProps {
    trades: Trade[];
    r_data: RDistributionData[];
}

const RDistributionCoach = ({ trades, r_data }: RDistributionCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!r_data || r_data.length === 0 || !trades || trades.length === 0) {
            return {
                diagnosis: "Awaiting Data",
                reason: "Log trades with a defined stop-loss to generate R-Distribution insights.",
                action: "Ensure your trades have a stop-loss price to enable R-multiple calculation."
            };
        }

        const total_trades = trades.length;
        const grossProfit = trades.filter(t => t.auto.pl > 0).reduce((sum, t) => sum + t.auto.pl, 0);
        const grossLoss = Math.abs(trades.filter(t => t.auto.pl < 0).reduce((sum, t) => sum + t.auto.pl, 0));
        const p_l_ratio = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

        const realizedRs = trades.map(trade => {
            const riskAmount = (trade.auto.riskPercent / 100) * trade.entryPrice * trade.lotSize;
            if (riskAmount > 0) return trade.auto.pl / riskAmount;
            return 0;
        }).filter(r => r !== 0);

        const average_r = realizedRs.length > 0 ? realizedRs.reduce((sum, r) => sum + r, 0) / realizedRs.length : 0;
        const max_r_win = Math.max(0, ...realizedRs);
        const max_r_loss = Math.min(0, ...realizedRs);
        const percent_of_positive_r_trades = (realizedRs.filter(r => r > 0).length / realizedRs.length) * 100;
        
        const trades_gt_2r = r_data.filter(d => parseInt(d.name) > 2).reduce((sum, d) => sum + d.count, 0);
        const trades_lt_neg_1r = r_data.filter(d => parseInt(d.name) < -1).reduce((sum, d) => sum + d.count, 0);
        
        // Rule 1: The "Fat Tail" (Ideal Distribution)
        if (percent_of_positive_r_trades > 40 && trades_gt_2r > trades_lt_neg_1r) {
            return {
                diagnosis: "Your strategy has a strong positive edge with a 'fat tail'.",
                reason: "This is the ideal distribution. It means you're cutting losses short and letting winners run, allowing a small number of big wins to more than make up for your smaller, frequent losses.",
                action: "Continue to focus on execution and risk management. Your chart proves your system works. Go to your Holding Time Chart to ensure you are not exiting your big winners prematurely."
            };
        }

        // Rule 3: The "Long-Tail" of Losers
        if (trades_lt_neg_1r > trades_gt_2r) {
            return {
                diagnosis: "Your strategy is suffering from a long tail of big losses.",
                reason: "This chart shows that a few large, uncontrolled losses are wiping out your consistent, smaller wins. This indicates a problem with risk management or discipline.",
                action: "Review your largest losing trades (at -2R and beyond). Find out why you are allowing losses to get this big. Go to your Drawdown Chart to see the impact of these losses on your equity."
            };
        }
        
        // Rule 5: Consistent Small Wins, No Big Wins
        const mostFrequentBucket = [...r_data].sort((a,b) => b.count - a.count)[0];
        if (mostFrequentBucket?.name === '1R' && trades_gt_2r < total_trades * 0.05) {
             return {
                diagnosis: "You are cutting your winners short.",
                reason: "Your distribution shows that you are very good at capturing a quick 1R profit, but you are not letting your profitable trades run to maximize their potential.",
                action: "Review your trade log and find trades closed at 1R. Could you have moved your stop to breakeven and let the trade run? Your PCP/PCR charts will confirm this issue."
            };
        }
        
        // Rule 6: Consistent Full-Stop Losses
        if (mostFrequentBucket?.name === '-1R' && percent_of_positive_r_trades < 50) {
            return {
                diagnosis: "Your primary issue is a high frequency of full stop-loss hits.",
                reason: "This shows that your entry criteria or stop-loss placement is flawed. A majority of your trades are going against you by a full risk unit.",
                action: "Do not move your stop-loss. Instead, review your last 10 losing trades. What was the common setup? Find a pattern and refine your entry rules."
            }
        }
        
        // Rule 8: Profitability Through Big Wins
        if (p_l_ratio > 1 && r_data.find(d => d.name === '1R')?.count < r_data.find(d => d.name === '-1R')?.count) {
             return {
                diagnosis: "Your profitability is dependent on a few massive winners.",
                reason: "You lose more often than you win, but a few 'home run' trades are keeping your account profitable. This is a legitimate strategy, but it can be psychologically challenging.",
                action: "Understand that this volatility is normal for your strategy. Trust your system and avoid emotional trading during long losing streaks. Your Consecutive Losses Chart can help you prepare."
            };
        }

        // Rule 14: Outlier Loss (A Major Problem)
        if (max_r_loss < -3 && Math.abs(max_r_loss) > Math.abs(average_r) * 3) {
            return {
                diagnosis: "A single massive loss is destroying your profitability.",
                reason: "This single event is likely the main reason you are not profitable. This indicates a complete failure of your risk management on that specific trade.",
                action: "Go to your trade log and find this trade. Analyze why your stop-loss was not respected or why it was not used. You must address this immediately to protect your capital."
            };
        }

        // Default fallback
        return {
            diagnosis: "Distribution Analysis",
            reason: "The R-Distribution chart visualizes the return of your trades in multiples of your initial risk, providing a clear picture of your strategy's edge.",
            action: "Look for a 'fat tail' on the right (green bars), which indicates large wins are covering your losses. A large cluster of red bars at -1R might suggest your stop losses are too tight or entries are premature."
        };

    }, [trades, r_data]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    R-Distribution Coach
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
            </CardContent>
        </Card>
    );
};

export default RDistributionCoach;
