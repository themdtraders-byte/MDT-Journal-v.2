

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Journal } from '@/types';

type WinRateDataPoint = {
    tradeNumber: number;
    winRate: number;
};

interface WinRateOverTimeCoachProps {
    winrateData: WinRateDataPoint[];
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

const WinrateOverTimeCoach = ({ winrateData }: WinRateOverTimeCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!winrateData || winrateData.length < 10) {
            return {
                diagnosis: "Awaiting More Data",
                reason: "Win rate trend analysis requires at least 10 trades to be meaningful.",
                action: "Continue logging trades to understand how your consistency is evolving."
            };
        }

        const lastPoint = winrateData[winrateData.length - 1];
        const currentWinRate = lastPoint.winRate;

        const slopeData = winrateData.slice(-30).map((d, i) => ({ x: i, y: d.winRate }));
        const slope = calculateSlope(slopeData);

        if (currentWinRate > 60 && slope > 0.1) {
            return {
                diagnosis: "You are in a state of high and improving consistency.",
                reason: `A high win rate combined with an upward trend indicates you are trading in sync with the market and your edge is sharpening.`,
                action: "This is excellent. Analyze what's contributing to this success and continue to apply it. Check your AI Analytics for your best-performing setups.",
                actionPath: "/performance/analytics"
            };
        }
        
        if (currentWinRate < 40 && slope < -0.1) {
            return {
                diagnosis: "Your win rate is low and declining, indicating a problem.",
                reason: "This suggests that your current strategy is not aligned with market conditions, or there are issues with execution and discipline.",
                action: "A review is critical. Go to your R-Distribution chart to see if your few wins are large enough to cover these frequent losses. If not, a strategy overhaul is needed.",
                actionPath: "/performance/chart"
            };
        }

        if (Math.abs(slope) < 0.05 && winrateData.length > 50) {
             return {
                diagnosis: "Your win rate is remarkably stable.",
                reason: `A flat win rate over a large number of trades shows a very consistent and predictable system. You know what to expect.`,
                action: "With a stable win rate, profitability now depends entirely on your Risk-to-Reward ratio. Focus on finding setups with a higher R:R."
            };
        }
        
        return {
            diagnosis: "Win rate is fluctuating.",
            reason: "Your consistency is varied, which is normal for many trading strategies as market conditions change.",
            action: "Look at the chart for periods of rising or falling win rate. Cross-reference those dates in your journal to understand what was happening during those times."
        };
        
    }, [winrateData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Win Rate Coach
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

export default WinrateOverTimeCoach;
