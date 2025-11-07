
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

interface HoldingTimeCoachProps {
    data: BarData[];
}

const HoldingTimeCoach = ({ data }: HoldingTimeCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                diagnosis: "Awaiting Data",
                reason: "The chart needs trade data to analyze performance by holding time.",
                action: "Log more trades to see which trade durations are most profitable for you."
            };
        }

        const sortedByPl = [...data].sort((a, b) => b.totalPl - a.totalPl);
        const bestTimeframe = sortedByPl[0];
        const worstTimeframe = sortedByPl[sortedByPl.length - 1];

        // Rule 1: Clear profitable timeframe
        if (bestTimeframe.totalPl > 0 && bestTimeframe.winRate > 55) {
            return {
                diagnosis: `Your "sweet spot" is trading within the ${bestTimeframe.name} timeframe.`,
                reason: `This duration is your most profitable, with a solid win rate of ${bestTimeframe.winRate.toFixed(1)}%. It aligns perfectly with your strategy's natural rhythm.`,
                action: `Focus on setups that are likely to resolve within this timeframe. This is your proven edge.`
            };
        }
        
        // Rule 2: Clear unprofitable timeframe
        if (worstTimeframe.totalPl < 0 && worstTimeframe.trades > 5) {
             return {
                diagnosis: `You consistently lose money on trades held for ${worstTimeframe.name}.`,
                reason: `Holding trades for this duration is where your strategy breaks down, resulting in consistent losses.`,
                action: `Avoid letting trades run this long. If a trade enters this duration, consider cutting the loss or taking a small profit. This is a clear leak in your performance.`
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
            diagnosis: "Holding time analysis complete.",
            reason: "Review the bar chart to see which trade durations have the highest green bars (profit) and the lowest red bars (loss).",
            action: "Identify your most profitable holding time and try to focus on trade setups that align with that duration."
        };
        
    }, [data]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Holding Time Coach
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

export default HoldingTimeCoach;
