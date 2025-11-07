
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ExpectancyDataPoint = {
    tradeNumber: number;
    expectancy: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    tradeObject: Trade;
};

interface ExpectancyCurveCoachProps {
    journal: Journal;
    expectancyData: ExpectancyDataPoint[];
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

const ExpectancyCurveCoach = ({ journal, expectancyData }: ExpectancyCurveCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        const totalTrades = journal.trades.length;
        if (totalTrades < 5) {
            return {
                diagnosis: "Your journey has just begun.",
                reason: "With a small sample size, your expectancy chart will swing wildly. Avoid drawing conclusions at this stage.",
                action: "Focus on following your rules and logging trades. Your expectancy will become more reliable as you gather more data."
            };
        }

        const lastPoint = expectancyData[expectancyData.length - 1];
        const currentExpectancy = lastPoint.expectancy;
        const currentWinRate = lastPoint.winRate;

        const slopeData30 = expectancyData.slice(-30).map((d, i) => ({ x: i, y: d.expectancy }));
        const slope30 = calculateSlope(slopeData30);

        const slopeData50 = expectancyData.slice(-50).map((d, i) => ({ x: i, y: d.expectancy }));
        const slope50 = calculateSlope(slopeData50);
        
        // Rule 1: Positive and Rising Expectancy
        if (currentExpectancy > 0 && slope50 > 0) {
            return {
                diagnosis: "Your strategy has a strong and growing positive expectancy.",
                reason: "This is the ultimate sign of a profitable strategy. Your edge is not only positive, but it appears to be getting stronger over time.",
                action: "Continue to focus on execution. Trust your process. Go to the R-Distribution Chart to confirm that your winners are consistently larger than your losers.",
                actionPath: '/performance/chart'
            };
        }

        // Rule 2: Positive but Declining Expectancy
        if (currentExpectancy > 0 && slope30 < 0) {
            return {
                diagnosis: "Your expectancy is deteriorating.",
                reason: "While your system is still profitable overall, its edge is shrinking in the short term. This could be due to changing market conditions or a decline in discipline.",
                action: "Review your recent trades. Go to the AI Analyser to find specific setups that are dragging down your performance and consider pausing them.",
                actionPath: '/performance/analytics'
            };
        }
        
        // Rule 3: Negative Expectancy
        if (currentExpectancy < 0) {
            return {
                diagnosis: "Your strategy has a negative expectancy.",
                reason: "This is a critical finding. It means that on average, every trade you take is costing you money. The more you trade, the more you will lose.",
                action: "You must stop trading immediately. Do not take another trade. Go to the R-Distribution Chart to identify if the problem is too many small losses, or a few large, uncontrolled losses.",
                actionPath: '/performance/chart'
            };
        }

        // Rule 4: Break-Even Expectancy
        if (Math.abs(currentExpectancy) < (journal.capital * 0.001)) { // Close to zero, relative to capital
             return {
                diagnosis: "You are currently trading at a break-even expectancy.",
                reason: "Your system is neither consistently making nor losing money. Your wins are roughly equal to your losses, and trading costs are likely preventing profitability.",
                action: "Focus on reducing trading costs. Go to the Equity Chart and analyze the impact of fees. Your edge might be positive on a gross basis but not on a net basis."
            };
        }

         // Rule 6: Low Expectancy, High Win Rate
        if (currentWinRate > 60 && currentExpectancy > 0 && currentExpectancy < (journal.capital * 0.005)) {
             return {
                diagnosis: "You are cutting your winners short.",
                reason: "Your high win rate shows you are good at picking trades, but your low expectancy means you are not letting your profitable trades run long enough.",
                action: "Focus on your risk-to-reward ratio. Go to the R-Distribution Chart to see if your winning trades are clustered around a low R-value, like 1R. You need to let your winners get to 2R and higher.",
                 actionPath: '/performance/chart'
            };
        }
        
        // Rule 16: Consistent Expectancy
        if (totalTrades > 100 && Math.abs(slope50) < 0.05) { // Very flat slope
            return {
                diagnosis: "Your strategy is exceptionally consistent.",
                reason: "A flat, positive expectancy over many trades is a sign of a robust and reliable system. Your results are predictable.",
                action: "You have a solid foundation. Consider a small, incremental increase in your position size to scale your profits."
            };
        }


        // Default fallback message
        return {
            diagnosis: "Expectancy is stable.",
            reason: "Your performance is within normal parameters. Continue executing your plan.",
            action: "Use the global filters to drill down into specific pairs or strategies to find micro-edges."
        };
        
    }, [journal, expectancyData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Expectancy Coach
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

export default ExpectancyCurveCoach;
