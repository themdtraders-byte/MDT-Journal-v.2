
'use client';

import { useMemo } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type BarData = { 
    name: string; 
    profit: number; 
    loss: number; 
    trades: number;
    winRate: number;
    totalPl: number;
};

interface PerformanceByTimeframeCoachProps {
    data: BarData[];
    timeframe: string;
}

const PerformanceByTimeframeCoach = ({ data, timeframe }: PerformanceByTimeframeCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                diagnosis: "Awaiting Data",
                reason: "The chart needs trade data to analyze performance by time.",
                action: "Log more trades to see which times are most profitable for you."
            };
        }

        const sortedByPl = [...data].sort((a, b) => b.totalPl - a.totalPl);
        const best = sortedByPl[0];
        const worst = sortedByPl[sortedByPl.length - 1];

        // Rule 1: Best time/day
        if (best.totalPl > 0 && best.trades > 5) {
            return {
                diagnosis: `Your most profitable time to trade is during the ${best.name} period.`,
                reason: `You have a clear statistical edge during this time, with a total profit of $${best.totalPl.toFixed(2)} over ${best.trades} trades.`,
                action: `Prioritize taking high-quality setups that appear during the ${best.name} period. This is your "golden hour".`
            };
        }
        
        // Rule 2: Worst time/day
        if (worst.totalPl < 0 && worst.trades > 5) {
             return {
                diagnosis: `You consistently lose money trading during the ${worst.name} period.`,
                reason: `The data shows a clear negative expectancy during this time, with a total loss of $${Math.abs(worst.totalPl).toFixed(2)}.`,
                action: `Avoid trading during the ${worst.name} period. Protecting your capital by not trading is often the most profitable decision.`
            };
        }

        // Rule 3: Scalping is profitable
        const scalpingBuckets = data.filter(d => d.name.includes('m'));
        const totalScalpingPl = scalpingBuckets.reduce((sum, d) => sum + d.totalPl, 0);
        if (totalScalpingPl > 0 && data.find(d => d.name.includes('h'))?.totalPl < 0) {
            return {
                diagnosis: "You excel at short-term scalping.",
                reason: "Your data shows you are profitable on trades lasting less than an hour, but you lose money on longer-term trades.",
                action: "Embrace your inner scalper. Focus on strategies that aim for quick profits and avoid holding positions for multiple hours."
            };
        }
        
        // Rule 4: Swing trading is profitable
        const swingBuckets = data.filter(d => d.name.includes('h'));
        const totalSwingPl = swingBuckets.reduce((sum, d) => sum + d.totalPl, 0);
        if (totalSwingPl > 0 && data.find(d => d.name.includes('m'))?.totalPl < 0) {
            return {
                diagnosis: "You are a successful swing trader.",
                reason: "Your data reveals that your edge appears on longer holding times. You lose money on short-term 'noise'.",
                action: "Be patient and let your trades breathe. Avoid the temptation to scalp and focus on setups that develop over several hours or more."
            };
        }

        // Default message
        return {
            diagnosis: "Performance by time is varied.",
            reason: "Your profitability is spread across different times, with no single period standing out as exceptionally good or bad.",
            action: "Continue to monitor this chart as you log more trades to see if a clearer pattern emerges."
        };
        
    }, [data, timeframe]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Timeframe Coach
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

export default PerformanceByTimeframeCoach;
