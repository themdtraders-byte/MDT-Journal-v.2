
'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ManagementDataPoint = {
    tradeNumber: number;
    actualR: number;
    potentialR: number;
    tradeObject: Trade;
};

interface TradeManagementCoachProps {
    trades: Trade[];
    managementData: ManagementDataPoint[];
}

const TradeManagementCoach = ({ trades, managementData }: TradeManagementCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!managementData || managementData.length < 5 || !trades || trades.length === 0) {
            return {
                diagnosis: "Awaiting More Data",
                reason: "This analysis requires at least 5 trades with defined SL/TP and MFE/MAE to evaluate management effectiveness.",
                action: "Continue logging trades with MFE/MAE values to unlock insights."
            };
        }

        const lastPoint = managementData[managementData.length - 1];
        const cumulativeGain = lastPoint.actualR - lastPoint.potentialR;
        const totalTradesManaged = trades.filter(t => t.breakeven?.type !== 'No Break Even' || t.hasPartial).length;
        
        // Rule 1: Positive Management Effect
        if (cumulativeGain > 0) {
            return {
                diagnosis: "Your trade management is consistently adding to your profitability.",
                reason: `The chart shows your actual performance is better than what it would be if you simply let trades run. This means your decisions to take partials or move stops are correct.`,
                action: `Excellent work. Your active management is a source of edge. Review the trades where the blue line separated most from the orange line to reinforce what you did right.`
            };
        }

        // Rule 2: Negative Management Effect
        if (cumulativeGain < 0) {
            return {
                diagnosis: "Your trade management is hurting your overall performance.",
                reason: `The chart clearly shows that you would have been more profitable by letting your trades run to their original SL/TP. This suggests you are closing winners too early or moving stops to breakeven prematurely.`,
                action: "Consider being more passive. For your next 10 trades, commit to not interfering with them after entry. Let them hit their original SL or TP and compare the results."
            };
        }

        // Rule 3: Break-even Management
        if (Math.abs(cumulativeGain) < (lastPoint.potentialR * 0.05)) { // If difference is less than 5% of total potential
             return {
                diagnosis: "Your trade management has a neutral impact.",
                reason: "Your interventions are neither significantly helping nor hurting your P/L. You are essentially breaking even on your management decisions.",
                action: "This isn't necessarily bad, but it means active management isn't a source of edge for you right now. Focus on refining your entries and initial SL/TP placement first."
            };
        }
        
        // Default fallback message
        return {
            diagnosis: "Trade management analysis complete.",
            reason: "Analyze the gap between the 'Actual' and 'Potential' performance lines to understand the impact of your in-trade decisions.",
            action: "If the green line is consistently above the orange, your management is helping. If it's below, you might be better off letting trades run."
        };
        
    }, [trades, managementData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Trade Management Coach
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

export default TradeManagementCoach;
