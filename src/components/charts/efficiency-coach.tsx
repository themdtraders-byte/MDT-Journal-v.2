
'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type EfficiencyDataPoint = {
    tradeNumber: number;
    cumulativeR: number;
    profitPerHour: number;
    costPerTrade: number;
    profitPerTrade: number;
    tradeObject: Trade;
};

interface EfficiencyCoachProps {
    trades: Trade[];
    efficiencyData: EfficiencyDataPoint[];
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

const EfficiencyCoach = ({ trades, efficiencyData }: EfficiencyCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!efficiencyData || efficiencyData.length < 5) {
             return {
                diagnosis: "Awaiting More Data",
                reason: "Efficiency analysis requires a larger sample size to provide meaningful insights.",
                action: "Continue logging trades to unlock insights into your cost-effectiveness and time efficiency."
            };
        }
        
        const last30TradesData = efficiencyData.slice(-30);
        const profitSlope = calculateSlope(last30TradesData.map((d, i) => ({ x: i, y: d.profitPerTrade })));
        const costSlope = calculateSlope(last30TradesData.map((d, i) => ({ x: i, y: d.costPerTrade })));
        const averageProfitPerTrade = efficiencyData[efficiencyData.length - 1].profitPerTrade;
        const averageCostPerTrade = efficiencyData[efficiencyData.length - 1].costPerTrade;

        // Rule 1: High Profit and Low Cost
        if (averageProfitPerTrade > 0 && averageCostPerTrade < averageProfitPerTrade * 0.1) {
            return {
                diagnosis: "Your trading is highly efficient.",
                reason: "Your trading costs are a very small drag on your overall profitability. You are getting a lot of profit for every dollar you spend on fees.",
                action: "This is a great sign. Continue to focus on execution. Go to the Expectancy Chart to see if your edge is growing over time.",
                actionPath: '/performance/chart'
            };
        }

        // Rule 2: Low Profit and High Cost
        if (averageProfitPerTrade > 0 && averageCostPerTrade > averageProfitPerTrade * 0.5) {
            return {
                diagnosis: "Your trading is inefficient.",
                reason: "A large portion of your gross profit is being eaten by fees. You are doing a lot of work for very little net gain.",
                action: "You must find a way to reduce your trading costs. Go to AI Analytics to find which assets have the highest fees, or consider a broker with lower commissions.",
                actionPath: '/performance/analytics'
            };
        }

        // Rule 3: Declining Efficiency
        if (profitSlope < 0 && costSlope > 0) {
             return {
                diagnosis: "Your trading efficiency is deteriorating.",
                reason: "Your profits per trade are shrinking while your costs are rising. This could be due to changing market conditions or poor trades with high fees.",
                action: "Review your last 30 trades. Go to the Data Table and sort by P/L and commission to identify high-cost trades.",
                actionPath: '/data/table'
            };
        }
        
        // Default message
        return {
            diagnosis: "Efficiency Analysis Complete.",
            reason: "Your cost-to-profit ratio is within a normal range for your strategy.",
            action: "Continue executing your plan and monitor for any significant changes in your cost structure or profit per trade."
        };
        
    }, [trades, efficiencyData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Efficiency Coach
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

export default EfficiencyCoach;
