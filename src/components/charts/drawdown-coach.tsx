
'use client';

import { useMemo } from 'react';
import type { Journal, Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DrawdownDataPoint = {
    date: string;
    drawdown: number;
    balance: number;
    peakBalance: number;
    trade: number;
    tradeObject: Trade | null;
};

interface DrawdownCoachProps {
    journal: Journal;
    drawdownData: DrawdownDataPoint[];
}

const DrawdownCoach = ({ journal, drawdownData }: DrawdownCoachProps) => {
    const router = useRouter();

    const analysis = useMemo(() => {
        if (!journal || !journal.trades || journal.trades.length === 0 || !drawdownData || drawdownData.length < 5) {
             return {
                diagnosis: "Awaiting More Data",
                reason: "A small number of trades can lead to volatile results. A meaningful drawdown analysis requires more trade history.",
                action: "Continue to focus on disciplined execution. More data is needed to provide a robust analysis of your drawdown periods."
            };
        }
        
        const lastDataPoint = drawdownData[drawdownData.length - 1];
        const allTrades = journal.trades;
        
        const currentDrawdownAbsolute = Math.abs(lastDataPoint.drawdown);
        const peakBalance = lastDataPoint.peakBalance;
        const currentDrawdownPercent = peakBalance > 0 ? (currentDrawdownAbsolute / peakBalance) * 100 : 0;
        
        const maxHistoricalDrawdown = journal.ruleHistory?.reduce((max, h) => Math.max(max, h.status === 'Failed' ? (h.startingCapital ? h.startingCapital * 0.1 : 0) : 0), 0) || 0; // Simplified
        const maxDrawdownPercent = journal.peakBalance > 0 ? (journal.currentMaxDrawdown / journal.peakBalance) * 100 : 0;


        // Rule 1: All-Time High Drawdown
        if (currentDrawdownPercent > maxDrawdownPercent && maxDrawdownPercent > 0) {
            return {
                diagnosis: "You are currently in a record-breaking drawdown.",
                reason: "This is the deepest and most challenging losing period your account has ever faced. It's a critical moment that requires immediate review of your strategy and risk management.",
                action: "Step away from the charts. Do not attempt to trade your way out of this. Go to your AI Analyser to find the specific setups or market conditions that are causing this significant loss. Your most important job right now is to protect your remaining capital.",
                actionPath: '/performance/analytics'
            };
        }

        // Rule 2: Approaching Maximum Drawdown
        if (currentDrawdownPercent >= 0.8 * maxDrawdownPercent && maxDrawdownPercent > 0) {
            return {
                diagnosis: "Your drawdown is approaching its historical maximum.",
                reason: "You are nearing the deepest point your account has ever been in. Your strategy and psychology are being put to the ultimate test.",
                action: "Stay calm and stick to your rules. This is where most traders fail. Go to the Consecutive Losses Chart to see if this is a normal losing streak for your strategy, and remind yourself that recovery is possible.",
                actionPath: '/performance/chart'
            };
        }
        
        // Rule 3: Normal Drawdown
        if (currentDrawdownPercent > 0 && currentDrawdownPercent < 0.5 * maxDrawdownPercent && maxDrawdownPercent > 0) {
             return {
                diagnosis: "You are in a normal, expected drawdown.",
                reason: `Pullbacks are a regular part of any trading strategy. This dip is within your historical norms.`,
                action: "Trust your system. The Equity Chart shows that profitable periods will follow. Use this time to refine your execution, but do not change your strategy."
            };
        }

        // Default message
        return {
            diagnosis: "Drawdown is within normal limits.",
            reason: "Your account is not currently experiencing a significant drawdown.",
            action: "Continue executing your plan and monitoring your risk."
        };
        
    }, [journal, drawdownData]);

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Drawdown Coach
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

export default DrawdownCoach;
