
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RatioType = 'sharpe' | 'sortino' | 'profitFactor' | 'calmar' | 'sqn';

type RatioDataPoint = {
    tradeNumber: number;
    value: number;
    tradeObject: Trade;
};

interface PerformanceRatioCoachProps {
    journal: Journal;
    ratioData: RatioDataPoint[];
    selectedRatio: RatioType;
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

const PerformanceRatioCoach = ({ journal, ratioData, selectedRatio }: PerformanceRatioCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!journal || !journal.trades || !ratioData || ratioData.length < 5) {
            return {
                diagnosis: "Awaiting More Data",
                reason: "A meaningful ratio analysis requires at least 5 trades to establish a baseline.",
                action: "Continue logging trades to generate insights."
            };
        }

        const lastPoint = ratioData[ratioData.length - 1];
        const currentRatioValue = lastPoint.value;
        const historicalPeakRatio = Math.max(...ratioData.map(d => d.value));

        const slopeData30 = ratioData.slice(-30).map((d, i) => ({ x: i, y: d.value }));
        const slope30 = calculateSlope(slopeData30);

        // --- General Rules ---
        if (slope30 < -0.05) { // Threshold for a clear downward trend
             return {
                diagnosis: "Your risk-adjusted performance is deteriorating.",
                reason: "The chart shows that your strategy is becoming less efficient. You are either making less profit for the same risk or taking more risk for the same return.",
                action: "Review your last 30 trades. Go to your AI Analyser to find what has changed in your execution or the market.",
                actionPath: '/performance/analytics'
            };
        }
        if (slope30 > 0.05) { // Threshold for a clear upward trend
            return {
                diagnosis: "Your risk-adjusted performance is improving.",
                reason: "The upward trend indicates you are getting better returns for the risk you take. Your edge is strengthening.",
                action: "Excellent work! Analyze your recent winning trades to understand what's driving this improvement and reinforce those behaviors."
            };
        }

        // --- Ratio-Specific Rules ---
        switch(selectedRatio) {
            case 'sharpe':
            case 'sortino':
                if (currentRatioValue > 1) return { diagnosis: "You have a good risk-adjusted return.", reason: "A ratio greater than 1 is considered good, indicating you are being well-compensated for the volatility you are taking on.", action: "Maintain this level of performance. This is the hallmark of a professional trader." };
                if (currentRatioValue < 0.5) return { diagnosis: "Your returns are low for the risk taken.", reason: "Your current ratio suggests your strategy's returns do not adequately compensate for its volatility.", action: "Focus on increasing your average win or decreasing the size of your average loss." };
                break;
            case 'profitFactor':
                if (currentRatioValue > 2) return { diagnosis: "You have an excellent Profit Factor.", reason: `For every $1 you lose, you are making over $${currentRatioValue.toFixed(2)}. This is a very robust edge.`, action: "Your system is highly profitable. Focus on consistent execution." };
                if (currentRatioValue < 1.2) return { diagnosis: "Your Profit Factor is low.", reason: "A low profit factor means your losses are eating up a significant portion of your gains, making your strategy vulnerable to losing streaks.", action: "Aim to increase your average win size or decrease your average loss size." };
                break;
            case 'calmar':
                 if (currentRatioValue > 3) return { diagnosis: "You have an excellent Calmar Ratio.", reason: "Your returns are very high compared to the maximum drawdown your account has experienced. This indicates very efficient performance.", action: "This is a sign of a very strong system. Keep up the great work." };
                if (currentRatioValue < 1) return { diagnosis: "Your returns are low compared to your drawdowns.", reason: "This suggests you are enduring large drawdowns for relatively small gains, which can be psychologically difficult.", action: "Focus on drawdown control. Review your largest losing trades in the Drawdown Chart to find ways to cut losses sooner." };
                break;
            case 'sqn':
                 if (currentRatioValue > 2.5) return { diagnosis: "Your system quality is excellent.", reason: `A System Quality Number (SQN) of ${currentRatioValue.toFixed(2)} indicates a high-quality, reliable trading system.`, action: "You have a statistically sound strategy. Focus on scaling your position size carefully to capitalize on this edge." };
                 if (currentRatioValue < 1.5) return { diagnosis: "Your system quality needs improvement.", reason: "A low SQN suggests your strategy is not consistently profitable or is too volatile. It may not be a reliable system to trade long-term.", action: "This is a critical warning. Re-evaluate your entire strategy, from entry to exit. Use the AI Analytics to find your true edge." };
                break;
        }

        // Default fallback message
        return {
            diagnosis: "Ratio is stable.",
            reason: "Your risk-adjusted performance is within normal parameters.",
            action: "Continue executing your plan and monitor for significant changes."
        };
        
    }, [journal, ratioData, selectedRatio]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Performance Ratio Coach
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

export default PerformanceRatioCoach;

